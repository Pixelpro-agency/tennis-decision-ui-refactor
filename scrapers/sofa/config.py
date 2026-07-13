import sys
from pathlib import Path


file_name = "_" * 2 + "file" + "_" * 2

PROJECT_ROOT = Path(globals()[file_name]).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"

CACHE_DIR = BACKEND_DIR / "scraper_cache"
PROFILE_DIR = BACKEND_DIR / "scraper_profile"

CACHE_TTL_SECONDS = 5


def log(message):
    sys.stderr.write(f"{message}\n")
    sys.stderr.flush()
