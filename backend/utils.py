"""
utils.py — Shared helper functions for Axiom
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder


# ─── Sensitive-attribute keywords ────────────────────────────────────────────
SENSITIVE_KEYWORDS = [
    "gender", "sex", "race", "ethnicity", "age", "religion",
    "disability", "marital", "nationality", "color", "origin",
    "orientation", "pregnant", "veteran", "caste", "tribe",
]


def load_dataset(file_path_or_buffer) -> pd.DataFrame:
    """Load a CSV or Excel file (path or file-like object)."""
    if isinstance(file_path_or_buffer, str):
        if file_path_or_buffer.endswith(".xlsx"):
            return pd.read_excel(file_path_or_buffer)
        return pd.read_csv(file_path_or_buffer)
    return pd.read_csv(file_path_or_buffer)


def detect_sensitive_columns(df: pd.DataFrame) -> list[str]:
    """Auto-detect columns that are likely protected/sensitive attributes."""
    sensitive = []
    for col in df.columns:
        normalised = col.lower().replace("_", " ").replace("-", " ")
        if any(kw in normalised for kw in SENSITIVE_KEYWORDS):
            sensitive.append(col)
    return sensitive


def get_column_stats(df: pd.DataFrame, column: str) -> dict:
    """Return basic distribution statistics for a single column."""
    return {
        "unique_values": int(df[column].nunique()),
        "null_count": int(df[column].isnull().sum()),
        "null_percentage": round(df[column].isnull().sum() / len(df) * 100, 2),
        "distribution": df[column].value_counts().to_dict(),
    }


def encode_categorical(
    df: pd.DataFrame, columns: list[str] | None = None
) -> tuple[pd.DataFrame, dict]:
    """
    Encode categorical columns with LabelEncoder.
    Returns (encoded_df, label_encoder_dict).
    """
    df_encoded = df.copy()
    le_dict: dict = {}

    if columns is None:
        columns = df.select_dtypes(include=["object", "category"]).columns.tolist()

    for col in columns:
        le = LabelEncoder()
        df_encoded[col] = le.fit_transform(df[col].astype(str))
        le_dict[col] = le

    return df_encoded, le_dict


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Division that never raises ZeroDivisionError."""
    return numerator / denominator if denominator != 0 else default


def severity_label(value: float, thresholds: tuple[float, float] = (0.1, 0.2)) -> str:
    """Map a numeric disparity to 'LOW', 'MEDIUM', or 'HIGH'."""
    low, high = thresholds
    if abs(value) < low:
        return "LOW"
    if abs(value) < high:
        return "MEDIUM"
    return "HIGH"


def generate_synthetic_demo() -> pd.DataFrame:
    """
    Generate a synthetic loan-approval dataset with intentional group-level bias
    so that the bias-detection pipeline triggers meaningful flags.
    """
    rng = np.random.default_rng(42)
    n = 3_000

    gender   = rng.choice(["Male", "Female"],        n, p=[0.55, 0.45])
    race     = rng.choice(["White", "Black", "Hispanic", "Asian"], n, p=[0.50, 0.25, 0.15, 0.10])
    age      = rng.integers(22, 65, n).astype(int)
    edu_yrs  = rng.integers(10, 22, n).astype(int)
    credit   = rng.integers(350, 850, n).astype(int)
    income   = rng.integers(20_000, 120_000, n).astype(int)
    exp_yrs  = rng.integers(0, 30, n).astype(int)

    # Biased approval probabilities
    base  = 0.40 + (credit - 600) / 1_200 + (income - 60_000) / 400_000
    base += np.where(gender == "Female", -0.12, 0.0)
    base += np.where(race == "Black",    -0.18, 0.0)
    base += np.where(race == "Hispanic", -0.10, 0.0)
    prob  = np.clip(base, 0.05, 0.95)

    approved = rng.binomial(1, prob).astype(int)

    return pd.DataFrame({
        "age":           age,
        "gender":        gender,
        "race":          race,
        "education_years": edu_yrs,
        "credit_score":  credit,
        "annual_income": income,
        "experience_years": exp_yrs,
        "approved":      approved,
    })
