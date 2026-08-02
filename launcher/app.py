"""
Main launcher orchestration.

Startup sequence
----------------
1. Check for an existing reusable session (backend + frontend alive, identity verified).
2. Create one launcher identity and acquire or conservatively recover the lock.
3. Install minimal signal handlers and write canonical manifest schema 2.
4. Resolve and persist CDP, backend, and frontend without starting a later phase
   after a stop request.
5. Mark the session ready, open the browser, and wait on the stop Event.
6. In one protected finally path: persist shutdown state, stop only owned
   processes, remove only the owned manifest, release only the owned lock, and
   restore the previous signal handlers.
"""

from __future__ import annotations

import signal
import sys
import threading

from .services import (
    open_browser,
    resolve_backend,
    resolve_cdp,
    resolve_frontend,
    shutdown_owned,
)
from .session import (
    _empty_manifest,
    acquire_or_recover_lock,
    create_launcher_session_identity,
    is_manifest_reusable,
    manifest_set_session_status,
    read_manifest,
    release_lock,
    remove_manifest,
    write_manifest,
)
from .system import log

_STOP_REASONS = frozenset({
    "sigint",
    "sigterm",
    "sigbreak",
    "keyboard_interrupt",
})
_PROTECTED_FAILURE_REASONS = frozenset({
    "backend_failed",
    "frontend_failed",
    "launcher_exception",
})


class _StopController:
    """Per-main stop request state. The first request wins."""

    def __init__(self):
        self._event = threading.Event()
        self._lock = threading.Lock()
        self._reason = None

    def request(self, reason: str) -> bool:
        if reason not in _STOP_REASONS:
            raise ValueError(f"invalid stop reason: {reason}")
        if self._reason is not None:
            return False
        with self._lock:
            if self._reason is not None:
                return False
            self._reason = reason
            self._event.set()
            return True

    @property
    def requested(self) -> bool:
        return self._event.is_set()

    @property
    def reason(self) -> str | None:
        return self._reason

    def wait(self, timeout: float) -> bool:
        return self._event.wait(timeout=timeout)


def _supported_signal_reasons() -> list[tuple[int, str]]:
    supported = [
        (signal.SIGINT, "sigint"),
        (signal.SIGTERM, "sigterm"),
    ]
    if sys.platform == "win32" and hasattr(signal, "SIGBREAK"):
        supported.append((signal.SIGBREAK, "sigbreak"))
    return supported


def _install_signal_handlers(controller: _StopController) -> dict[int, object]:
    """Install minimal handlers and return the previous handlers."""
    installed: dict[int, object] = {}
    try:
        for signum, reason in _supported_signal_reasons():
            previous = signal.getsignal(signum)

            def _handler(_signum, _frame, *, _reason=reason):
                controller.request(_reason)

            signal.signal(signum, _handler)
            installed[signum] = previous
    except Exception:
        _restore_signal_handlers(installed)
        raise
    return installed


def _restore_signal_handlers(installed: dict[int, object]):
    """Best-effort restoration of only handlers replaced by this main call."""
    for signum, previous in installed.items():
        try:
            signal.signal(signum, previous)
        except Exception:
            pass


def _safe_log(message: str):
    try:
        log("Launcher", message)
    except Exception:
        pass


def _safe_write_manifest(manifest) -> bool:
    if not isinstance(manifest, dict):
        return False
    try:
        write_manifest(manifest)
        return True
    except Exception:
        return False


def _session_reason(manifest) -> str | None:
    if not isinstance(manifest, dict):
        return None
    session = manifest.get("session")
    if not isinstance(session, dict):
        return None
    reason = session.get("reason")
    return reason if isinstance(reason, str) else None


def _set_and_write_session_status(manifest, status: str, reason: str) -> bool:
    if not isinstance(manifest, dict):
        return False
    try:
        manifest_set_session_status(manifest, status, reason)
    except Exception:
        return False
    return _safe_write_manifest(manifest)


def _valid_shutdown_result(result) -> bool:
    return (
        isinstance(result, dict)
        and isinstance(result.get("ok"), bool)
        and result.get("state") in {"completed", "partial_failure", "already_empty"}
    )


def _fallback_shutdown_failure(reason: str) -> dict:
    return {
        "ok": False,
        "state": "partial_failure",
        "attempted": 0,
        "stopped": 0,
        "failed": 1,
        "entries": [],
        "reason": reason,
    }


