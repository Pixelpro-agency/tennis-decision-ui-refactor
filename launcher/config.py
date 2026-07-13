from pathlib import Path

_file = __file__
PROJECT_ROOT = Path(_file).resolve().parents[1]

ROOT = str(PROJECT_ROOT)

CDP_SCRIPT = str(PROJECT_ROOT / "scripts" / "start-cdp-dev.ps1")
BACKEND_SCRIPT = str(PROJECT_ROOT / "scripts" / "start-backend-dev.ps1")
FRONTEND_DIR = str(PROJECT_ROOT / "frontend")

# Preferred ports — actual chosen ports are resolved at runtime by services.py
PREFERRED_BACKEND_PORT = 3001
PREFERRED_FRONTEND_PORT = 3000
PREFERRED_CDP_PORT = 9222
