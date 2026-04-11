"""
bias_detector.py — Post-training model bias / fairness audit
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
)
from fairlearn.metrics import (
    MetricFrame,
    demographic_parity_difference,
    demographic_parity_ratio,
    equalized_odds_difference,
)

from utils import safe_divide

class BiasDetector:
    """
    Compute a comprehensive suite of fairness metrics for a trained classifier.
    """
    def __init__(self, y_true, y_pred, sensitive_features, y_prob=None, feature_importances=None, feature_names=None):
        self.y_true = np.asarray(y_true)
        self.y_pred = np.asarray(y_pred)
        self.sf     = np.asarray(sensitive_features)
        self.y_prob = np.asarray(y_prob) if y_prob is not None else None
        self.feature_importances = feature_importances
        self.feature_names = feature_names
        self.metrics: dict = {}

    def compute_demographic_parity(self) -> dict:
        diff  = demographic_parity_difference(self.y_true, self.y_pred, sensitive_features=self.sf)
        ratio = demographic_parity_ratio(self.y_true, self.y_pred, sensitive_features=self.sf)
        
        # compute raw rates for explainability
        groups = np.unique(self.sf)
        pos_rates = {}
        for g in groups:
            mask = self.sf == g
            pos_rates[str(g)] = round(float(np.mean(self.y_pred[mask])), 4) if np.sum(mask) > 0 else 0.0
            
        result = {
            "title": "Demographic / Statistical Parity",
            "difference":     round(float(diff), 4),
            "ratio":          round(float(ratio), 4),
            "positive_rates": pos_rates,
            "is_fair":        abs(diff) < 0.1,
            "interpretation": self._interpret("dp", diff),
            "explainability": {
                "what": "Measures if groups receive positive outcomes at similar rates regardless of true labels.",
                "why": "Crucial for avoiding systemic exclusion and ensuring representation in favorable decisions.",
                "suggests": "A high disparity means the model heavily favors predicting 'positive' for specific groups."
            }
        }
        self.metrics["demographic_parity"] = result
        return result

    def compute_equalized_odds_and_opportunity(self) -> dict:
        groups = np.unique(self.sf)
        group_rates = {}
        for g in groups:
            mask = self.sf == g
            yt = self.y_true[mask]
            yp = self.y_pred[mask]
            
            tp = np.sum((yt == 1) & (yp == 1))
            tn = np.sum((yt == 0) & (yp == 0))
            fp = np.sum((yt == 0) & (yp == 1))
            fn = np.sum((yt == 1) & (yp == 0))
            
            p = tp + fn
            n = tn + fp
            
            tpr = tp / p if p > 0 else 0.0
            fpr = fp / n if n > 0 else 0.0
            tnr = tn / n if n > 0 else 0.0
            fnr = fn / p if p > 0 else 0.0
            
            group_rates[str(g)] = {
                "TPR": round(float(tpr), 4),
                "FPR": round(float(fpr), 4),
                "TNR": round(float(tnr), 4),
                "FNR": round(float(fnr), 4),
            }
            
        tpr_vals = [r["TPR"] for r in group_rates.values()]
        fpr_vals = [r["FPR"] for r in group_rates.values()]
        
        tpr_diff = max(tpr_vals) - min(tpr_vals) if tpr_vals else 0.0
        fpr_diff = max(fpr_vals) - min(fpr_vals) if fpr_vals else 0.0
        
        overall_diff = max(tpr_diff, fpr_diff)
        
        result = {
            "title": "Equalized Odds & Opportunity (Error Rates)",
            "difference": round(float(overall_diff), 4),
            "tpr_difference": round(float(tpr_diff), 4),
            "fpr_difference": round(float(fpr_diff), 4),
            "group_rates": group_rates,
            "is_fair": overall_diff < 0.1,
            "interpretation": self._interpret("eo", overall_diff),
            "explainability": {
                "what": "Compares True Positive Rates (opportunity) and False Positive Rates across groups.",
                "why": "Ensures that the burden of model mistakes doesn't fall disproportionately on one demographic.",
                "suggests": "If TPR difference is high, one group is being unjustly denied qualified opportunities."
            }
        }
        self.metrics["equalized_odds"] = result
        return result

    def compute_disparate_impact(self) -> dict:
        groups = np.unique(self.sf)
        pos_rates: dict = {}
        for g in groups:
            mask = self.sf == g
            pos_rates[str(g)] = round(float(np.mean(self.y_pred[mask])), 4)

        vals = list(pos_rates.values())
        di   = safe_divide(min(vals), max(vals), default=1.0) if vals else 1.0
        severity = "HIGH" if di < 0.6 else "MEDIUM" if di < 0.8 else "LOW"
        result = {
            "title": "Disparate Impact Analysis",
            "disparate_impact_ratio":  round(di, 4),
            "passes_80_percent_rule":  di >= 0.8,
            "severity":                severity,
            "explainability": {
                "what": "Ratio of the lowest favorable outcome rate to the highest favorable outcome rate.",
                "why": "A standard legal metric in the US (the 80% rule) for determining adverse impact in hiring/lending.",
                "suggests": f"A ratio of {round(di,4)} indicates {'severe' if di<0.8 else 'acceptable'} disparity."
            }
        }
        self.metrics["disparate_impact"] = result
        return result

    def compute_predictive_parity(self) -> dict:
        groups = np.unique(self.sf)
        precs: dict = {}
        for g in groups:
            mask = self.sf == g
            precs[str(g)] = round(
                float(precision_score(self.y_true[mask], self.y_pred[mask], zero_division=0)),
                4,
            )
        vals = list(precs.values())
        diff = max(vals) - min(vals) if vals else 0.0
        result = {
            "title": "Predictive Parity (Precision Fairness)",
            "precision_by_group": precs,
            "max_difference":     round(diff, 4),
            "is_fair":            diff < 0.1,
            "explainability": {
                "what": "Measures if a positive prediction means the same thing across groups (Precision).",
                "why": "If precision is highly skewed, the model's 'yes' is reliable for one group but a guess for another.",
                "suggests": "A high difference means the model is confidently wrong more often for a specific group."
            }
        }
        self.metrics["predictive_parity"] = result
        return result

    def compute_calibration(self) -> dict:
        if self.y_prob is None:
            self.metrics["calibration"] = {"error": "Predicted probabilities not available. Model does not support score output.", "_missing": True}
            return self.metrics["calibration"]
            
        groups = np.unique(self.sf)
        group_means = {}
        for g in groups:
            mask = self.sf == g
            avg_prob = np.mean(self.y_prob[mask]) if np.sum(mask) > 0 else 0.0
            avg_true = np.mean(self.y_true[mask]) if np.sum(mask) > 0 else 0.0
            group_means[str(g)] = {"avg_prob": round(float(avg_prob), 4), "avg_true": round(float(avg_true), 4)}
            
        diffs = [abs(v["avg_prob"] - v["avg_true"]) for v in group_means.values()]
        max_calib_error = max(diffs) if diffs else 0.0
        
        result = {
            "title": "Calibration Fairness Assessment",
            "group_calibration": group_means,
            "max_calibration_error": round(float(max_calib_error), 4),
            "is_fair": max_calib_error < 0.1,
            "explainability": {
                "what": "Compares the model's assigned risk scores against actual true outcome rates.",
                "why": "Risk scores should mean the same thing. A 70% risk score should mean 70% real risk for all demographics.",
                "suggests": "Significant error means the model over or underestimates risk for certain groups."
            }
        }
        self.metrics["calibration"] = result
        return result

    def compute_feature_influence(self) -> dict:
        if self.feature_importances is None or self.feature_names is None:
            self.metrics["feature_influence"] = {"error": "Model does not expose feature importances.", "_missing": True}
            return self.metrics["feature_influence"]
            
        influences = sorted(zip(self.feature_names, self.feature_importances), key=lambda x: x[1], reverse=True)
        top_5 = {str(k): round(float(v), 4) for k, v in influences[:5]}
        
        result = {
            "title": "Feature Influence (Proxy Risk)",
            "top_influential_features": top_5,
            "explainability": {
                "what": "Identifies which columns most heavily govern the model's decisions.",
                "why": "Helps detect proxy discrimination (e.g., if 'Zipcode' is highly influential, it may proxy for Race/Income).",
                "suggests": "Review these specific variables closely. If they correlate with sensitive attributes, remove them."
            }
        }
        self.metrics["feature_influence"] = result
        return result
        
    def compute_theil_and_gini_index(self) -> dict:
        # Based on actual target vs predicted benefits
        # Use simple approximations for the hackathon
        b = np.where(self.y_pred == 1, 1, 0)
        mu = np.mean(b)
        
        if mu == 0 or mu == 1:
            theil = 0.0
            gini = 0.0
        else:
            # Theil T = 1/N * sum( (b_i/mu) * ln(b_i/mu) )
            # We handle zeros safely by dropping them from the log since limit x->0 x*log(x) is 0
            b_nonzero = b[b > 0]
            if len(b_nonzero) > 0:
                theil = np.mean((b_nonzero / mu) * np.log(b_nonzero / mu))
            else:
                theil = 0.0
                
            # Gini Coefficient (mean absolute difference / 2*mu)
            # Efficient computation of Gini
            b_sorted = np.sort(b)
            n = len(b)
            index = np.arange(1, n + 1)
            gini = (np.sum((2 * index - n - 1) * b_sorted)) / (n * np.sum(b_sorted)) if np.sum(b_sorted) > 0 else 0.0

        result = {
            "title": "Income/Utility Inequality (Theil & Gini)",
            "theil_index": round(float(theil), 4),
            "gini_coefficient": round(float(gini), 4),
            "is_fair": theil < 0.2 and gini < 0.3,
            "explainability": {
                "what": "Information-theoretic measures of overall outcome inequality across all individuals.",
                "why": "0 means perfect equality (everyone gets the same outcome), 1 means maximum inequality.",
                "suggests": "High values indicate the model assigns 'positive' outcomes to a concentrated few rather than distributing them broadly."
            }
        }
        self.metrics["inequality_indices"] = result
        return result

    def compute_advanced_error_metrics(self) -> dict:
        groups = np.unique(self.sf)
        confusion_matrices = {}
        treatment_equality = {}
        
        for g in groups:
            mask = self.sf == g
            yt = self.y_true[mask]
            yp = self.y_pred[mask]
            
            tp = int(np.sum((yt == 1) & (yp == 1)))
            tn = int(np.sum((yt == 0) & (yp == 0)))
            fp = int(np.sum((yt == 0) & (yp == 1)))
            fn = int(np.sum((yt == 1) & (yp == 0)))
            
            confusion_matrices[str(g)] = {"TP": tp, "TN": tn, "FP": fp, "FN": fn}
            
            # Treatment Equality = Ratio of FN to FP
            trt_eq = round(fn / fp, 4) if fp > 0 else float('inf') if fn > 0 else 1.0
            
            # Bound infinity for JSON
            if trt_eq == float('inf'):
                trt_eq = 999.0
            treatment_equality[str(g)] = trt_eq
            
        vals = [v for v in treatment_equality.values() if v != 999.0]
        trt_diff = max(vals) - min(vals) if vals else 0.0
            
        # Proxy for Individual Bias Score (Consistency)
        # Assuming similar features get similar predictions - mocked globally here for API speed
        consistency_score = round(float(np.mean(self.y_true == self.y_pred)), 4)
            
        result = {
            "title": "Advanced Error & Treatment Rates",
            "confusion_matrices": confusion_matrices,
            "treatment_equality_by_group": treatment_equality,
            "individual_consistency_proxy": consistency_score,
            "max_treatment_disparity": round(trt_diff, 4),
            "is_fair": trt_diff < 1.5,
            "explainability": {
                "what": "Looks closely at the raw counts of True/False Positives/Negatives. Treatment Equality compares False Negatives to False Positives.",
                "why": "A model is unfair if it makes mostly 'safe' False Negatives for Group A, but mostly 'punishing' False Positives for Group B.",
                "suggests": "If Treatment Disparity is high, the TYPE of errors the model makes is drastically different between groups."
            }
        }
        self.metrics["advanced_errors"] = result
        return result

    def full_bias_audit(self) -> dict:
        self.compute_demographic_parity()
        self.compute_equalized_odds_and_opportunity()
        self.compute_disparate_impact()
        self.compute_predictive_parity()
        self.compute_calibration()
        self.compute_feature_influence()
        self.compute_theil_and_gini_index()
        self.compute_advanced_error_metrics()
        
        score = self._fairness_score()
        ex = self._generate_executive_summary(score)
        rec = self._generate_recommendations()
        
        return {
            "metrics": self.metrics,
            "overall_fairness_score": score,
            "executive_summary": ex,
            "recommendations": rec,
            "limitations": [
                "Analysis constraints due to random forest predictions.",
                "Historical bias beyond what is captured in the labels cannot be measured."
            ]
        }

    def _fairness_score(self) -> float:
        scores: list[float] = []
        if "demographic_parity" in self.metrics:
            scores.append(max(0.0, 1 - abs(self.metrics["demographic_parity"]["difference"])) * 100)
        if "equalized_odds" in self.metrics:
            scores.append(max(0.0, 1 - abs(self.metrics["equalized_odds"]["difference"])) * 100)
        if "disparate_impact" in self.metrics:
            di = self.metrics["disparate_impact"]["disparate_impact_ratio"]
            scores.append(min(safe_divide(di, 0.8, 1.0), 1.0) * 100)
        return round(float(np.mean(scores)), 1) if scores else 0.0
        
    def _generate_executive_summary(self, score: float) -> dict:
        risk_level = "High Risk" if score < 70 else "Moderate Risk" if score < 85 else "Low Risk"
        
        findings = []
        if self.metrics.get("demographic_parity", {}).get("is_fair") == False:
            findings.append("Significant demographic disparity detected in positive outcome rates.")
        if self.metrics.get("equalized_odds", {}).get("is_fair") == False:
            findings.append("Harmful asymmetrical error rates (False Positives/Negatives) disproportionately affect specific groups.")
        if self.metrics.get("disparate_impact", {}).get("passes_80_percent_rule") == False:
            findings.append("Fails the standard 80% Disparate Impact rule, suggesting potential adverse impact.")
            
        if not findings:
            findings.append("No critical fairness violations detected across standard metrics.")
            
        return {
            "risk_level": risk_level,
            "key_findings": findings,
            "overall_status": f"The dataset exhibits {risk_level.lower()} regarding bias against this attribute."
        }
        
    def _generate_recommendations(self) -> list:
        recs = [
            "Maintain continuous monitoring of these metrics in production.",
            "Test model thresholds systematically across all protected groups to calibrate parity."
        ]
        if self.metrics.get("demographic_parity", {}).get("is_fair") == False:
            recs.append("Consider re-weighing the training dataset to correct the demographic imbalance.")
        if self.metrics.get("feature_influence") and not self.metrics.get("feature_influence").get("_missing"):
            recs.append("Audit the top influential features to ensure they are not acting as proxies for protected classes.")
        if self.metrics.get("equalized_odds", {}).get("is_fair") == False:
            recs.append("Investigate features that cause lower accuracy specifically for the disadvantaged group (e.g. data quality differences).")
        return recs

    def _interpret(self, metric: str, value: float) -> str:
        if abs(value) < 0.05:
            return "✅ Excellent — Highly symmetric outcomes/errors across groups."
        if abs(value) < 0.15:
            return "⚠️ Acceptable — Minor measurable disparities present."
        return "❌ Unfair — Significant disparity flagged in this dimension."
