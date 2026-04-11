# Axiom - AI Fairness & Bias Analysis Engine

<div align="center">
  <img alt="Axiom Logo" src="https://img.shields.io/badge/Axiom-Bias_Detector-blue?style=for-the-badge&logo=shield" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</div>

<br />

**Axiom** is a comprehensive, professional-grade platform designed to inspect AI datasets and unstructured documents for hidden unfairness, algorithmic bias, representation issues, and discrimination risks. Built to deliver complete transparency, Axiom empowers organizations to measure, flag, explain, and mitigate harmful bias before algorithmic systems affect real people.

## 🏆 The Problem

Computer programs now make critical, life-altering decisions regarding job hiring, bank loans, medical care, and education access. If these AI systems learn from historically biased data or flawed datasets, they encode, automate, and amplify discrimination at a massive scale. 

Currently, evaluating datasets and AI documentation for deeply embedded systemic biases is tedious, highly technical, and lacks a unified visual standard for compliance teams, developers, and regulators.

## 💡 The Solution

**Axiom** bridges the gap between complex mathematical fairness frameworks and actionable governance. 

Our application provides:
- **Comprehensive Dataset Audits**: Upload a `CSV` or `Excel` dataset and identify hidden biases based on sensitive traits (e.g., gender, race, religion, socioeconomic status). 
- **Advanced Document Analysis**: Automatically scan text, PDFs, and documentation for exclusionary language, sentiment vulnerabilities, and AI framework compliances (e.g., EU AI Act, EEOC).
- **Proactive Mitigation**: Generate adjusted datasets (e.g., using "Reweighing") to eliminate systemic representation issues instantly without impacting model predictive power.
- **Deep Mathematical Metrics**: Get visual, easily understandable scorecards on complex metrics like the Theil Index, Gini Coefficient, Treatment Equality, and Demographics Parity.

## ✨ Key Features

### 📊 Structured Dataset Diagnostics
- **Target & Sensitive Column Detection:** Automatically extracts categorical features and identifies protected classes.
- **Fairness Metrics Scorecard:** Calculates Individual Bias Scores, Disparate Impact, and Demographic Parity parameters instantly.
- **Confusion Matrix Mapping:** Analyzes true positive/false positive disparities between different subgroups to highlight outcome biases.
- **Advanced Disparity Indicators:** Understand dataset stratification using the Theil Index and Gini Coefficient.

### 📝 Unstructured Document & AI Governance Audit
- **Deep NLP Heuristics:** Maps thousands of flagged terms against proprietary dictionaries (e.g., LGBTQ+, Religion, Nationality, Racial Bias).
- **Regulatory Compliance Tracker:** Tracks dataset readiness and legal compliance with standards like the *EU AI Act* and *GDPR*. 
- **Sentiment & Readability Metrics:** Leverages text polarity analysis and Flesch indices to rank tone inclusivity.
- **Side-by-Side Diff Viewer:** Displays visually how a document should be revised to eliminate flagged biases or non-inclusive framing.

### 🎨 Premium Visualization Dashboard
- Uses rich charts (radar layouts, bar charts, custom data grids) via **Recharts** to make AI compliance beautiful, scannable, and extremely intuitive.
- Powered by a stunning modern UI featuring glassmorphism, fluid animations with Framer Motion, and a heavily optimized dark theme.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, TailwindCSS, Framer Motion, Recharts, Lucide Icons.
- **Backend Analytics Engine:** Python, FastAPI, Pandas, Scikit-Learn, PyPDF2, python-docx, TextBlob.
- **Authentication & Database:** Supabase (Auth & Postgres).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Start the Backend API (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
*Note: Make sure to set your Supabase URL and Key in your `.env` file for Authentication if you wish to use the full user-profile ecosystem.*

### 2. Start the Frontend Application (Vite + React)

```bash
cd frontend
npm install
npm run dev
```
The Axiom app will then be accessible at `http://localhost:8080`.

## 📸 Core Workflows

1. **Upload Phase**: Securely drag and drop datasets or documents.
2. **Configuration Phase**: Select targeted prediction properties and flag which columns represent protected traits.
3. **Audit Results**: View an immediate breakdown of structural risks, historical skews, and visual matrices confirming bias depth.
4. **Mitigation Phase**: One-click re-balance dataset using "Reweighing" and retrieve a mitigated dataset.

## 🤝 Next Steps & Future Capabilities
- Add specific visual export features (PDF/CSV/JSON) for regulatory audits.
- Incorporate open-source LLM layers for zero-shot text debiasing dynamically across massive internal databases.
- Multi-model evaluation support.
