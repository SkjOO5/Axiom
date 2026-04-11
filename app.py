"""
app.py — Axiom
Hackathon-ready Streamlit dashboard
"""

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from database import (
    create_session, save_bias_audit, save_mitigation_result,
    get_all_sessions, get_audits_for_session, update_session_status,
    upload_dataset_file
)
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from bias_detector import BiasDetector
from bias_mitigator import BiasMitigator
from data_inspector import DataInspector
from utils import detect_sensitive_columns, encode_categorical, generate_synthetic_demo

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE CONFIG & CUSTOM CSS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.set_page_config(
    page_title="Axiom",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* ── Dark gradient background ── */
.stApp {
    background: linear-gradient(135deg, #0a0e1a 0%, #0d1421 40%, #0a1628 100%);
    color: #e2e8f0;
}

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
    border-right: 1px solid #334155;
}

/* ── Hero banner ── */
.hero {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%);
    border: 1px solid #4f46e5;
    border-radius: 16px;
    padding: 2.5rem 3rem;
    margin-bottom: 2rem;
    text-align: center;
    box-shadow: 0 0 60px rgba(79,70,229,0.25);
}
.hero h1 {
    font-size: 2.8rem;
    font-weight: 800;
    background: linear-gradient(90deg, #a78bfa, #60a5fa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
}
.hero p {
    color: #94a3b8;
    font-size: 1.05rem;
    margin-top: 0.6rem;
}

/* ── Metric cards ── */
[data-testid="stMetric"] {
    background: rgba(30,27,75,0.6);
    border: 1px solid #4338ca;
    border-radius: 12px;
    padding: 1rem 1.2rem;
    backdrop-filter: blur(8px);
    transition: transform 0.2s, box-shadow 0.2s;
}
[data-testid="stMetric"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(79,70,229,0.3);
}

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {
    background: rgba(15,23,42,0.8);
    border-radius: 12px;
    padding: 4px;
    gap: 2px;
    border: 1px solid #334155;
}
.stTabs [data-baseweb="tab"] {
    border-radius: 8px;
    color: #94a3b8;
    font-weight: 500;
    padding: 0.5rem 1.2rem;
    transition: all 0.2s;
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
    color: white !important;
    box-shadow: 0 4px 15px rgba(79,70,229,0.4);
}

/* ── Action buttons ── */
.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.6rem 2rem;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(79,70,229,0.4);
}
.stButton > button[kind="primary"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(79,70,229,0.5);
}

/* ── Expanders ── */
details {
    background: rgba(15,23,42,0.7);
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 0.5rem;
}

/* ── Section headers ── */
.section-header {
    color: #a78bfa;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 1.5rem 0 0.75rem;
    border-bottom: 1px solid #4f46e5;
    padding-bottom: 0.4rem;
}

