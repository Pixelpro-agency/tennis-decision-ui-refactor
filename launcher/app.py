"""
Main launcher orchestration.

Startup sequence
----------------
1. Check for an existing reusable session (backend + frontend alive, identity verified).
   If found → open browser on existing URL and exit (no duplicates).
2. Acquire lock (or reclaim stale lock).
3. Write manifest with status=starting immediately after lock.
4. Resolve CDP (fire-and-forget; failure is tolerated; does NOT block startup).
5. Resolve backend (with identity check + reuse/fallback logic).
6. Resolve frontend (with liveness check + reuse/fallback logic).
7. Update manifest to status=ready, open browser, wait for Ctrl+C.
8. On shutdown: terminate only owned processes, remove manifest/lock.
"""

import os
import time

from .services import (
    open_browser,
    resolve_backend,
    resolve_cdp,
    resolve_frontend,
    shutdown_owned,
)
from .session import (
    _empty_manifest,
    acquire_lock,
    is_manifest_reusable,
    read_manifest,
    reclaim_stale_lock,
    release_lock,
    remove_manifest,
    write_manifest,
)
from .system import log


def main():
    print("=== Tennis Decision UI ===", flush=True)

    # ------------------------------------------------------------------
    # 1. Check for a reusable session (real health + identity check)
    # ------------------------------------------------------------------
    existing = read_manifest()
    if is_manifest_reusable(existing):
        frontend_url = existing.get("frontendUrl") or ""
        if frontend_url:
            log("Launcher", f"session action=reuse url={frontend_url}")
            open_browser(frontend_url)
            return

    # ------------------------------------------------------------------
    # 2. Acquire lock
    # ------------------------------------------------------------------
    if not acquire_lock():
        if not reclaim_stale_lock():
            log("Launcher", "lock action=busy reason=another-instance-running")
            return
        if not acquire_lock():
            log("Launcher", "lock action=failed")
            return

    manifest = _empty_manifest(os.getpid())

    # ------------------------------------------------------------------
    # 3. Persist manifest immediately with status=starting
    # ------------------------------------------------------------------
    write_manifest(manifest)

    try:
        # ------------------------------------------------------------------
        # 4. CDP — fire-and-forget; does NOT block backend/frontend startup
        # ------------------------------------------------------------------
        cdp_url = resolve_cdp(manifest)
        # cdp_url is empty string when unavailable — do NOT substitute a
        # false default; pass it as-is to the frontend via VITE_CDP_URL
        write_manifest(manifest)

        # ------------------------------------------------------------------
        # 5. Backend
        # ------------------------------------------------------------------
        ok, backend_url = resolve_backend(manifest)
        if not ok:
            log("Launcher", "backend action=failed — aborting")
            return
        backend_port = int(backend_url.rstrip("/").rsplit(":", 1)[-1])
        write_manifest(manifest)

        # ------------------------------------------------------------------
        # 6. Frontend
        # ------------------------------------------------------------------
        ok, frontend_url = resolve_frontend(manifest, backend_port, cdp_url)
        if not ok:
            log("Launcher", "frontend action=failed — aborting")
            return
        write_manifest(manifest)

        # ------------------------------------------------------------------
        # 7. Ready
        # ------------------------------------------------------------------
        manifest["status"] = "ready"
        write_manifest(manifest)
        open_browser(frontend_url)

        log(
            "Launcher",
            "Sistema pronto. Premi Ctrl+C per arrestare frontend e backend.",
        )

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("", flush=True)

    finally:
        # ------------------------------------------------------------------
        # 8. Shutdown: only owned processes
        # ------------------------------------------------------------------
        shutdown_owned()
        remove_manifest()
        release_lock()
