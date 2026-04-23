#!/bin/sh
set -e

echo "=== AXIOM STARTUP DIAGNOSTICS ==="
echo "Working dir: $(pwd)"
echo "Python: $(python --version)"
echo ""
echo "=== Files in /app ==="
ls -la /app/
echo ""
echo "=== api/ directory ==="
ls -la /app/api/ 2>/dev/null || echo "api/ NOT FOUND"
echo ""
echo "=== Testing critical imports ==="
python -c "
import sys, os
sys.path.insert(0, '/app')
print('sys.path:', sys.path[:3])

tests = [
    ('numpy', 'import numpy; print(numpy.__version__)'),
    ('pandas', 'import pandas; print(pandas.__version__)'),
    ('fastapi', 'import fastapi; print(fastapi.__version__)'),
    ('sklearn', 'import sklearn; print(sklearn.__version__)'),
    ('fairlearn', 'import fairlearn; print(fairlearn.__version__)'),
    ('google.genai', 'from google import genai; print(\"ok\")'),
    ('dotenv', 'from dotenv import load_dotenv; print(\"ok\")'),
    ('bias_detector', 'from bias_detector import BiasDetector; print(\"ok\")'),
    ('api.chat_routes', 'from api.chat_routes import router; print(\"ok\")'),
    ('main', 'import main; print(\"ok\")'),
]

for name, code in tests:
    try:
        exec(code)
        print(f'[OK]   {name}')
    except Exception as e:
        print(f'[FAIL] {name}: {e}')
" 2>&1

echo ""
echo "=== Starting uvicorn ==="
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