/* ── Badge pills ── */
.badge-high   { background:#ef444433;color:#f87171;border:1px solid #ef4444; padding:2px 10px;border-radius:99px;font-size:0.78rem;font-weight:600;}
.badge-medium { background:#f59e0b33;color:#fbbf24;border:1px solid #f59e0b; padding:2px 10px;border-radius:99px;font-size:0.78rem;font-weight:600;}
.badge-low    { background:#10b98133;color:#34d399;border:1px solid #10b981; padding:2px 10px;border-radius:99px;font-size:0.78rem;font-weight:600;}

/* ── Info / warning/ success boxes ── */
.stAlert {border-radius:10px;}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HELPERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEV_ICON = {"HIGH": "🔴", "MEDIUM": "🟡", "LOW": "🟢"}
SEV_COLOR = {"HIGH": "#ef4444", "MEDIUM": "#f59e0b", "LOW": "#10b981"}

PLOTLY_THEME = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#e2e8f0", family="Inter"),
    colorway=["#818cf8", "#34d399", "#fb923c", "#f472b6", "#38bdf8", "#facc15"],
)


def styled_chart(fig: go.Figure) -> go.Figure:
    fig.update_layout(**PLOTLY_THEME)
    fig.update_xaxes(gridcolor="#1e293b", linecolor="#334155")
    fig.update_yaxes(gridcolor="#1e293b", linecolor="#334155")
    return fig


def gauge(value: float, title: str) -> go.Figure:
    color = "#ef4444" if value < 50 else "#f59e0b" if value < 75 else "#10b981"
    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=value,
        number={"suffix": "/100", "font": {"size": 30, "color": color}},
        title={"text": title, "font": {"size": 14, "color": "#94a3b8"}},
        gauge={
            "axis": {"range": [0, 100], "tickcolor": "#475569"},
            "bar": {"color": color, "thickness": 0.25},
            "bgcolor": "#1e293b",
            "bordercolor": "#334155",
            "steps": [
                {"range": [0, 50],  "color": "#1a0a0a"},
                {"range": [50, 75], "color": "#1a130a"},
                {"range": [75, 100],"color": "#0a1a12"},
            ],
            "threshold": {
                "line": {"color": "#a78bfa", "width": 3},
                "thickness": 0.8,
                "value": 80,
            },
        },
    ))
    fig.update_layout(height=220, margin=dict(t=50, b=10, l=20, r=20), **PLOTLY_THEME)
    return fig


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HERO BANNER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown("""
<div class="hero">
  <h1>⚖️ Axiom</h1>
  <p>Inspect datasets & AI models for hidden bias · Measure · Flag · Fix</p>
</div>
""", unsafe_allow_html=True)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SIDEBAR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
with st.sidebar:
    st.markdown("## 📂 Data Source")
    use_demo = st.checkbox("✨ Use built-in synthetic demo", value=True)
    uploaded = st.file_uploader("… or upload your own CSV", type=["csv"])

    st.markdown("---")
    st.markdown("### ℹ️ About")
    st.markdown(
        "Axiom detects and mitigates bias in AI decision systems using "
        "**Fairlearn** metrics and mitigation algorithms.",
    )
    st.markdown("---")
    st.markdown(
        "<small style='color:#64748b'>Built for the AI Fairness Hackathon 🏆</small>",
        unsafe_allow_html=True,
    )

# ======= Add to SIDEBAR — Past Sessions =======
st.sidebar.markdown("---")
st.sidebar.header("📜 Past Analyses")

try:
    past_sessions = get_all_sessions()
    if past_sessions:
        for session in past_sessions[:5]:  # Show last 5
            st.sidebar.markdown(
                f"**{session['dataset_name']}** — "
                f"{session['created_at'][:10]} — "
                f"Status: {session['status']}"
            )
    else:
        st.sidebar.write("No past analyses yet.")
except Exception as e:
    st.sidebar.warning(f"Backend not connected: {str(e)[:50]}")

# ── Load data ─────────────────────────────────────────────────────────────────
if uploaded:
    df = pd.read_csv(uploaded)
    st.sidebar.success(f"Loaded **{len(df):,} rows** × **{len(df.columns)} cols**")
elif use_demo:
    df = generate_synthetic_demo()
    st.sidebar.info(f"Demo dataset: **{len(df):,} rows** (synthetic loan approval)")
else:
    st.info("👈 Enable the demo dataset or upload a CSV to get started.")
    st.stop()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOP-LEVEL METRICS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("📦 Rows",          f"{len(df):,}")
