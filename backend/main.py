import io
import os
import json
import time
import asyncio
import math
import re
import hmac
import hashlib
import secrets
import logging
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field
from bias_detector import BiasDetector
from bias_mitigator import BiasMitigator
from data_inspector import DataInspector
from database import (
    create_session, save_bias_audit, save_mitigation_result, update_session_status,
    supabase
)
from utils import detect_sensitive_columns, encode_categorical
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("axiom")

def _to_python(obj):
    """Recursively convert numpy scalars → Python natives so FastAPI can serialize."""
    if isinstance(obj, dict):
        return {k: _to_python(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_python(i) for i in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    if isinstance(obj, (np.floating,)):
        val = float(obj)
        return val if math.isfinite(val) else None
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj


def get_numeric_columns(df: pd.DataFrame) -> List[str]:
    return df.select_dtypes(include=[np.number]).columns.tolist()


def get_categorical_columns(df: pd.DataFrame) -> List[str]:
    return df.select_dtypes(include=["object", "category", "string", "bool"]).columns.tolist()


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare mixed-type data so statistical operations only run on numeric series."""
    df_safe = df.copy()

    if len(df_safe) == 0:
        return df_safe

    categorical_cols = get_categorical_columns(df_safe)
    for col in categorical_cols:
        try:
            converted = pd.to_numeric(df_safe[col], errors="coerce")
            if converted.notna().sum() / len(df_safe) > 0.5:
                df_safe[col] = converted
        except Exception:
            pass

    numeric_cols = get_numeric_columns(df_safe)
    categorical_cols = get_categorical_columns(df_safe)

    for col in numeric_cols:
        if df_safe[col].isnull().any():
            med = df_safe[col].median()
            df_safe[col] = df_safe[col].fillna(med if not pd.isna(med) else 0)

    for col in categorical_cols:
        if df_safe[col].isnull().any():
            mode = df_safe[col].mode(dropna=True)
            fallback = mode.iloc[0] if not mode.empty else "Unknown"
            df_safe[col] = df_safe[col].fillna(fallback)

    return df_safe


def prepare_target_column(df: pd.DataFrame, target_col: str) -> pd.DataFrame:
    """Convert target column to numeric/binary safely (supports Yes/No style labels)."""
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found.")

    yes_values = {"yes", "true", "1", "approved", "hired", "accepted", "pass", "positive"}
    no_values = {"no", "false", "0", "rejected", "not hired", "denied", "fail", "negative"}

    series = df[target_col]
    if not pd.api.types.is_numeric_dtype(series):
        s = series.astype(str).str.strip().str.lower()
        mapping: Dict[str, int] = {}
        uniques = [u for u in s.dropna().unique().tolist() if u not in {"nan", "none", ""}]

        for val in uniques:
            if val in yes_values:
                mapping[val] = 1
            elif val in no_values:
                mapping[val] = 0

        if len(mapping) < 2 and len(uniques) == 2:
            mapping = {uniques[0]: 1, uniques[1]: 0}

        if mapping:
            df[target_col] = s.map(mapping)
        else:
            df[target_col] = pd.Categorical(s).codes
            df.loc[df[target_col] < 0, target_col] = np.nan

    df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
    return df

app = FastAPI(title="Axiom API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("%s %s", request.method, request.url.path)
    try:
        response = await call_next(request)
        logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
        return response
    except Exception:
        logger.exception("%s %s -> ERROR", request.method, request.url.path)
        raise


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again.", "error_type": type(exc).__name__},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

SESSION_DATA = {}

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=8000)


class AnalysisContextPayload(BaseModel):
    hasActiveAnalysis: bool = False
    fileType: Optional[str] = None
    fileName: Optional[str] = None
    fairnessScore: Optional[float] = None
    riskLevel: Optional[str] = None
    keyFindings: List[str] = Field(default_factory=list)
    metrics: Dict[str, float] = Field(default_factory=dict)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversationHistory: List[ConversationTurn] = Field(default_factory=list)
    analysisContext: Optional[AnalysisContextPayload] = None


CHAT_SYSTEM_PROMPT = """You are AXiOM AI, an expert assistant for AI fairness, bias detection, and compliance.

Core scope:
- Explain fairness and bias concepts clearly and accurately.
- Explain and compare fairness metrics such as Demographic Parity, Disparate Impact, Equalized Odds, Equal Opportunity, Calibration, and related diagnostics.
- Guide users on how to use the AXiOM platform (uploading data, inspecting, auditing, and mitigation workflows).
- Provide practical remediation options (data, model, thresholding, governance, monitoring).
- Provide compliance-oriented guidance for EEOC, EU AI Act, GDPR, and similar frameworks.
- Use any provided analysis context to give tailored, context-aware responses.

Response style:
- Be concise but actionable.
- Prefer structured answers with bullet points, short tables, or checklists when helpful.
- If information is uncertain, say so and suggest what data would reduce uncertainty.
- Never invent AXiOM features that are not explicitly described by the provided context.

Safety:
- Do not provide legal advice; provide compliance guidance and recommend consulting counsel where appropriate.
- Do not claim certainty when only partial analysis context is provided.
"""

CHAT_RATE_LIMIT: Dict[str, List[float]] = {}

# Local auth store/session state for hackathon reliability.
AUTH_USERS_PATH = os.path.join(os.path.dirname(__file__), "auth_users.json")
AUTH_USERS: Dict[str, Dict[str, str]] = {}
AUTH_TOKENS: Dict[str, str] = {}


def _load_auth_users() -> None:
    global AUTH_USERS
    if not os.path.exists(AUTH_USERS_PATH):
        AUTH_USERS = {}
        return
    try:
        with open(AUTH_USERS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            AUTH_USERS = data if isinstance(data, dict) else {}
    except Exception:
        AUTH_USERS = {}


def _save_auth_users() -> None:
    with open(AUTH_USERS_PATH, "w", encoding="utf-8") as f:
        json.dump(AUTH_USERS, f, ensure_ascii=True, indent=2)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def _verify_password(password: str, salt: str, password_hash: str) -> bool:
    expected = _hash_password(password, salt)
    return hmac.compare_digest(expected, password_hash)


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2:
        return None
    if parts[0].lower() != "bearer":
        return None
    return parts[1].strip()


_load_auth_users()

# ─────────────────────────────────────────────────────────
# AUTH ENDPOINTS  (Supabase Auth)
# ─────────────────────────────────────────────────────────

@app.post("/api/auth/signup")
async def auth_signup(email: str = Form(...), password: str = Form(...)):
    """Register a new account using local auth storage."""
    email = _normalize_email(email)

    if not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if email in AUTH_USERS:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user_id = secrets.token_hex(8)
    salt = secrets.token_hex(16)
    AUTH_USERS[email] = {
        "id": user_id,
        "email": email,
        "salt": salt,
        "password_hash": _hash_password(password, salt),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save_auth_users()

    token = secrets.token_urlsafe(32)
    AUTH_TOKENS[token] = user_id

    return {
        "user": {
            "id": user_id,
            "email": email,
            "createdAt": AUTH_USERS[email]["created_at"],
        },
        "access_token": token,
        "token": token,
        "message": "Account created successfully.",
    }


@app.post("/api/auth/login")
async def auth_login(email: str = Form(...), password: str = Form(...)):
    """Log in with email + password using local auth storage."""
    email = _normalize_email(email)

    user = AUTH_USERS.get(email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not _verify_password(password, user["salt"], user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = secrets.token_urlsafe(32)
    AUTH_TOKENS[token] = user["id"]

    return {
        "user": {"id": user["id"], "email": user["email"]},
        "access_token": token,
        "token": token,
    }


@app.post("/api/auth/logout")
async def auth_logout(authorization: Optional[str] = Header(default=None)):
    """Sign out by invalidating the current local bearer token."""
    token = _extract_bearer_token(authorization)
    if token:
        AUTH_TOKENS.pop(token, None)
    return {"ok": True}


@app.get("/api/auth/me")
async def auth_me(authorization: Optional[str] = Header(default=None)):
    """Return current user from local bearer token."""
    token = _extract_bearer_token(authorization)
    if not token:
        return {"user": None}

    user_id = AUTH_TOKENS.get(token)
    if not user_id:
        return {"user": None}

    for user in AUTH_USERS.values():
        if user["id"] == user_id:
            return {"user": {"id": user["id"], "email": user["email"]}}
    return {"user": None}


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        if file is None:
            raise HTTPException(status_code=400, detail="No file provided")

        contents = await file.read()
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        max_size = 50 * 1024 * 1024

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        if len(contents) > max_size:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

        # --- Document / non-tabular file types: store but inform user ---
        DOCUMENT_TYPES = {".pdf", ".doc", ".docx", ".txt"}
        if ext in DOCUMENT_TYPES:
            SESSION_DATA['filename'] = filename
            SESSION_DATA['doc_contents'] = contents
            SESSION_DATA.pop('df', None)  # clear any previous dataset
            return {
                "file_type_notice": (
                    "File uploaded successfully. This file type is stored, but fairness analysis "
                    "currently works best with structured/tabular datasets like CSV or Excel."
                ),
                "columns": [],
                "sensitive_cols_detected": [],
                "row_count": 0,
                "preview": [],
                "missing_cells": 0,
            }

        # --- Tabular file types ---
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif ext in (".xlsx", ".xls"):
            # requires openpyxl (xlsx) or xlrd (xls) — install via: pip install openpyxl xlrd
            df = pd.read_excel(io.BytesIO(contents))
        elif ext == ".json":
            try:
                df = pd.read_json(io.BytesIO(contents))
                # Flatten if nested; if not tabular, fall through to error
                if not isinstance(df, pd.DataFrame) or df.empty:
                    raise ValueError("JSON does not appear to contain tabular data.")
            except Exception:
                SESSION_DATA['filename'] = filename
                SESSION_DATA.pop('df', None)
                return {
                    "file_type_notice": (
                        "JSON file uploaded. The structure could not be parsed as a tabular dataset. "
                        "Fairness analysis works best with array-of-objects JSON or CSV/Excel files."
                    ),
                    "columns": [],
                    "sensitive_cols_detected": [],
                    "row_count": 0,
                    "preview": [],
                    "missing_cells": 0,
                }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Please upload CSV, Excel (.xlsx/.xls), JSON, TXT, PDF, DOC, or DOCX.",
            )

        SESSION_DATA['df'] = df
        SESSION_DATA['filename'] = filename
        
        target_col_candidates = df.columns.tolist()
        sensitive_cols = detect_sensitive_columns(df)
        
        inspector = DataInspector(df)
        preview = json.loads(df.head(5).to_json(orient="records"))
        
        return {
            "columns": target_col_candidates,
            "sensitive_cols_detected": sensitive_cols,
            "row_count": len(df),
            "preview": preview,
            "missing_cells": int(df.isnull().sum().sum())
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing uploaded file: {str(e)}")


@app.post("/api/analyze-document")
async def analyze_document():
    filename = SESSION_DATA.get('filename', '')
    contents = SESSION_DATA.get('doc_contents', b'')
    if not filename or not contents:
        return {"error": "No document found in session. Please upload again."}
    
    ext = os.path.splitext(filename)[1].lower()
    text = ""
    
    try:
        if ext == ".txt":
            text = contents.decode("utf-8", errors="ignore")
        elif ext == ".pdf":
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(contents))
                text = " ".join([page.extract_text() or "" for page in reader.pages])
            except ImportError:
                text = "PDF parsing failed: PyPDF2 is not installed. (Heuristic analysis applied)."
        elif ext in (".doc", ".docx"):
            try:
                import docx
                doc = docx.Document(io.BytesIO(contents))
                text = " ".join([p.text for p in doc.paragraphs])
            except ImportError:
                text = "DOCX parsing failed: python-docx is not installed. (Heuristic analysis applied)."
    except Exception as e:
        text = f"Failed to extract text: {str(e)}"

    # Expanded Heuristic Text NLP Dictionaries (Phase 6.1)
    text_lower = text.lower()
    
    exclusionary_keywords = ["blacklist", "whitelist", "master", "slave", "native", "tribe", "grandfathered", "sanity check", "dummy", "pow wow", "spirit animal", "peanut gallery"]
    gendered_keywords = ["mankind", "manpower", "salesman", "chairman", "policeman", "guys", "he/his", "man-hours", "shrill", "bossy", "emotional", "hysterical", "man up", "boys club"]
    ageist_keywords = ["digital native", "energetic", "recent grad", "mature", "overqualified", "culture fit", "tech savvy", "youthful", "senior citizen", "elderly", "out of touch"]
    disability_keywords = ["crippled", "retarded", "confined to a wheelchair", "crazy", "blind spot", "tone deaf", "lame", "dumb", "insane", "bipolar", "OCD", "wheelchair bound"]
    lgbtq_keywords = ["husband", "wife", "maternity leave", "paternity leave", "sexual preference", "lifestyle choice", "homosexual", "transvestite", "opposite sex"]
    religious_keywords = ["sunday", "christmas", "easter", "church", "christian", "islamic terrorist", "jihad", "crusade", "god-given", "blessed"]
    socioeconomic_keywords = ["elite", "ivy league", "pedigree", "low-income", "ghetto", "trailer park", "white collar", "blue collar", "unskilled labor", "welfare"]
    nationality_keywords = ["alien", "foreigner", "illegal immigrant", "non-native speaker", "exotic", "first-world", "third-world", "developing nation"]
    racial_keywords = ["urban", "inner-city", "articulate", "diverse behavior", "normal hair", "flesh-colored", "ethnic", "thug", "model minority", "colorblind", "all lives matter"]
    
    governance_keywords = ["human oversight", "human-in-the-loop", "transparency", "appeal", "audit", "accountability", "review process", "fairness", "bias mitigate", "explainability", "recourse"]
    
    findings = []
    
    for kw in exclusionary_keywords:
        if kw in text_lower:
            findings.append(f"Exclusionary language detected: '{kw}'. Recommendation: Consider more inclusive alternatives.")
            
    for kw in gendered_keywords:
        if kw in text_lower:
            findings.append(f"Gender-coded language detected: '{kw}'. Recommendation: Ensure gender-neutral terminology.")
            
    for kw in ageist_keywords:
        if kw in text_lower:
            findings.append(f"Potentially ageist phrasing detected: '{kw}'. Recommendation: Focus on required skills, not tenure/age proxies.")
            
    for kw in disability_keywords:
        if kw in text_lower:
            findings.append(f"Disability-insensitive language detected: '{kw}'. Recommendation: Use person-first or identity-first inclusive terminology.")

    for kw in lgbtq_keywords:
        if kw in text_lower:
            findings.append(f"Heteronormative/Binary language detected: '{kw}'. Recommendation: Use inclusive terms like 'partner' or 'parental leave'.")

    for kw in religious_keywords:
        if kw in text_lower:
            findings.append(f"Religious bias/assumption detected: '{kw}'. Recommendation: Ensure neutrality if applicable to diverse audiences.")

    for kw in socioeconomic_keywords:
        if kw in text_lower:
            findings.append(f"Socioeconomic bias detected: '{kw}'. Recommendation: Avoid educational or class-based elitism/gatekeeping.")

    for kw in nationality_keywords:
        if kw in text_lower:
            findings.append(f"Nationality/Immigration bias detected: '{kw}'. Recommendation: Use precise, legally neutral descriptive terms.")

    for kw in racial_keywords:
        if kw in text_lower:
            findings.append(f"Potential racial dog-whistle or stereotype detected: '{kw}'. Recommendation: Use objective, direct language without coded meaning.")
            
    gov_found = [kw for kw in governance_keywords if kw in text_lower]
    gov_status = "Good" if len(gov_found) >= 2 else "Poor"
    
    # 6.2 Sentiment & Tone Analysis
    # Extremely basic heuristic for sentiment
    pos_words = ["excellent", "inclusive", "support", "empower", "fair", "growth", "opportunity", "safe", "collaborative"]
    neg_words = ["terminate", "blacklist", "violation", "penalty", "illegal", "exclude", "reject", "deny", "failure"]
    pos_count = sum(text_lower.count(w) for w in pos_words)
    neg_count = sum(text_lower.count(w) for w in neg_words)
    total_sentiment = pos_count + neg_count if (pos_count + neg_count) > 0 else 1
    pos_pct = round((pos_count / total_sentiment) * 100) if pos_count > 0 else 60
    neg_pct = round((neg_count / total_sentiment) * 100) if neg_count > 0 else 20
    neu_pct = 100 - pos_pct - neg_pct
    
    # Emotional manipulation/Power dynamics
    manipulation_flags = [kw for kw in ["reserve the right", "sole discretion", "without explanation", "immediate termination"] if kw in text_lower]
    power_dynamics = "High" if len(manipulation_flags) > 0 else "Low"

    tone = "Authoritative" if power_dynamics == "High" else "Empathetic" if pos_count > neg_count else "Formal"

    # 6.3 Word Frequency & Language Patterns
    words = text_lower.replace(".", "").replace(",", "").split()
    word_freq = {}
    for w in words:
        if len(w) > 4:
            word_freq[w] = word_freq.get(w, 0) + 1
    top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:20]
    word_cloud = [{"text": k, "value": v} for k, v in top_words]

    avg_sentence_len = len(words) / (text.count(".") + 1)
    readability_score = max(0, min(100, 100 - (avg_sentence_len * 2.5))) # Fast proxy for Flesch
    passive_voice_detected = "was " in text_lower or "were " in text_lower
    
    # 6.4 Contextual Risk Assessment
    domain = "General"
    if any(w in text_lower for w in ["employee", "hire", "salary", "termination"]):
        domain = "Employment"
    elif any(w in text_lower for w in ["loan", "credit", "mortgage", "apr"]):
        domain = "Lending"
    elif any(w in text_lower for w in ["patient", "diagnosis", "health", "treatment", "medical"]):
        domain = "Healthcare"
    
    domain_risk = "CRITICAL" if domain in ["Employment", "Lending", "Healthcare"] else "MEDIUM"
    
    # 6.5 Benchmark Comparison
    current_score = max(10, 95 - (len(findings) * 8))
    projected_score = min(98, current_score + (len(findings) * 8))
    
    if current_score >= 90:
        letter_grade = "A"
    elif current_score >= 80:
        letter_grade = "B"
    elif current_score >= 70:
        letter_grade = "C"
    elif current_score >= 60:
        letter_grade = "D"
    else:
        letter_grade = "F"

    # 6.8 Legal & Regulatory Compliance
    compliance = {
        "eeoc_title_vii": {"status": "Review Needed" if domain == "Employment" and len(findings) > 0 else "Likely Compliant"},
        "eu_ai_act": {"status": "Review Needed" if gov_status == "Poor" else "Likely Compliant"},
        "gdpr_art22": {"status": "Likely Non-Compliant" if power_dynamics == "High" else "Review Needed"},
        "fair_lending": {"status": "Likely Non-Compliant" if domain == "Lending" and len(findings) > 0 else "Likely Compliant"}
    }
    
    # Deep Schema Assembly
    risk_level = "High" if current_score < 70 else "Medium" if current_score < 85 else "Low"
    
    # Map findings to evidence-based schema
    structured_findings = []
    for f in findings:
        severity = "Critical" if "Exclusionary" in f or "Ageist" in f else "Warning"
        
        # safely extract the term in quotes
        evidence_text = "Analyzed section"
        if "'" in f:
            parts = f.split("'")
            if len(parts) >= 3:
                evidence_text = parts[1]
                
        structured_findings.append({
            "title": f.split(":")[0],
            "description": f,
            "severity": severity,
            "evidence": evidence_text,
            "suggestion": f.split("Recommendation:")[-1].strip() if "Recommendation:" in f else "Review phrasing",
        })
        
    if gov_status == "Poor":
         structured_findings.append({
            "title": "Governance Gap",
            "description": "Lack of defined human oversight or appeal process.",
            "severity": "Critical",
            "evidence": "Entire Document",
            "suggestion": "Establish specific AI accountability and human-in-the-loop clauses."
        })

    # 6.7 Auto-Generated Fixed Document
    import re
    fixed_text = text
    # Basic heuristic to replace biased terms while preserving some case
    replacement_map = {
        **{k: "primary/secondary" for k in ["master", "slave"]},
        **{k: "allowlist/denylist" for k in ["whitelist", "blacklist"]},
        **{k: "humanity" for k in ["mankind"]},
        **{k: "workforce" for k in ["manpower"]},
        **{k: "salesperson" for k in ["salesman"]},
        **{k: "chairperson" for k in ["chairman"]},
        **{k: "police officer" for k in ["policeman"]},
        **{k: "team" for k in ["guys", "boys club"]},
        **{k: "they/their" for k in ["he/his"]},
        **{k: " spouse " for k in [" husband ", " wife "]},
        **{k: "parental leave" for k in ["maternity leave", "paternity leave"]},
        **{k: "sexual orientation" for k in ["sexual preference", "lifestyle choice"]},
        **{k: "non-native speaker" for k in ["alien", "foreigner"]},
    }
    
    for bad_word, good_word in replacement_map.items():
        # simple case-insensitive replace for the hackathon prototype
        pattern = re.compile(re.escape(bad_word), re.IGNORECASE)
        fixed_text = pattern.sub(good_word, fixed_text)

    return {
        "summary": {
            "domain": domain,
            "overall_risk": risk_level,
            "fast_readiness": "Needs Urgent Review" if risk_level == "High" else "Ready for Deployment",
            "primary_concern": structured_findings[0]["title"] if structured_findings else "None"
        },
        "findings": structured_findings,
        "sentiment_and_tone": {
            "positive_pct": pos_pct,
            "neutral_pct": neu_pct,
            "negative_pct": neg_pct,
            "tone": tone,
            "power_dynamics": power_dynamics,
            "manipulation_flags": manipulation_flags
        },
        "language_patterns": {
            "readability_score": readability_score,
            "avg_sentence_length": round(avg_sentence_len, 1),
            "passive_voice": passive_voice_detected,
            "word_cloud": word_cloud
        },
        "contextual_risk": {
            "domain": domain,
            "base_risk": domain_risk,
            "affected_population": "High volume of applicants/users" if domain != "General" else "General audience"
        },
        "benchmarks": {
            "current_score": current_score,
            "industry_average": 72,
            "projected_score": projected_score,
            "letter_grade": letter_grade
        },
        "compliance": compliance,
        "governanceChecklist": {
            "human_oversight": "Present" if "human oversight" in gov_found else "Missing",
            "appeals": "Present" if "appeal" in gov_found else "Missing",
            "transparency": "Present" if "transparency" in gov_found else "Missing",
        },
        "extracted_text_preview": text, # Return full text for the highlighter View
        "fixed_document": fixed_text
    }

@app.post("/api/inspect")
async def run_inspection(target_col: str = Form(...)):
    df = SESSION_DATA.get('df')
    if df is None or not isinstance(df, pd.DataFrame):
        raise HTTPException(status_code=400, detail="No tabular dataset uploaded.")

    if target_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target_col}' does not exist in uploaded file.")
    
    counts = df[target_col].value_counts().to_dict()
    if len(counts) >= 2:
        vals = list(counts.values())
        highest = max(vals)
        lowest = min(vals)
        imbalance = highest / lowest if lowest > 0 else float(highest)
    else:
        imbalance = 1.0
        
    severity = "LOW"
    if imbalance > 3:
        severity = "HIGH"
    elif imbalance > 1.5:
        severity = "MEDIUM"
        
    preview = df.head(100).to_dict(orient="records")
    
    return _to_python({
        "distribution": counts,
        "imbalance_ratio": imbalance,
        "severity": severity,
        "preview_100": preview
    })

@app.post("/api/audit")
async def run_audit(target_col: str = Form(...), sensitive_cols: str = Form(...)):
    df = SESSION_DATA.get('df')
    if df is None or not isinstance(df, pd.DataFrame):
        return {"error": "No tabular dataset uploaded."}
    filename = SESSION_DATA.get('filename', 'api_upload')
        
    try:
        s_cols_list = [c.strip() for c in sensitive_cols.split(",") if c.strip()]
        if target_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{target_col}' does not exist in uploaded file.")
        missing_sensitive = [c for c in s_cols_list if c not in df.columns]
        if missing_sensitive:
            raise HTTPException(status_code=400, detail=f"Sensitive columns not found: {', '.join(missing_sensitive)}")

        df_work = preprocess_dataframe(df)
        df_work = prepare_target_column(df_work, target_col)
        
        feature_cols = [c for c in df_work.columns if c != target_col]
        
        df_clean = df_work[feature_cols + [target_col]].copy()
        
        # Drop rows where target is missing
        df_clean = df_clean.dropna(subset=[target_col])
        
        # Drop columns that are 100% empty
        df_clean = df_clean.dropna(axis=1, how='all')
        
        # Fill remaining missing values to prevent row loss
        for col in df_clean.columns:
            if col != target_col:
                if pd.api.types.is_numeric_dtype(df_clean[col]):
                    median_val = df_clean[col].median()
                    df_clean[col] = df_clean[col].fillna(median_val if not pd.isna(median_val) else 0)
                else:
                    mode = df_clean[col].mode(dropna=True)
                    df_clean[col] = df_clean[col].fillna(mode.iloc[0] if not mode.empty else 'Missing')
                    
        if len(df_clean) < 10:
             return {"error": f"Dataset contains too few valid rows ({len(df_clean)}) after cleaning. Need at least 10."}
             
        feature_cols = [c for c in df_clean.columns if c != target_col]
        df_enc, le_dict = encode_categorical(df_clean)
        
        X = df_enc[feature_cols]
        y = pd.to_numeric(df_enc[target_col], errors="coerce")
        valid_idx = y.notna()
        X = X.loc[valid_idx]
        y = y.loc[valid_idx]

        if y.nunique() < 2:
            raise HTTPException(status_code=400, detail="Target column must contain at least two distinct values after preprocessing.")
        
        if y.nunique() > 2:
            y = (y > y.median()).astype(int)
            
        # Ensure we have enough data to stratify
        stratify_param = y if len(df_clean) >= 20 and y.value_counts().min() >= 2 else None
            
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=stratify_param
        )
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        y_prob = None
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_test)
            if probs.shape[1] > 1:
                y_prob = probs[:, 1]
            else:
                y_prob = probs[:, 0]
                
        feature_importances = model.feature_importances_ if hasattr(model, "feature_importances_") else None
        feature_names = X_train.columns.tolist()
        
        acc = accuracy_score(y_test, y_pred)
        
        session = None
        try:
            session = create_session(
                dataset_name=filename,
                row_count=len(df),
                column_count=len(df.columns),
                target_column=target_col,
                sensitive_columns=s_cols_list
            )
        except Exception:
            session = None
        if session:
            SESSION_DATA['session_id'] = session['id']
            
        audits = {}
        if 'audit_db_ids' not in SESSION_DATA:
            SESSION_DATA['audit_db_ids'] = {}
            
        # Intersectional expansion
        if len(s_cols_list) >= 2:
            ix_name = f"{s_cols_list[0]} & {s_cols_list[1]}"
            df_enc[ix_name] = df_enc[s_cols_list[0]].astype(str) + "_" + df_enc[s_cols_list[1]].astype(str)
            if ix_name not in s_cols_list:
                s_cols_list.append(ix_name)
            
        for s_col in s_cols_list:
            if s_col not in df_enc.columns:
                continue
                
            sens_test = df_enc.loc[X_test.index, s_col].values
            
            detector = BiasDetector(y_test.values, y_pred, sens_test, y_prob=y_prob, feature_importances=feature_importances, feature_names=feature_names)
            audit = detector.full_bias_audit()
            
            # Combine with pre-training inspector data
            # To provide Data Quality Fairness Risk and Representation sizes
            inspector = DataInspector(df)
            ins_res = inspector.full_inspection(target_col)
            
            # Inject data quality into audit output
            if s_col in ins_res.get("group_analyses", {}):
                audit["data_quality"] = ins_res["group_analyses"][s_col].get("data_quality", {})
                audit["representation"] = ins_res["group_analyses"][s_col].get("representation", {})
                audit["missing_data"] = ins_res["group_analyses"][s_col].get("missing_data", {})
                
            audits[s_col] = audit
            
            if session:
                try:
                    saved = save_bias_audit(
                        session_id=session['id'],
                        sensitive_attribute=s_col,
                        audit_results=audit,
                        model_type="RandomForestClassifier",
                        model_accuracy=float(acc)
                    )
                    if saved:
                        SESSION_DATA['audit_db_ids'][s_col] = saved['id']
                except Exception:
                    pass
                    
        if session:
            try:
                update_session_status(session['id'], "completed")
            except Exception:
                pass
            
        SESSION_DATA['model_context'] = {
            'X_train': X_train, 'y_train': y_train,
            'X_test': X_test, 'y_test': y_test,
            'y_pred': y_pred, 'target_col': target_col,
            'df_enc': df_enc,
            'before_score': {k: v.get('overall_fairness_score', 0) for k,v in audits.items()},
            'before_acc': float(acc)
        }
        
        return JSONResponse(content=_to_python({"accuracy": acc, "audits": audits}))
    except HTTPException:
        raise
    except ValueError as e:
        msg = str(e)
        if "string dtype" in msg.lower() or "could not convert" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="Some columns contain text values that could not be analyzed statistically. Ensure the target column is numeric or Yes/No style values.",
            )
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis error: {str(e)}. Please check file format and target/sensitive columns.",
        )

@app.post("/api/mitigate")
async def run_mitigation(strategy: str = Form(...), sensitive_col: str = Form(...)):
    ctx = SESSION_DATA.get('model_context')
    if not ctx:
        return {"error": "Run audit first."}
        
    mitigator = BiasMitigator()
    try:
        X_train, y_train, X_test, y_test = ctx['X_train'], ctx['y_train'], ctx['X_test'], ctx['y_test']
        df_enc = ctx['df_enc']
        tc = ctx['target_col']
        
        if sensitive_col not in df_enc.columns:
            return {"error": f"Column {sensitive_col} not found for mitigation"}
            
        sens_train = df_enc.loc[X_train.index, sensitive_col].values
        sens_test = df_enc.loc[X_test.index, sensitive_col].values
        
        if "Reweighing" in strategy:
            tmp = X_train.copy()
            tmp[tc] = y_train.values
            tmp["_s"] = sens_train
            weights = mitigator.reweigh_samples(tmp, "_s", tc)
            m_new = RandomForestClassifier(n_estimators=100, random_state=42)
            m_new.fit(X_train, y_train, sample_weight=weights)
            y_new = m_new.predict(X_test)
        else:
            from sklearn.linear_model import LogisticRegression
            base = LogisticRegression(max_iter=1000, random_state=42)
            m_new = mitigator.threshold_optimization(base, X_train, y_train, sens_train, "demographic_parity")
            y_new = m_new.predict(X_test, sensitive_features=sens_test)
            
        det_new = BiasDetector(y_test.values, y_new, sens_test)
        audit_new = det_new.full_bias_audit()
        
        acc_new = accuracy_score(y_test, y_new)
        
        # SUPABASE INTEGRATION
        audit_db_ids = SESSION_DATA.get('audit_db_ids', {})
        audit_db_id = audit_db_ids.get(sensitive_col)
        
        if audit_db_id:
            before_scores = ctx.get('before_score', {})
            save_mitigation_result(
                audit_id=audit_db_id,
                strategy=strategy,
                before_score=before_scores.get(sensitive_col, 0),
                after_score=audit_new['overall_fairness_score'],
                before_accuracy=ctx.get('before_acc', 0),
                after_accuracy=float(acc_new)
            )

        return JSONResponse(content=_to_python({"accuracy": acc_new, "audit": audit_new}))
        
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}


@app.post("/api/chat")
async def chat_with_axiom_ai(payload: ChatRequest, request: Request):
    client_id = request.client.host if request.client else "unknown"
    now = time.time()
    recent = [ts for ts in CHAT_RATE_LIMIT.get(client_id, []) if now - ts < 60]
    if len(recent) >= 30:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a moment and try again.")
    recent.append(now)
    CHAT_RATE_LIMIT[client_id] = recent

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Chatbot is currently unavailable. Please configure the Gemini API key.")

    try:
        import google.generativeai as genai
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Gemini SDK is not installed. Add 'google-generativeai' to backend dependencies.",
        )

    try:
        genai.configure(api_key=api_key)
        configured_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        model_candidates = [
            configured_model,
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
        ]
        # Keep order while removing duplicates.
        model_candidates = list(dict.fromkeys(model_candidates))

        history = payload.conversationHistory[-20:]
        context_payload = payload.analysisContext.model_dump() if payload.analysisContext else None
        context_json = json.dumps(context_payload, ensure_ascii=False, indent=2)

        gemini_contents = [
            {
                "role": "user",
                "parts": [
                    "Current AXiOM analysis context (JSON). Use it when relevant and say when context is missing:\n"
                    + context_json
                ],
            }
        ]

        for turn in history:
            role = "model" if turn.role == "assistant" else "user"
            gemini_contents.append({"role": role, "parts": [turn.content]})

        gemini_contents.append({"role": "user", "parts": [payload.message]})

        response = None
        last_error = None
        for candidate in model_candidates:
            try:
                model = genai.GenerativeModel(
                    model_name=candidate,
                    generation_config={
                        "temperature": 0.7,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 1024,
                    },
                    safety_settings=[
                        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                    ],
                    system_instruction=CHAT_SYSTEM_PROMPT,
                )
                response = await asyncio.wait_for(
                    asyncio.to_thread(model.generate_content, gemini_contents),
                    timeout=30,
                )
                break
            except Exception as candidate_error:
                last_error = candidate_error
                err_text = str(candidate_error).lower()
                # Retry only for unsupported/missing model cases; otherwise fail fast.
                if ("not found" in err_text) or ("not supported" in err_text):
                    continue
                raise

        if response is None:
            raise RuntimeError(f"No compatible Gemini model available. Last error: {last_error}")

        reply = getattr(response, "text", None)
        if not reply:
            reply = "I could not generate a response right now. Please try rephrasing your question."

        return {
            "response": reply,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except TimeoutError:
        raise HTTPException(status_code=504, detail="Request timed out after 30 seconds. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        err_text = str(e)
        err_lower = err_text.lower()
        if "quota" in err_lower or "rate limit" in err_lower or "429" in err_lower:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota/rate limit exceeded for this key. Please check billing/quota and try again.",
            )
        if "api key" in err_lower or "permission" in err_lower or "unauthorized" in err_lower or "403" in err_lower:
            raise HTTPException(
                status_code=503,
                detail="Gemini API access failed for the configured key. Verify key validity and project permissions.",
            )
        raise HTTPException(status_code=500, detail=f"Gemini request failed: {err_text}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
