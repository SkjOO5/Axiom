# database.py
import os
import json
from datetime import datetime
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

def get_supabase_client():
    """Initialize Supabase client"""
    if not HAS_SUPABASE:
        raise ImportError("Supabase python package is not installed.")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY variables.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    supabase = get_supabase_client()
except Exception as e:
    supabase = None
    print(f"Warning: Supabase disabled - {e}")


# ============ ANALYSIS SESSIONS ============

def create_session(dataset_name, row_count, column_count, 
                   target_column, sensitive_columns, user_email=None):
    if not supabase: return None
    data = {
        "dataset_name": dataset_name,
        "row_count": row_count,
        "column_count": column_count,
        "target_column": target_column,
        "sensitive_columns": sensitive_columns,
        "user_email": user_email,
        "status": "in_progress"
    }
    response = supabase.table("analysis_sessions").insert(data).execute()
    return response.data[0] if response.data else None


def update_session_status(session_id, status):
    if not supabase: return None
    response = (
        supabase.table("analysis_sessions")
        .update({"status": status})
        .eq("id", session_id)
        .execute()
    )
    return response.data


def get_all_sessions():
    if not supabase: raise Exception("Supabase is not initialized.")
    response = (
        supabase.table("analysis_sessions")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


def get_session(session_id):
    if not supabase: return None
    response = (
        supabase.table("analysis_sessions")
        .select("*")
        .eq("id", session_id)
        .execute()
    )
    return response.data[0] if response.data else None


# ============ BIAS AUDITS ============

def save_bias_audit(session_id, sensitive_attribute, audit_results, 
                    model_type, model_accuracy):
    if not supabase: return None
    
    def convert(obj):
        import numpy as np
        if isinstance(obj, (np.integer,)): return int(obj)
        elif isinstance(obj, (np.floating,)): return float(obj)
        elif isinstance(obj, np.ndarray): return obj.tolist()
        elif isinstance(obj, np.bool_): return bool(obj)
        return obj
    
    clean_report = json.loads(json.dumps(audit_results, default=convert))
    
    data = {
        "session_id": session_id,
        "sensitive_attribute": sensitive_attribute,
        "fairness_score": float(audit_results.get('overall_fairness_score', 0)),
        "demographic_parity_diff": float(
            audit_results.get('demographic_parity', {}).get('difference', 0)
        ),
        "equalized_odds_diff": float(
            audit_results.get('equalized_odds', {}).get('difference', 0)
        ),
        "disparate_impact_ratio": float(
            audit_results.get('disparate_impact', {}).get('disparate_impact_ratio', 0)
        ),
        "passes_80_percent_rule": bool(
            audit_results.get('disparate_impact', {}).get('passes_80_percent_rule', False)
        ),
        "model_type": model_type,
        "model_accuracy": float(model_accuracy),
        "full_report": clean_report
    }
    response = supabase.table("bias_audits").insert(data).execute()
    return response.data[0] if response.data else None


def get_audits_for_session(session_id):
    if not supabase: return []
    response = (
        supabase.table("bias_audits")
        .select("*")
        .eq("session_id", session_id)
        .execute()
    )
    return response.data


# ============ MITIGATION RESULTS ============

def save_mitigation_result(audit_id, strategy, before_score, after_score,
                           before_accuracy, after_accuracy, details=None):
    if not supabase: return None
    improvement = after_score - before_score
    data = {
        "audit_id": audit_id,
        "strategy": strategy,
        "fairness_score_before": float(before_score),
        "fairness_score_after": float(after_score),
        "accuracy_before": float(before_accuracy),
        "accuracy_after": float(after_accuracy),
        "improvement_percentage": float(improvement),
        "details": details or {}
    }
    response = supabase.table("mitigation_results").insert(data).execute()
    return response.data[0] if response.data else None


# ============ FILE UPLOAD ============

def upload_dataset_file(session_id, file_name, file_content):
    if not supabase: return None
    file_path = f"{session_id}/{file_name}"
    response = supabase.storage.from_("datasets").upload(file_path, file_content)
    supabase.table("uploaded_datasets").insert({
        "session_id": session_id,
        "file_name": file_name,
        "file_path": file_path
    }).execute()
    return file_path


def get_file_url(file_path):
    if not supabase: return None
    return supabase.storage.from_("datasets").get_public_url(file_path)