def main():
    print("=== Tennis Decision UI ===", flush=True)

    existing = read_manifest()
    session_identity = create_launcher_session_identity()
    controller = _StopController()
    manifest = None
    installed_handlers: dict[int, object] = {}
    preserve_failure_state = False

    # The lock is authoritative. A live launcher blocks every second
    # invocation before the reusable-manifest fast path can open another tab.
    # Reuse remains available only after this invocation has acquired or
    # positively reclaimed the lock.
    lock_result = acquire_or_recover_lock(
        session_identity,
        manifest=existing,
    )
    if not lock_result.get("acquired"):
        log(
            "Launcher",
            "lock action=blocked "
            f"state={lock_result.get('state')} "
            f"reason={lock_result.get('reason')}",
        )
        return

    try:
        log(
            "Launcher",
            f"lock action={lock_result.get('state')} "
            f"reason={lock_result.get('reason')}",
        )

        if is_manifest_reusable(existing):
            frontend_url = existing["services"]["frontend"]["url"]
            frontend_port = existing["services"]["frontend"].get("selectedPort")
            log(
                "Launcher",
                "session_reuse",
                service="frontend",
                port=frontend_port,
                ownership="reused",
            )
            open_browser(frontend_url)
            return

        installed_handlers = _install_signal_handlers(controller)

        manifest = _empty_manifest(session_identity["pid"], session_identity)
        write_manifest(manifest)
        if controller.requested:
            return

        cdp_url = resolve_cdp(manifest)
        write_manifest(manifest)
        if controller.requested:
            return

        ok, backend_url = resolve_backend(manifest)
        write_manifest(manifest)
        if controller.requested:
            return
        if not ok:
            manifest_set_session_status(manifest, "failed", "backend_failed")
            preserve_failure_state = True
            write_manifest(manifest)
            log("Launcher", "backend action=failed — aborting")
            return

        backend_port = int(backend_url.rstrip("/").rsplit(":", 1)[-1])
        if controller.requested:
            return

        ok, frontend_url = resolve_frontend(manifest, backend_port, cdp_url)
        write_manifest(manifest)
        if controller.requested:
            return
        if not ok:
            manifest_set_session_status(manifest, "failed", "frontend_failed")
            preserve_failure_state = True
            write_manifest(manifest)
            log("Launcher", "frontend action=failed — aborting")
            return

        manifest_set_session_status(manifest, "ready", "services_ready")
        write_manifest(manifest)
        if controller.requested:
            return

        open_browser(frontend_url)
        log(
            "Launcher",
            "Sistema pronto. Premi Ctrl+C per arrestare frontend e backend.",
        )

        while not controller.wait(timeout=1.0):
            pass

    except KeyboardInterrupt:
        controller.request("keyboard_interrupt")
        print("", flush=True)

    except Exception:
        preserve_failure_state = True
        if manifest is not None:
            _set_and_write_session_status(
                manifest,
                "failed",
                "launcher_exception",
            )
        raise

    finally:
        protected_failure = (
            preserve_failure_state
            or _session_reason(manifest) in _PROTECTED_FAILURE_REASONS
        )

        if controller.requested and not protected_failure:
            reason = f"shutdown_{controller.reason}"
            _set_and_write_session_status(manifest, "stopping", reason)
            _safe_log(f"shutdown request={controller.reason}")

        try:
            shutdown_result = shutdown_owned()
        except Exception:
            shutdown_result = _fallback_shutdown_failure("shutdown_exception")

        if not _valid_shutdown_result(shutdown_result):
            shutdown_result = _fallback_shutdown_failure("invalid_shutdown_result")

        if manifest is not None and not protected_failure:
            if shutdown_result["ok"]:
                _set_and_write_session_status(
                    manifest,
                    "stopped",
                    "shutdown_complete",
                )
            else:
                _set_and_write_session_status(
                    manifest,
                    "failed",
                    "shutdown_partial_failure",
                )

        _safe_log(
            "shutdown "
            f"state={shutdown_result.get('state')} "
            f"attempted={shutdown_result.get('attempted')} "
            f"stopped={shutdown_result.get('stopped')} "
            f"failed={shutdown_result.get('failed')}"
        )

        try:
            manifest_result = remove_manifest(session_identity)
        except Exception:
            manifest_result = {
                "removed": False,
                "state": "failed",
                "reason": "manifest_remove_exception",
            }
        _safe_log(
            "manifest action=remove "
            f"result={manifest_result.get('reason')} "
            f"state={manifest_result.get('state')}"
        )

        try:
            release_result = release_lock(session_identity)
        except Exception:
            release_result = {
                "released": False,
                "state": "failed",
                "reason": "lock_release_exception",
            }
        _safe_log(
            "lock action=release "
            f"result={release_result.get('reason')} "
            f"state={release_result.get('state')}"
        )

        _restore_signal_handlers(installed_handlers)