c2.metric("📊 Columns",       len(df.columns))
c3.metric("🔢 Numeric",       len(df.select_dtypes(include=[np.number]).columns))
c4.metric("🔤 Categorical",   len(df.select_dtypes(include=["object"]).columns))
c5.metric("❓ Missing cells", f"{df.isnull().sum().sum():,}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
st.markdown('<p class="section-header">⚙️ Configuration</p>', unsafe_allow_html=True)
cfg_col1, cfg_col2 = st.columns(2)

with cfg_col1:
    target_col = st.selectbox("🎯 Target column (what the model predicts)", df.columns)

with cfg_col2:
    auto_sensitive = detect_sensitive_columns(df)
    sensitive_cols = st.multiselect(
        "🔒 Sensitive / protected attribute columns",
        df.columns.tolist(),
        default=auto_sensitive,
    )

if not sensitive_cols:
    st.warning("Please select at least one sensitive attribute column to continue.")
    st.stop()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TABS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
tab_data, tab_model, tab_mitigate, tab_report = st.tabs([
    "📋 Data Inspection",
    "🤖 Model & Bias Audit",
    "🔧 Bias Mitigation",
    "📄 Report",
])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1 — DATA INSPECTION
# ══════════════════════════════════════════════════════════════════════════════
with tab_data:
    st.markdown("## 📋 Pre-Model Dataset Bias Inspection")

    inspector = DataInspector(df)

    # Raw data preview
    with st.expander("🔍 Preview raw data (first 100 rows)"):
        st.dataframe(df.head(100), use_container_width=True)

    # ── Class imbalance ──────────────────────────────────────────────────────
    st.markdown("### 1️⃣ Target Variable Distribution")
    imb = inspector.inspect_class_imbalance(target_col)
    d_col1, d_col2 = st.columns([2, 1])

    with d_col1:
        fig_tgt = px.bar(
            x=[str(k) for k in imb["distribution"].keys()],
            y=list(imb["distribution"].values()),
            labels={"x": target_col, "y": "Proportion"},
            title=f"Distribution of `{target_col}`",
            color=[str(k) for k in imb["distribution"].keys()],
            color_discrete_sequence=["#818cf8", "#34d399", "#fb923c"],
        )
        st.plotly_chart(styled_chart(fig_tgt), use_container_width=True)

    with d_col2:
        sev = imb["severity"]
        st.markdown(f"""
**Imbalance Ratio:** `{imb['imbalance_ratio']}x`  
**Severity:** <span class='badge-{sev.lower()}'>{SEV_ICON[sev]} {sev}</span>
        """, unsafe_allow_html=True)
        if imb["is_imbalanced"]:
            st.warning("⚠️ Class imbalance detected — model may be biased toward the majority class.")
        else:
            st.success("✅ Target classes are fairly balanced.")

    # ── Per-sensitive-column analysis ────────────────────────────────────────
    for sens_col in sensitive_cols:
        st.markdown(f"---\n### 2️⃣ Analysis for: `{sens_col}`")
        a_col1, a_col2 = st.columns(2)

        with a_col1:
            rep = inspector.inspect_representation(sens_col, target_col)
            fig_rep = px.bar(
                x=list(rep["outcome_rates_by_group"].keys()),
                y=list(rep["outcome_rates_by_group"].values()),
                title=f"Positive Outcome Rate by {sens_col}",
                labels={"x": sens_col, "y": "Positive Rate"},
                color=list(rep["outcome_rates_by_group"].keys()),
                text_auto=".1%",
            )
            avg = np.mean(list(rep["outcome_rates_by_group"].values()))
            fig_rep.add_hline(
                y=avg, line_dash="dot", line_color="#a78bfa",
                annotation_text=f"Avg {avg:.1%}",
            )
            st.plotly_chart(styled_chart(fig_rep), use_container_width=True)
            sev_r = rep["severity"]
            st.markdown(
                f"Max Disparity: **{rep['max_disparity']:.1%}** — "
                f"<span class='badge-{sev_r.lower()}'>{SEV_ICON[sev_r]} {sev_r}</span>",
                unsafe_allow_html=True,
            )

        with a_col2:
            miss = inspector.inspect_missing_data_bias(sens_col)
            fig_miss = px.bar(
                x=list(miss["missing_by_group"].keys()),
                y=list(miss["missing_by_group"].values()),
                title=f"Missing Data % by {sens_col}",
                labels={"x": sens_col, "y": "Missing %"},
                color=list(miss["missing_by_group"].keys()),
            )
            st.plotly_chart(styled_chart(fig_miss), use_container_width=True)

        proxy = inspector.inspect_proxy_variables(sens_col)
        if proxy["has_proxies"]:
            st.warning(
                f"⚠️ **Proxy variables** detected (correlation > 0.3 with `{sens_col}`): "
                + ", ".join(f"`{k}` ({v:+.2f})" for k, v in proxy["proxy_candidates"].items())
            )
        else:
            st.success(f"✅ No strong proxy variables found for `{sens_col}`.")

# ══════════════════════════════════════════════════════════════════════════════
# TAB 2 — MODEL & BIAS AUDIT
# ══════════════════════════════════════════════════════════════════════════════
with tab_model:
    st.markdown("## 🤖 Train Model & Run Fairness Audit")

    m_col1, m_col2 = st.columns(2)
    with m_col1:
        model_choice = st.selectbox(
            "Select classifier",
            ["Random Forest", "Logistic Regression", "Gradient Boosting"],
        )
    with m_col2:
        test_size = st.slider("Test set size (%)", 15, 40, 25, 5) / 100

    run_audit = st.button("🚀 Train Model & Run Bias Audit", type="primary", key="run_audit")

    if run_audit:
        with st.spinner("Training model and computing fairness metrics …"):
            # ── Data prep ───────────────────────────────────────────────────
            feature_cols = [c for c in df.columns if c != target_col]
            df_clean     = df[feature_cols + [target_col]].dropna()
            df_enc, le_dict = encode_categorical(df_clean)

            X = df_enc[feature_cols]
            y = df_enc[target_col]

            # Binarise multi-class target
            if y.nunique() > 2:
                y = (y > y.median()).astype(int)

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42, stratify=y
            )

            # ── Train ────────────────────────────────────────────────────────
            if model_choice == "Random Forest":
                model = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
            elif model_choice == "Gradient Boosting":
                model = GradientBoostingClassifier(n_estimators=100, random_state=42)
            else:
                model = LogisticRegression(max_iter=1_000, random_state=42)

            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            acc    = accuracy_score(y_test, y_pred)

            # Store in session
            st.session_state.update({
                "model": model, "X_train": X_train, "X_test": X_test,
                "y_train": y_train, "y_test": y_test, "y_pred": y_pred,
                "df_enc": df_enc, "feature_cols": feature_cols,
                "le_dict": le_dict, "target_col": target_col,
                "sensitive_cols": sensitive_cols,
            })

        st.success(f"✅ Model trained — Overall accuracy: **{acc:.2%}**")

        # ======= Save to Supabase =======
        try:
            # Create session
            session = create_session(
                dataset_name=uploaded.name if uploaded else "demo_dataset",
                row_count=len(df),
                column_count=len(df.columns),
                target_column=target_col,
                sensitive_columns=sensitive_cols,
            )
            
            if session:
                session_id = session['id']
                st.session_state['session_id'] = session_id
                
                # Save each audit
                for sens_col in sensitive_cols:
                    audit_key = f"audit_{sens_col}"
                    if sens_col in df_enc.columns:
                        sens_test_db = df_enc.loc[X_test.index, sens_col].values
                        detector_db  = BiasDetector(y_test.values, y_pred, sens_test_db)
                        audit_db     = detector_db.full_bias_audit()
                        
                        saved = save_bias_audit(
                            session_id=session_id,
                            sensitive_attribute=sens_col,
                            audit_results=audit_db,
                            model_type=model_choice,
                            model_accuracy=float(acc)
                        )
                        if saved:
                            st.session_state[f'audit_db_id_{sens_col}'] = saved['id']
                
                update_session_status(session_id, "completed")
                
        except Exception as e:
            st.warning(f"Could not save to database: {e}")

        # ── Bias audit per sensitive column ──────────────────────────────────
        for sens_col in sensitive_cols:
            st.markdown(f"---\n### 📊 Fairness Audit — `{sens_col}`")

            if sens_col not in df_enc.columns:
                st.warning(f"Column `{sens_col}` not available after encoding.")
                continue

            sens_test = df_enc.loc[X_test.index, sens_col].values
            detector  = BiasDetector(y_test.values, y_pred, sens_test)
            audit     = detector.full_bias_audit()
            st.session_state[f"audit_{sens_col}"] = audit

            # Gauge row
            g1, g2, g3 = st.columns(3)
            g1.plotly_chart(gauge(audit["overall_fairness_score"], "Overall Fairness Score"),
                            use_container_width=True)
            dp_score = max(0.0, (1 - abs(audit["demographic_parity"]["difference"])) * 100)
            g2.plotly_chart(gauge(dp_score, "Demographic Parity Score"), use_container_width=True)
            di       = audit["disparate_impact"]["disparate_impact_ratio"]
            di_score = min(di / 0.8, 1.0) * 100
            g3.plotly_chart(gauge(di_score, "Disparate Impact Score"), use_container_width=True)

            # Metric cards
            mc1, mc2, mc3 = st.columns(3)
            with mc1:
                dp = audit["demographic_parity"]
                st.markdown("**Demographic Parity**")
                st.write(f"Difference: `{dp['difference']:+.4f}`")
                st.write(f"Ratio: `{dp['ratio']:.4f}`")
                st.write(dp["interpretation"])

            with mc2:
                eo = audit["equalized_odds"]
                st.markdown("**Equalized Odds**")
                st.write(f"Difference: `{eo['difference']:+.4f}`")
                st.write(eo["interpretation"])

            with mc3:
                di_d = audit["disparate_impact"]
                st.markdown("**Disparate Impact**")
                st.write(f"Ratio: `{di_d['disparate_impact_ratio']:.4f}`")
                passes = "✅ PASSES" if di_d["passes_80_percent_rule"] else "❌ FAILS"
                st.write(f"80 % rule: **{passes}**")
                sev_di = di_d["severity"]
                st.markdown(
                    f"Severity: <span class='badge-{sev_di.lower()}'>"
                    f"{SEV_ICON[sev_di]} {sev_di}</span>",
                    unsafe_allow_html=True,
                )

            # Selection rate bar chart
            gm = audit["group_metrics"]["by_group"]
            if "selection_rate" in gm:
                sr = {str(k): v for k, v in gm["selection_rate"].items()}
                fig_sr = px.bar(
                    x=list(sr.keys()), y=list(sr.values()),
                    title=f"Selection Rate per {sens_col} group",
                    labels={"x": sens_col, "y": "Selection Rate"},
                    color=list(sr.keys()), text_auto=".1%",
                )
                st.plotly_chart(styled_chart(fig_sr), use_container_width=True)

            # Per-group metric table
            tbl_rows = []
            for metric_name in ["accuracy", "precision", "recall", "f1", "selection_rate"]:
                if metric_name in gm:
                    row = {"Metric": metric_name.replace("_", " ").title()}
                    for g, v in gm[metric_name].items():
                        row[str(g)] = f"{v:.3f}"
                    tbl_rows.append(row)
            if tbl_rows:
                with st.expander("📊 Full per-group metric table"):
                    st.dataframe(pd.DataFrame(tbl_rows).set_index("Metric"),
                                 use_container_width=True)

    elif "model" not in st.session_state:
        st.info("👆 Configure above and click **Train Model & Run Bias Audit** to begin.")

