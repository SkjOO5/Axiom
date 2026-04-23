"""
Axiom backend entrypoint.
Explicitly sets working directory and sys.path before starting uvicorn.
This avoids CRLF issues with shell scripts and path resolution issues on Render.
"""
import os
import sys

# Force working directory to /app (where main.py lives in Docker)
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("[STARTUP] cwd:", os.getcwd())
print("[STARTUP] main.py exists:", os.path.exists("main.py"))
print("[STARTUP] api/ exists:", os.path.isdir("api"))
print("[STARTUP] Python:", sys.version)

# Run import diagnostics before starting server
import_results = {}
for name, stmt in [
    ("numpy",         "import numpy"),
    ("pandas",        "import pandas"),
    ("fastapi",       "import fastapi"),
    ("sklearn",       "import sklearn"),
    ("fairlearn",     "import fairlearn"),
    ("google.genai",  "from google import genai"),
    ("dotenv",        "from dotenv import load_dotenv"),
    ("bias_detector", "from bias_detector import BiasDetector"),
    ("api.routes",    "from api.chat_routes import router"),
    ("main",          "import main"),
]:
    try:
        exec(stmt)
        import_results[name] = "OK"
        print(f"[OK]   {name}")
    except Exception as e:
        import_results[name] = f"FAIL: {e}"
        print(f"[FAIL] {name}: {e}")

if import_results.get("main", "").startswith("FAIL"):
    print("[ERROR] main.py failed to import — check FAIL lines above")
    sys.exit(1)

import uvicorn
port = int(os.environ.get("PORT", 8000))
print(f"[STARTUP] Starting uvicorn on port {port}")
uvicorn.run("main:app", host="0.0.0.0", port=port)
