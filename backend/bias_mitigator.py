"""
bias_mitigator.py — Pre / In / Post-processing bias mitigation strategies
"""
import numpy as np
import pandas as pd
from sklearn.utils import resample
from fairlearn.reductions import (
    DemographicParity,
    EqualizedOdds,
    ExponentiatedGradient,
)
from fairlearn.postprocessing import ThresholdOptimizer

from utils import safe_divide


class BiasMitigator:
    """
    Three-stage bias mitigation toolkit.

    ─ Pre-processing  : fix the *data* before training
    ─ In-processing   : add fairness *constraints* during training
    ─ Post-processing : adjust *predictions* after training
    """

    # ═══════════════════════════════════════════════════════════════════════════
    # PRE-PROCESSING
    # ═══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def reweigh_samples(
        df: pd.DataFrame, sensitive_col: str, target_col: str
    ) -> np.ndarray:
        """
        Assign sample weights so that each (group, label) combination has the
        frequency it would have if the sensitive attribute and the label were
        statistically independent (IBM AIF360 reweighing — no extra library needed).
        """
        n = len(df)
        weights = np.ones(n, dtype=float)
        for group in df[sensitive_col].unique():
            for label in df[target_col].unique():
                mask     = (df[sensitive_col] == group) & (df[target_col] == label)
                observed = mask.sum()
                if observed == 0:
                    continue
                g_count  = (df[sensitive_col] == group).sum()
                l_count  = (df[target_col] == label).sum()
                expected = (g_count * l_count) / n
                weights[mask] = safe_divide(expected, observed, default=1.0)
        return weights

    @staticmethod
    def resample_balanced(
        df: pd.DataFrame,
        sensitive_col: str,
        target_col: str,
        strategy: str = "oversample",
    ) -> pd.DataFrame:
        """Balance the (group × label) distribution using over-/under-sampling."""
        groups  = df.groupby([sensitive_col, target_col], group_keys=False)
        target_n = groups.size().max() if strategy == "oversample" else groups.size().min()

        resampled = [
            resample(grp, replace=(strategy == "oversample"),
                     n_samples=target_n, random_state=42)
            for _, grp in groups
        ]
        return pd.concat(resampled).reset_index(drop=True)

    @staticmethod
    def remove_proxy_features(
        df: pd.DataFrame,
        sensitive_col: str,
        threshold: float = 0.3,
    ) -> tuple[pd.DataFrame, list[str]]:
        """Drop features that are strongly correlated with the sensitive attribute."""
        df_num = df.select_dtypes(include=[np.number])
        if sensitive_col not in df_num.columns:
            from sklearn.preprocessing import LabelEncoder
            df_num = df_num.copy()
            df_num[sensitive_col] = LabelEncoder().fit_transform(df[sensitive_col].astype(str))

        corr = df_num.corr()[sensitive_col].abs()
        to_drop = corr[(corr > threshold) & (corr.index != sensitive_col)].index.tolist()
        return df.drop(columns=to_drop, errors="ignore"), to_drop

    # ═══════════════════════════════════════════════════════════════════════════
    # IN-PROCESSING
    # ═══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def train_fair_model(
        estimator,
        X_train,
        y_train,
        sensitive_train,
        constraint: str = "demographic_parity",
    ):
        """
        Wrap *estimator* in Fairlearn's ExponentiatedGradient so that fairness
        constraints are enforced during training.
        """
        constraint_obj = (
            DemographicParity() if constraint == "demographic_parity"
            else EqualizedOdds()
        )
        mitigator = ExponentiatedGradient(
            estimator=estimator,
            constraints=constraint_obj,
            max_iter=50,
        )
        mitigator.fit(X_train, y_train, sensitive_features=sensitive_train)
        return mitigator

    # ═══════════════════════════════════════════════════════════════════════════
    # POST-PROCESSING
    # ═══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def threshold_optimization(
        estimator,
        X_train,
        y_train,
        sensitive_train,
        constraint: str = "demographic_parity",
    ):
        """
        Fit Fairlearn's ThresholdOptimizer, which learns group-specific
        classification thresholds to satisfy the chosen fairness constraint.
        """
        postprocessor = ThresholdOptimizer(
            estimator=estimator,
            constraints=constraint,
            predict_method="predict_proba",
            prefit=False,
        )
        postprocessor.fit(X_train, y_train, sensitive_features=sensitive_train)
        return postprocessor

    # ═══════════════════════════════════════════════════════════════════════════
    # RECOMMENDATIONS
    # ═══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def get_mitigation_recommendations(audit: dict) -> list[dict]:
        """Translate a bias audit dict into human-readable, actionable recommendations."""
        recs: list[dict] = []
        ICON = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}

        dp = audit.get("demographic_parity", {})
        if not dp.get("is_fair", True):
            recs.append({
                "issue":        "Demographic Parity Violation",
                "severity":     "HIGH",
                "icon":         ICON["HIGH"],
                "description":  f"Positive prediction rate differs by {dp.get('difference', 0):.1%} across groups.",
                "fixes": [
                    "Apply reweighing to training samples (Pre-processing)",
                    "Use ExponentiatedGradient with DemographicParity (In-processing)",
                    "Use ThresholdOptimizer post-processing",
                ],
            })

        di = audit.get("disparate_impact", {})
        if not di.get("passes_80_percent_rule", True):
            sev = di.get("severity", "HIGH")
            recs.append({
                "issue":        "Disparate Impact — Fails 80 % Rule",
                "severity":     sev,
                "icon":         ICON[sev],
                "description":  f"Disparate impact ratio = {di.get('disparate_impact_ratio', 0):.2%}. Legal threshold is ≥ 0.80.",
                "fixes": [
                    "Resample data to balance group × label counts (Pre-processing)",
                    "Remove proxy variables correlated with the sensitive attribute",
                    "Apply in-processing fairness constraints",
                ],
            })

        eo = audit.get("equalized_odds", {})
        if not eo.get("is_fair", True):
            recs.append({
                "issue":        "Equalized Odds Violation",
                "severity":     "HIGH",
                "icon":         ICON["HIGH"],
                "description":  f"TPR/FPR differ by {eo.get('difference', 0):.1%} across groups.",
                "fixes": [
                    "ExponentiatedGradient with EqualizedOdds constraint (In-processing)",
                    "ThresholdOptimizer with equalized_odds constraint (Post-processing)",
                    "Per-group calibration",
                ],
            })

        if not recs:
            recs.append({
                "issue":        "No major bias detected",
                "severity":     "LOW",
                "icon":         ICON["LOW"],
                "description":  "Model appears fair across all measured dimensions.",
                "fixes":        ["Continue monitoring in production over time."],
            })
        return recs