# ══════════════════════════════════════════════════════════════════════════════
# TAB 3 — BIAS MITIGATION
# ══════════════════════════════════════════════════════════════════════════════
with tab_mitigate:
    st.markdown("## 🔧 Bias Mitigation")

    if "model" not in st.session_state:
        st.info("⬅️ Train a model first in the **Model & Bias Audit** tab.")
    else:
        mit_col1, mit_col2 = st.columns(2)
        with mit_col1:
            strategy = st.selectbox(
                "Mitigation strategy",
                [
                    "Pre-processing — Reweighing",
                    "Pre-processing — Resampling (oversample)",
                    "Pre-processing — Resampling (undersample)",
                    "In-processing — ExponentiatedGradient (Demographic Parity)",
                    "In-processing — ExponentiatedGradient (Equalized Odds)",
                    "Post-processing — ThresholdOptimizer",
                ],
            )
        with mit_col2:
            sel_sens = st.selectbox("Apply to sensitive column", sensitive_cols)

        apply_mit = st.button("🔧 Apply Mitigation & Compare", type="primary", key="apply_mit")

        if apply_mit:
            X_train  = st.session_state["X_train"]
            y_train  = st.session_state["y_train"]
            X_test   = st.session_state["X_test"]
            y_test   = st.session_state["y_test"]
            y_old    = st.session_state["y_pred"]
            df_enc   = st.session_state["df_enc"]
            tc       = st.session_state["target_col"]
            mitigator = BiasMitigator()

            sens_train = df_enc.loc[X_train.index, sel_sens].values
            sens_test  = df_enc.loc[X_test.index,  sel_sens].values

            with st.spinner("Applying mitigation …"):
                try:
                    if "Reweighing" in strategy:
                        tmp = X_train.copy()
                        tmp[tc] = y_train.values
                        tmp["_s"] = sens_train
                        weights = mitigator.reweigh_samples(tmp, "_s", tc)
                        m_new = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
                        m_new.fit(X_train, y_train, sample_weight=weights)
                        y_new = m_new.predict(X_test)

                    elif "oversample" in strategy:
                        tmp = X_train.copy()
                        tmp[tc] = y_train.values
                        tmp["_s"] = sens_train
                        balanced = mitigator.resample_balanced(tmp, "_s", tc, "oversample")
                        X_bal = balanced.drop([tc, "_s"], axis=1)
                        y_bal = balanced[tc]
                        m_new = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
                        m_new.fit(X_bal, y_bal)
                        y_new = m_new.predict(X_test)

                    elif "undersample" in strategy:
                        tmp = X_train.copy()
                        tmp[tc] = y_train.values
                        tmp["_s"] = sens_train
                        balanced = mitigator.resample_balanced(tmp, "_s", tc, "undersample")
                        X_bal = balanced.drop([tc, "_s"], axis=1)
                        y_bal = balanced[tc]
                        m_new = RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)
                        m_new.fit(X_bal, y_bal)
                        y_new = m_new.predict(X_test)

                    elif "Demographic Parity" in strategy:
                        base = LogisticRegression(max_iter=1_000, random_state=42)
                        m_new = mitigator.train_fair_model(
                            base, X_train, y_train, sens_train, "demographic_parity"
                        )
                        y_new = m_new.predict(X_test)

                    elif "Equalized Odds" in strategy:
                        base = LogisticRegression(max_iter=1_000, random_state=42)
                        m_new = mitigator.train_fair_model(
                            base, X_train, y_train, sens_train, "equalized_odds"
                        )
                        y_new = m_new.predict(X_test)

                    else:  # ThresholdOptimizer
                        base = LogisticRegression(max_iter=1_000, random_state=42)
                        m_new = mitigator.threshold_optimization(
                            base, X_train, y_train, sens_train, "demographic_parity"
                        )
                        y_new = m_new.predict(X_test, sensitive_features=sens_test)

                    # ── Compare before vs after ──────────────────────────────
                    det_old = BiasDetector(y_test.values, y_old, sens_test)
                    aud_old = det_old.full_bias_audit()
                    det_new = BiasDetector(y_test.values, y_new, sens_test)
                    aud_new = det_new.full_bias_audit()

                    st.markdown("### 📊 Before vs After Mitigation")
                    b1, b2 = st.columns(2)

                    with b1:
                        st.markdown("#### ❌ Before Mitigation")
                        st.metric("Fairness Score",         f"{aud_old['overall_fairness_score']:.1f}/100")
                        st.metric("Accuracy",               f"{accuracy_score(y_test, y_old):.2%}")
                        st.metric("Demographic Parity Δ",  f"{aud_old['demographic_parity']['difference']:+.4f}")
                        st.metric("Disparate Impact ratio", f"{aud_old['disparate_impact']['disparate_impact_ratio']:.4f}")

                    with b2:
                        st.markdown("#### ✅ After Mitigation")
                        fs_delta = aud_new["overall_fairness_score"] - aud_old["overall_fairness_score"]
                        acc_new  = accuracy_score(y_test, y_new)
                        acc_old  = accuracy_score(y_test, y_old)
                        dp_delta = aud_new["demographic_parity"]["difference"] - aud_old["demographic_parity"]["difference"]
                        di_delta = aud_new["disparate_impact"]["disparate_impact_ratio"] - aud_old["disparate_impact"]["disparate_impact_ratio"]
                        st.metric("Fairness Score",         f"{aud_new['overall_fairness_score']:.1f}/100",
                                  delta=f"{fs_delta:+.1f}")
                        st.metric("Accuracy",               f"{acc_new:.2%}",
                                  delta=f"{(acc_new - acc_old)*100:+.1f}%")
                        st.metric("Demographic Parity Δ",  f"{aud_new['demographic_parity']['difference']:+.4f}",
                                  delta=f"{dp_delta:+.4f}", delta_color="inverse")
                        st.metric("Disparate Impact ratio", f"{aud_new['disparate_impact']['disparate_impact_ratio']:.4f}",
                                  delta=f"{di_delta:+.4f}")

                    # Gauge comparison
                    gc1, gc2 = st.columns(2)
                    gc1.plotly_chart(gauge(aud_old["overall_fairness_score"], "Before"), use_container_width=True)
                    gc2.plotly_chart(gauge(aud_new["overall_fairness_score"], "After"),  use_container_width=True)

                    # ======= Save mitigation comparison =======
                    try:
                        audit_db_id = st.session_state.get(f'audit_db_id_{sel_sens}')
                        if audit_db_id:
                            save_mitigation_result(
                                audit_id=audit_db_id,
                                strategy=strategy,
                                before_score=aud_old['overall_fairness_score'],
                                after_score=aud_new['overall_fairness_score'],
                                before_accuracy=float(accuracy_score(y_test, y_old)),
                                after_accuracy=float(acc_new),
                            )
                            st.success("✅ Mitigation results saved!")
                    except Exception as e:
                        st.warning(f"Could not save mitigation: {e}")

                    # Recommendations
                    st.markdown("### 💡 Remaining Issues & Recommendations")
                    recs = mitigator.get_mitigation_recommendations(aud_new)
                    for rec in recs:
                        sev_rc = rec["severity"]
                        with st.expander(f"{rec['icon']} {rec['issue']}"):
                            st.markdown(
                                f"**Severity:** <span class='badge-{sev_rc.lower()}'>{sev_rc}</span>",
                                unsafe_allow_html=True,
                            )
                            st.write(f"**Description:** {rec['description']}")
                            st.write("**Suggested fixes:**")
                            for fix in rec["fixes"]:
                                st.write(f"  • {fix}")

                    st.session_state[f"post_audit_{sel_sens}"] = aud_new

                except Exception as exc:
                    st.error(f"Mitigation failed: {exc}")
                    st.exception(exc)

