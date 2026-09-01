# Crime Analytics & Investigation Assistant

AI-powered decision-support platform for crime investigators. Analyzes FIRs, evidence, and witness statements to generate investigative insights, suspect rankings, and recommended actions.

> **Disclaimer:** This application is an investigative assistance tool only. AI outputs are hypotheses requiring human verification and must never be interpreted as proof of guilt or used for final legal decisions.

## Features

- **FIR Analysis** — Natural language entity extraction (victims, suspects, witnesses, locations, weapons)
- **OCR** — PDF, DOCX, TXT, JPEG, PNG document ingestion
- **Crime Classification** — 15+ categories with confidence scores
- **Suspect Ranking** — Evidence-based probabilistic ranking with disclaimers
- **Timeline Generator** — Interactive investigation timeline
- **Investigation Predictions** — Motive, sequence, solvability estimates
- **Relationship Graph** — Interactive entity network visualization
- **Crime Map** — Geographic hotspot analysis
- **AI Chat Investigator** — RAG-powered Q&A over case documents
- **Report Generation** — Professional PDF investigation reports
- **Role-Based Access** — Administrator, Investigator, Supervisor roles

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | Python FastAPI, SQLAlchemy, Pydantic |
| AI/ML | LangChain, OpenAI GPT, spaCy, Sentence Transformers, ChromaDB |
| OCR | Tesseract, EasyOCR, python-docx, PyPDF2 |
| Databases | PostgreSQL, MongoDB, Redis, ChromaDB |
| Auth | JWT, bcrypt, RBAC |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (local dev)
- Python 3.11+ (local dev)

### With Docker (Recommended)

```bash
cp .env.example .env
docker-compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Backend:**

```bash
Admin@123
uvicorn app.main:app --reload --port 8000y
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

**Frontend:**cd

```bash
cd frontend
npm install
npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@crimeanalytics.gov | Admin@123 |
| Investigator | investigator@crimeanalytics.gov | Invest@123 |
| Supervisor | supervisor@crimeanalytics.gov | Super@123 |

## Project Structure

```
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── ai/             # AI/ML pipeline
│   │   ├── core/           # Config, security, deps
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── database/           # SQL init scripts
│   └── tests/
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities & API client
│   └── public/
├── docs/                   # Documentation
├── samples/                # Sample datasets
└── docker-compose.yml
```

## Documentation

- [API Documentation](docs/API.md)
- [AI Pipeline Architecture](docs/AI_PIPELINE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [User Guide](docs/USER_GUIDE.md)
- [Administrator Guide](docs/ADMIN_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Security

- JWT authentication with refresh tokens
- bcrypt password hashing
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation and sanitization
- Audit logging for sensitive operations
- Encrypted sensitive data fields

## Ethical AI

All AI outputs include:
- Confidence scores and uncertainty indicators
- Clear distinction between extracted facts and inferred hypotheses
- Mandatory disclaimers on suspect rankings
- No guilt declarations — investigative assistance only

## License

Proprietary — For authorized law enforcement use only.
