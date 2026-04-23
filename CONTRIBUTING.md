# Contributing to AXiOM

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes (no UI styling changes without discussion)
4. Ensure the build passes: `cd frontend && npm run build`
5. Submit a Pull Request

## Guidelines

- **Backend**: Follow existing FastAPI patterns; wrap all endpoints in try/except
- **Frontend**: Use `apiUrl()` from `services/api.ts` for all API calls; use `toast.error()` not `alert()`
- **No hardcoded URLs** — always use environment variables
- **No console.log in production code** — use `console.error` only for genuine errors

## Running Tests

```bash
# Frontend
cd frontend && npm test

# Backend import check
cd backend && python -c "import main; print('OK')"
```
