import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()

router = APIRouter()

# ──────────────────────────────────────────
# Gemini setup using the NEW google.genai SDK
# ──────────────────────────────────────────
GEMINI_AVAILABLE = False
gemini_client = None
ACTIVE_MODEL = None

SYSTEM_PROMPT = """You are AXiOM AI, an expert AI Fairness and Bias Detection assistant. You specialize in:
- Fairness metrics: Demographic Parity, Disparate Impact (0.8 threshold/4-5ths rule), Equal Opportunity, Equalized Odds, Predictive Parity, Calibration, Theil Index, Counterfactual Fairness
- Bias detection in datasets (gender, race, age, disability, religion, LGBTQ+, socioeconomic)
- Proxy variable detection (zip code→race, name→ethnicity, university→socioeconomic status)
- Intersectional analysis (cross-attribute bias)
- Regulatory compliance (US EEOC Title VII, EU AI Act, GDPR Art.22, ECOA, ACA §1557)
- NLP bias in documents (gendered language, coded terms, ableist language, governance gaps)
- Remediation strategies (pre/in/post-processing debiasing)
- The AXiOM platform usage and features

Be concise (100-300 words), use markdown, give actionable advice. If the user has analysis context, reference their specific results. Politely redirect off-topic questions to AI fairness."""

# Model fallback chain (new SDK model names)
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
]

try:
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY not set in .env")
    else:
        gemini_client = genai.Client(api_key=api_key)
        # Set the primary model — fallback happens per-request
        ACTIVE_MODEL = MODELS[0]
        GEMINI_AVAILABLE = True
        print(f"[OK] Gemini client ready. Primary model: {ACTIVE_MODEL}")

except ImportError:
    print("[ERROR] google-genai not installed. Run: pip install google-genai")
except Exception as e:
    print(f"[ERROR] Gemini init error: {e}")


# ──────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class AnalysisContext(BaseModel):
    hasActiveAnalysis: bool = False
    fileType: Optional[str] = None
    fileName: Optional[str] = None
    fairnessScore: Optional[float] = None
    riskLevel: Optional[str] = None
    keyFindings: Optional[List[str]] = None

class ChatRequest(BaseModel):
    message: str
    conversationHistory: Optional[List[ChatMessage]] = []
    analysisContext: Optional[AnalysisContext] = None


# ──────────────────────────────────────────
# Chat endpoint
# ──────────────────────────────────────────
@router.post("/api/chat")
async def chat(request: ChatRequest):
    if not GEMINI_AVAILABLE or not gemini_client or not ACTIVE_MODEL:
        return {
            "response": "⚠️ AI assistant is initializing. Please restart the backend and try again.",
            "timestamp": datetime.utcnow().isoformat(),
            "error": True,
        }

    try:
        from google import genai
        from google.genai import types

        # Build conversation history
        history = []
        for msg in (request.conversationHistory or [])[-20:]:
            role = "user" if msg.role == "user" else "model"
            history.append(types.Content(role=role, parts=[types.Part(text=msg.content)]))

        # Prepend analysis context to the user message if available
        user_message = request.message
        if request.analysisContext and request.analysisContext.hasActiveAnalysis:
            ctx = request.analysisContext
            user_message = (
                f"[USER HAS ACTIVE ANALYSIS:\n"
                f"File: {ctx.fileName} ({ctx.fileType})\n"
                f"Score: {ctx.fairnessScore}/100 | Risk: {ctx.riskLevel}\n"
                f"Findings: {', '.join(ctx.keyFindings or [])}]\n\n"
                f"{request.message}"
            )

        # Try models with fallback in case of transient errors
        last_error = None
        response = None
        for model_name in MODELS:
            try:
                chat_session = gemini_client.chats.create(
                    model=model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.7,
                        top_p=0.95,
                        max_output_tokens=1024,
                    ),
                    history=history,
                )
                response = chat_session.send_message(user_message)
                break  # success — stop trying
            except Exception as e:
                err_str = str(e)
                last_error = e
                # Only fallback on transient/unavailable errors, not quota errors
                if "503" in err_str or "UNAVAILABLE" in err_str or "404" in err_str or "NOT_FOUND" in err_str:
                    print(f"[WARN] {model_name} unavailable, trying next...")
                    continue
                raise  # re-raise quota/auth errors immediately

        if response is None:
            raise last_error or Exception("All models failed")

        return {
            "response": response.text,
            "timestamp": datetime.utcnow().isoformat(),
            "error": False,
        }

    except Exception as e:
        error_str = str(e)
        print(f"Chat error: {error_str}")

        if "quota" in error_str.lower() or "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            msg = "⚠️ Rate limit reached. Please wait 30 seconds and try again."
        elif "API_KEY_INVALID" in error_str or "401" in error_str:
            msg = "⚠️ API key is invalid. Please contact the administrator."
        elif "blocked" in error_str.lower() or "safety" in error_str.lower():
            msg = "I can't respond to that specific query. Try asking about bias metrics, regulatory compliance, or how to interpret your analysis results."
        else:
            msg = "⚠️ Something went wrong. Please try again."

        return {
            "response": msg,
            "timestamp": datetime.utcnow().isoformat(),
            "error": True,
        }
