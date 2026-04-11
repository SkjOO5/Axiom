"""
data_inspector.py — Pre-model dataset bias analysis
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

from utils import detect_sensitive_columns, safe_divide

class DataInspector:
    """Inspect a dataframe for representation bias, class imbalance, and proxies."""

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.sensitive_columns = detect_sensitive_columns(df)
        self.report: dict = {}

    def inspect_class_imbalance(self, target_col: str) -> dict:
        dist = self.df[target_col].value_counts(normalize=True)
        ratio = safe_divide(dist.max(), dist.min(), default=1.0)
        severity = "HIGH" if ratio > 3 else "MEDIUM" if ratio > 1.5 else "LOW"
        result = {
            "title": "Label Imbalance & Class Skew",
            "distribution":   dist.to_dict(),
            "imbalance_ratio": round(float(ratio), 2),
            "is_imbalanced":  ratio > 1.5,
            "severity":       severity,
            "explainability": {
                "what": "Checks if the target decisions (e.g., 'Approved' vs 'Denied') are heavily one-sided.",
                "why": "Models trained on skewed data often ignore the minority class entirely.",
                "suggests": "If ratio > 3, the model's high accuracy might be an illusion (it just predicts the majority class)."
            }
        }
        self.report["class_imbalance"] = result
        return result

    def inspect_representation(self, sensitive_col: str, target_col: str) -> dict:
        # Check if target_col exists
        if target_col not in self.df.columns:
             return {"error": "Target column missing", "_missing": True}
             
        ct = pd.crosstab(
            self.df[sensitive_col], self.df[target_col], normalize="index"
        )
        if ct.empty or len(ct.columns) < 2:
            return {"error": "Insufficient distinct targets for crosstab", "_missing": True}
            
        positive_col = ct.columns[-1]
        outcome_rates = {
            str(g): round(float(ct.loc[g, positive_col]), 4)
            for g in ct.index
        }
        rates = list(outcome_rates.values())
        max_disp = max(rates) - min(rates) if rates else 0.0
        severity  = "HIGH" if max_disp > 0.2 else "MEDIUM" if max_disp > 0.1 else "LOW"
        
        # Also compute raw group counts
        counts = self.df[sensitive_col].value_counts()
        total = len(self.df.dropna(subset=[sensitive_col]))
        group_counts = {str(k): {"count": int(v), "percentage": round(float(v/total)*100, 1)} for k,v in counts.items()}
        
        # Warnings for minority
        warnings = [f"Group '{k}' has very low representation ({v['count']} samples)." for k, v in group_counts.items() if v['percentage'] < 5.0]
        
        result = {
            "title": "Representation Bias & Outcome Disparity",
            "group_counts": group_counts,
            "low_sample_warnings": warnings,
            "outcome_rates_by_group": outcome_rates,
            "max_disparity":          round(max_disp, 4),
            "has_bias":               max_disp > 0.1,
            "severity":               severity,
            "explainability": {
                "what": "Measures group visibility in the dataset and baseline historical success rates.",
                "why": "If a group is poorly represented (<5%), the model cannot learn to treat them fairly.",
                "suggests": "Significant historical outcome disparity strongly indicates the data itself contains systemic bias."
            }
        }
        self.report[f"representation_{sensitive_col}"] = result
        return result

    def inspect_missing_data_bias(self, sensitive_col: str) -> dict:
        missing_by_group: dict = {}
        for group in self.df[sensitive_col].dropna().unique():
            gdf = self.df[self.df[sensitive_col] == group]
            pct = gdf.isnull().values.mean() * 100
            missing_by_group[str(group)] = round(float(pct), 2)
        vals = list(missing_by_group.values())
        disparity = max(vals) - min(vals) if vals else 0.0
        severity   = "HIGH" if disparity > 15 else "MEDIUM" if disparity > 5 else "LOW"
        result = {
            "title": "Missing-Data Bias",
            "missing_by_group": missing_by_group,
            "disparity":        round(disparity, 2),
            "has_bias":         disparity > 5,
            "severity":         severity,
            "explainability": {
                "what": "Checks whether empty cells/missing data disproportionately affect specific groups.",
                "why": "If missingness differs across demographics, data imputation methods will silently disadvantage one group.",
                "suggests": "A disparity > 5% means the data pipeline inherently struggles to capture information for certain groups equitably."
            }
        }
        self.report[f"missing_data_{sensitive_col}"] = result
        return result

    def inspect_proxy_variables(self, sensitive_col: str, threshold: float = 0.3) -> dict:
        df_work = self.df.select_dtypes(include=[np.number]).copy()

        if sensitive_col not in df_work.columns:
            le = LabelEncoder()
            # Handle NaNs before transform
            s_clean = self.df[sensitive_col].fillna("Unknown").astype(str)
            df_work[sensitive_col] = le.fit_transform(s_clean)

        corr = df_work.corr()[sensitive_col].drop(sensitive_col, errors="ignore")
        proxies = {k: round(float(v), 4) for k, v in corr.items() if abs(v) > threshold}
        result = {
            "title": "Proxy Discrimination Detection",
            "all_correlations": {k: round(float(v), 4) for k, v in corr.items()},
            "proxy_candidates": proxies,
            "has_proxies":      len(proxies) > 0,
            "explainability": {
                "what": "Identifies columns that dangerously correlate with the protected attribute.",
                "why": "Even if you drop 'Race', keeping a proxy like 'Zipcode' allows the model to continue discriminating.",
                "suggests": "Columns listed as proxy candidates should be heavily scrutinized or removed."
            }
        }
        self.report[f"proxy_variables_{sensitive_col}"] = result
        return result

    def inspect_data_quality_risk(self, sensitive_col: str) -> dict:
        # A synthesis of missing data and low sample warnings to indicate if bad data quality alone causes unfairness
        missing = self.inspect_missing_data_bias(sensitive_col)
        
        risk = "LOW"
        reasons = []
        if missing.get("severity") == "HIGH":
            risk = "HIGH"
            reasons.append("Severe missing data disparity across groups.")
            
        result = {
            "title": "Data Quality Fairness Risk",
            "risk_level": risk,
            "reasons": reasons,
            "explainability": {
                "what": "Evaluates if poor data quality alone produces unfair outcomes.",
                "why": "Garbage in, garbage out. If minority groups have noisier data, they will get worse predictions.",
                "suggests": "If risk is HIGH, no mathematical fix will work until the primary data collection pipeline is fixed."
            }
        }
        self.report[f"data_quality_{sensitive_col}"] = result
        return result

    def full_inspection(self, target_col: str) -> dict:
        results: dict = {
            "class_imbalance":            self.inspect_class_imbalance(target_col),
            "sensitive_columns_detected": self.sensitive_columns,
            "group_analyses":             {},
        }
        for col in self.sensitive_columns:
            results["group_analyses"][col] = {
                "representation": self.inspect_representation(col, target_col),
                "missing_data":   self.inspect_missing_data_bias(col),
                "proxy_variables": self.inspect_proxy_variables(col),
                "data_quality":    self.inspect_data_quality_risk(col)
            }
        return results