# ══════════════════════════════════════════════════════════════════════════════
# TAB 4 — REPORT
# ══════════════════════════════════════════════════════════════════════════════
with tab_report:
    st.markdown("## 📄 Fairness Audit Report")

    audit_keys = [k for k in st.session_state if k.startswith("audit_")]
    if not audit_keys:
        st.info("Run the Model & Bias Audit first to generate the report.")
    else:
        rows = []
        for k in audit_keys:
            col = k.replace("audit_", "")
            aud = st.session_state[k]
            rows.append({
                "Sensitive Attribute":      col,
                "Fairness Score (0-100)":   aud["overall_fairness_score"],
                "Demog. Parity Δ":          aud["demographic_parity"]["difference"],
                "Demog. Parity fair?":      "✅" if aud["demographic_parity"]["is_fair"] else "❌",
                "Equalized Odds Δ":         aud["equalized_odds"]["difference"],
                "Equalized Odds fair?":     "✅" if aud["equalized_odds"]["is_fair"] else "❌",
                "Disparate Impact ratio":   aud["disparate_impact"]["disparate_impact_ratio"],
                "Passes 80 % rule?":        "✅" if aud["disparate_impact"]["passes_80_percent_rule"] else "❌",
            })
        report_df = pd.DataFrame(rows)

        st.dataframe(report_df.set_index("Sensitive Attribute"), use_container_width=True)

        # Radar chart — fairness dimensions
        if len(rows) > 0:
            first = rows[0]
            radar_cats = ["Dem. Parity", "Equalized Odds", "Disp. Impact"]
            aud0 = st.session_state[audit_keys[0]]
            scores = [
                max(0, (1 - abs(aud0["demographic_parity"]["difference"])) * 100),
                max(0, (1 - abs(aud0["equalized_odds"]["difference"])) * 100),
                min(aud0["disparate_impact"]["disparate_impact_ratio"] / 0.8, 1.0) * 100,
            ]
            fig_radar = go.Figure(go.Scatterpolar(
                r=scores + [scores[0]],
                theta=radar_cats + [radar_cats[0]],
                fill="toself",
                fillcolor="rgba(79,70,229,0.2)",
                line=dict(color="#818cf8", width=2),
                name=audit_keys[0].replace("audit_", ""),
            ))
            fig_radar.update_layout(
                polar=dict(
                    bgcolor="#0f172a",
                    radialaxis=dict(visible=True, range=[0, 100], color="#475569"),
                    angularaxis=dict(color="#94a3b8"),
                ),
                title="Fairness Dimensions Radar Chart",
                showlegend=True,
                height=400,
                **PLOTLY_THEME,
            )
            st.plotly_chart(fig_radar, use_container_width=True)

        # Download
        csv_bytes = report_df.to_csv(index=False).encode()
        st.download_button(
            "📥 Download Report (CSV)",
            data=csv_bytes,
            file_name="axiom_fairness_report.csv",
            mime="text/csv",
        )

# ── Footer ────────────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center;color:#475569;font-size:0.85rem'>"
    "⚖️ <strong>Axiom</strong> · "
    "Built with Streamlit · Fairlearn · scikit-learn · Plotly"
    "</div>",
    unsafe_allow_html=True,
)
