# AXiOM — AI Fairness & Bias Analysis Engine

<div align="center">
  <img alt="AXiOM" src="https://img.shields.io/badge/AXiOM-Bias_Detector-4ade80?style=for-the-badge&logo=shield" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</div>

<br />

> 🚀 **Live Demo**: [https://axiomdashboard.vercel.app/](https://axiomdashboard.vercel.app/)  

**AXiOM** is a professional-grade platform to inspect AI datasets and documents for hidden unfairness, algorithmic bias, representation issues, and discrimination risks. It empowers organizations to measure, flag, explain, and mitigate harmful bias before algorithmic systems affect real people.

## 🏆 The Problem

AI systems now make critical decisions about hiring, loans, healthcare, and education. When these systems learn from biased data, they amplify discrimination at scale — and most teams have no unified way to detect it.

## 💡 The Solution

**AXiOM** bridges complex mathematical fairness frameworks with actionable governance:

- **Comprehensive Dataset Audits** — Upload CSV/Excel and detect bias across sensitive traits (gender, race, age, etc.)
- **Advanced Document Analysis** — Scan text, PDFs, and DOCX for exclusionary language and compliance gaps
- **Proactive Mitigation** — One-click Reweighing to eliminate systemic bias without impacting model accuracy
- **Deep Metrics** — Theil Index, Gini Coefficient, Demographic Parity, Disparate Impact, Equalized Odds and more
- **AI Chatbot** — Powered by Gemini 2.5 Flash for real-time fairness Q&A

## ✨ Key Features

### 📊 Structured Dataset Diagnostics
- Auto-detection of protected/sensitive columns
- Full fairness metrics scorecard with visualizations
- Confusion matrix bias mapping per subgroup
- Intersectional analysis across multiple sensitive attributes

### 📝 Document & AI Governance Audit
- NLP heuristics across 9 bias categories (racial, gendered, ageist, disability, LGBTQ+, etc.)
- Regulatory compliance tracking: EU AI Act, EEOC Title VII, GDPR Art. 22
- Sentiment & readability analysis
- Side-by-side fixed document viewer

### 🎨 Premium Dashboard
- Radar charts, bar charts, custom data grids via Recharts
- Glassmorphism UI with Framer Motion animations
- Export results as JSON, CSV, or PDF

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion, Recharts |
| Backend | Python 3.9+, FastAPI, Pandas, Scikit-Learn |
| AI | Google Gemini 2.5 Flash |
| Auth | Local auth (JWT tokens) + optional Supabase |
| Deployment | Vercel (frontend) + Hugging Face Spaces (backend) |

## 🏗️ Architecture

```
Axiom/
├── frontend/          # React + Vite (deploys to Vercel)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/   # API client (auto-switches dev/prod URL)
│   │   └── contexts/   # AuthContext
│   └── dist/           # Production build output
│
├── backend/           # FastAPI (deploys to Hugging Face Spaces)
│   ├── main.py         # All API endpoints
│   ├── bias_detector.py
│   ├── bias_mitigator.py
│   ├── data_inspector.py
│   └── requirements.txt
│
├── samples/           # Test files for judges
├── vercel.json        # Frontend deployment config
└── .env.example       # Environment variable template
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.9+

### 1. Clone & configure environment

```bash
git clone https://github.com/YOUR_USERNAME/axiom.git
cd axiom

# Copy env template
cp .env.example backend/.env
# Edit backend/.env and add your GEMINI_API_KEY
```

### 2. Start the Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 3. Start the Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:8080`.

## 🧪 Sample Test Files

Ready-to-use files are in the `samples/` directory:

| File | Description |
|------|-------------|
| `samples/test_dataset.csv` | Structured dataset for bias audit |
| `samples/test_fairness.csv` | Fairness-labeled dataset |
| `samples/test_doc.txt` | Sample policy doc for inclusivity analysis |

## 🌐 Deployment

### Frontend → Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add in Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_BASE_URL = https://electron005-axiom.hf.space
```

### Backend → Hugging Face Spaces (Free Tier)

We use Hugging Face Spaces because it natively supports heavy ML dependencies (`scipy`, `fairlearn`, `sklearn`) via Docker.

1. Create a New Space on Hugging Face using the **Docker** SDK.
2. Link your local repo to the Space:
```bash
git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/axiom
git push hf main
```
3. Add these Secret Environment Variables in the Hugging Face Space settings:
```
GEMINI_API_KEY = your_key
SUPABASE_URL = your_url      # optional
SUPABASE_KEY = your_key      # optional
```

## 📸 Core Workflows

1. **Upload** — Drag & drop CSV, Excel, PDF, DOCX, or TXT
2. **Configure** — Select target column and sensitive attributes
3. **Analyze** — Full fairness audit with visual metrics
4. **Mitigate** — One-click reweighing to reduce bias
5. **Export** — Download results as JSON / CSV / PDF

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

© 2026 AXiOM. Built for AI fairness, by humans who care.
