#!/usr/bin/env python3
"""
Standalone, allow-list-only retention utility for confirmed regenerable caches.

It never reads cache contents, never recurses, and defaults to dry-run.
"""

from __future__ import annotations

import argparse
import errno
import json
import os
import socket
import stat
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Sequence


PROJECT_ROOT = Path(__file__).resolve().parent.parent

CACHE_RELATIVE_DIRS = {
    "betfair": Path("backend") / "betfair_cache",
    "sofa": Path("backend") / "scraper_cache",
}

_REASON_ORDER = ("max_age", "max_files", "max_total_bytes")
_SECONDS_PER_DAY = 24 * 60 * 60


class UsageError(ValueError):
    """Raised for command-line usage errors without emitting parser output."""


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise UsageError(message)


@dataclass(frozen=True)
class RetentionPolicies:
    max_age_days: Optional[int] = None
    max_files: Optional[int] = None
    max_total_bytes: Optional[int] = None

    def has_any(self) -> bool:
        return any(
            value is not None
            for value in (
                self.max_age_days,
                self.max_files,
                self.max_total_bytes,
            )
        )


def _non_negative_int(value: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("must be an integer") from exc

    if parsed < 0:
        raise argparse.ArgumentTypeError("must be greater than or equal to 0")
    return parsed


def _dedupe_preserving_order(values: Iterable[str]) -> List[str]:
    result: List[str] = []
    seen = set()
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def _iso_utc(epoch_seconds: float) -> str:
    return (
        datetime.fromtimestamp(epoch_seconds, tz=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _relative_path(project_root: Path, path: Path) -> str:
    return path.relative_to(project_root).as_posix()


def _policies_json(policies: RetentionPolicies) -> Dict[str, Optional[int]]:
    return {
        "maxAgeDays": policies.max_age_days,
        "maxFiles": policies.max_files,
        "maxTotalBytes": policies.max_total_bytes,
    }


def _new_report(
    selected_caches: Sequence[str],
    policies: RetentionPolicies,
    mode: str,
) -> Dict[str, object]:
    return {
        "mode": mode,
        "selectedCaches": list(selected_caches),
        "policies": _policies_json(policies),
        "blocked": False,
        "blockReasons": [],
        "scanned": {
            "files": 0,
            "bytes": 0,
        },
        "candidates": [],
        "removed": [],
        "skipped": [],
        "recoveredBytes": 0,
        "errors": [],
    }


def _append_skipped(
    report: Dict[str, object],
    path: str,
    reason: str,
) -> None:
    report["skipped"].append({"path": path, "reason": reason})


def _append_error(report: Dict[str, object], message: str) -> None:
    report["errors"].append(message)


def _scan_cache(
    project_root: Path,
    cache_name: str,
    report: Dict[str, object],
) -> List[Dict[str, object]]:
    relative_dir = CACHE_RELATIVE_DIRS[cache_name]
    cache_dir = project_root / relative_dir
    cache_dir_text = relative_dir.as_posix()
    records: List[Dict[str, object]] = []

    try:
        cache_stat = cache_dir.lstat()
    except FileNotFoundError:
        _append_skipped(report, cache_dir_text, "cache_directory_missing")
        return records
    except OSError as exc:
        _append_error(
            report,
            "metadata error for {0}: {1}".format(
                cache_dir_text,
                type(exc).__name__,
            ),
        )
        return records

    if stat.S_ISLNK(cache_stat.st_mode):
        _append_skipped(report, cache_dir_text, "cache_directory_symlink")
        return records

    if not stat.S_ISDIR(cache_stat.st_mode):
        _append_skipped(report, cache_dir_text, "cache_path_not_directory")
        return records

    try:
        entries = sorted(os.scandir(str(cache_dir)), key=lambda entry: entry.name)
    except OSError as exc:
        _append_error(
            report,
            "metadata error for {0}: {1}".format(
                cache_dir_text,
                type(exc).__name__,
            ),
        )
        return records

    for entry in entries:
        entry_path = Path(entry.path)
        entry_text = _relative_path(project_root, entry_path)

        try:
            entry_stat = entry.stat(follow_symlinks=False)
        except OSError as exc:
            _append_error(
                report,
                "metadata error for {0}: {1}".format(
                    entry_text,
                    type(exc).__name__,
                ),
            )
            continue

        mode = entry_stat.st_mode
        if stat.S_ISLNK(mode):
            _append_skipped(report, entry_text, "symlink")
            continue
        if stat.S_ISDIR(mode):
            _append_skipped(report, entry_text, "directory")
            continue
        if not stat.S_ISREG(mode):
            _append_skipped(report, entry_text, "non_regular")
            continue
        if entry_path.suffix != ".json":
            _append_skipped(report, entry_text, "non_json")
            continue

        report["scanned"]["files"] += 1
        report["scanned"]["bytes"] += entry_stat.st_size
        records.append(
            {
                "cache": cache_name,
                "path_object": entry_path,
                "path": entry_text,
                "bytes": entry_stat.st_size,
                "mtimeEpoch": entry_stat.st_mtime,
                "mtime": _iso_utc(entry_stat.st_mtime),
            }
        )

    return records


def _record_sort_key(record: Dict[str, object]) -> tuple:
    return (record["mtimeEpoch"], record["path"])


def _select_candidates(
    records_by_cache: Dict[str, List[Dict[str, object]]],
    policies: RetentionPolicies,
    now_epoch: float,
) -> List[Dict[str, object]]:
    selected: Dict[str, Dict[str, object]] = {}

    def add(record: Dict[str, object], reason: str) -> None:
        existing = selected.get(record["path"])
        if existing is None:
            existing = {
                "record": record,
                "reasons": set(),
            }
            selected[record["path"]] = existing
        existing["reasons"].add(reason)

    for cache_name, records in records_by_cache.items():
        ordered = sorted(records, key=_record_sort_key)

        if policies.max_age_days is not None:
            threshold = now_epoch - (policies.max_age_days * _SECONDS_PER_DAY)
            for record in ordered:
                if record["mtimeEpoch"] < threshold:
                    add(record, "max_age")

        if policies.max_files is not None:
            excess_files = len(ordered) - policies.max_files
            if excess_files > 0:
                for record in ordered[:excess_files]:
                    add(record, "max_files")

        if policies.max_total_bytes is not None:
            total_bytes = sum(int(record["bytes"]) for record in ordered)
            if total_bytes > policies.max_total_bytes:
                remaining = total_bytes
                for record in ordered:
                    add(record, "max_total_bytes")
                    remaining -= int(record["bytes"])
                    if remaining <= policies.max_total_bytes:
                        break

    candidates: List[Dict[str, object]] = []
    for item in selected.values():
        record = item["record"]
        reasons = [
            reason
            for reason in _REASON_ORDER
            if reason in item["reasons"]
        ]
        candidates.append(
            {
                "record": record,
                "reasons": reasons,
            }
        )

    return sorted(
        candidates,
        key=lambda item: _record_sort_key(item["record"]),
    )


def _public_candidate(candidate: Dict[str, object]) -> Dict[str, object]:
    record = candidate["record"]
    return {
        "path": record["path"],
        "bytes": record["bytes"],
        "mtime": record["mtime"],
        "reasons": list(candidate["reasons"]),
    }


def _socket_error_code(error: OSError) -> int | None:
    if error.errno is not None:
        return error.errno
    return getattr(error, "winerror", None)


def _is_ipv6_unavailable(code: int | None) -> bool:
    return code in {
        getattr(errno, "EAFNOSUPPORT", -1),
        getattr(errno, "WSAEAFNOSUPPORT", -2),
    }


def _probe_loopback_endpoint(
    family: int,
    port: int,
    timeout_seconds: float,
) -> bool | None:
    ipv6_family = getattr(socket, "AF_INET6", None)
    address = (
        ("127.0.0.1", port)
        if family == socket.AF_INET
        else ("::1", port, 0, 0)
    )

    try:
        with socket.socket(family, socket.SOCK_STREAM) as probe:
            probe.settimeout(timeout_seconds)
            result = probe.connect_ex(address)
    except OSError as exc:
        if family == ipv6_family and _is_ipv6_unavailable(
            _socket_error_code(exc)
        ):
            return None
        raise RuntimeError("loopback probe failed") from exc

    refused_codes = {
        errno.ECONNREFUSED,
        getattr(errno, "WSAECONNREFUSED", errno.ECONNREFUSED),
    }

    if result == 0:
        return True
    if result in refused_codes:
        return False
    if family == ipv6_family and _is_ipv6_unavailable(result):
        return None

    raise RuntimeError("loopback probe returned {0}".format(result))


def _port_is_occupied(port: int, timeout_seconds: float = 0.3) -> bool:
    endpoints = [(socket.AF_INET, "127.0.0.1")]
    ipv6_family = getattr(socket, "AF_INET6", None)

    if isinstance(ipv6_family, int):
        endpoints.append((ipv6_family, "::1"))

    available_endpoints = 0
    occupied = False

    for family, _host in endpoints:
        try:
            result = _probe_loopback_endpoint(
                family,
                port,
                timeout_seconds,
            )
        except Exception as exc:
            raise RuntimeError("loopback probe failed") from exc

        if result is None:
            if family == ipv6_family:
                continue
            raise RuntimeError("IPv4 loopback family unavailable")

        available_endpoints += 1
        if result:
            occupied = True

    if available_endpoints == 0:
        raise RuntimeError("no loopback endpoint available")

    return occupied


def check_apply_session_safety(
    project_root: Path,
    port_probe: Callable[[int], bool] = _port_is_occupied,
) -> List[str]:
    """
    Fail closed using only the requested session checks.

    The lock is not opened or read. Port probes never start, stop, or modify
    processes.
    """
    reasons: List[str] = []
    lock_path = project_root / "launcher" / ".runtime" / "launcher.lock"

    try:
        lock_path.lstat()
    except FileNotFoundError:
        pass
    except OSError:
        reasons.append("launcher_lock_check_failed")
    else:
        reasons.append("launcher_lock_exists")

    for port in (3000, 3001):
        try:
            if port_probe(port):
                reasons.append("port_{0}_occupied".format(port))
        except Exception:
            reasons.append("port_{0}_check_failed".format(port))

    return reasons


def _is_regular_non_symlink(path: Path) -> bool:
    try:
        current = path.lstat()
    except OSError:
        return False
    return stat.S_ISREG(current.st_mode) and not stat.S_ISLNK(current.st_mode)


def _default_unlink(path: Path) -> None:
    path.unlink()


def run_cleanup(
    selected_caches: Sequence[str],
    policies: RetentionPolicies,
    apply: bool = False,
    offline_confirmed: bool = False,
    project_root: Optional[Path] = None,
    now_epoch: Optional[float] = None,
    session_checker: Callable[[Path], List[str]] = check_apply_session_safety,
    unlinker: Optional[Callable[[Path], None]] = None,
) -> Dict[str, object]:
    """
    Scan only allow-listed cache roots and, only when explicitly enabled,
    delete selected regular JSON files.

    project_root, session_checker and unlinker are dependency-injection points
    for tests. Command-line callers cannot supply a directory.
    """
    selected = _dedupe_preserving_order(selected_caches)
    unknown = [cache for cache in selected if cache not in CACHE_RELATIVE_DIRS]
    if unknown:
        raise ValueError("unknown cache selection")

    root = (project_root or PROJECT_ROOT).resolve()
    mode = "apply" if apply else "dry-run"
    report = _new_report(selected, policies, mode)

    if not policies.has_any():
        _append_error(report, "usage: at least one retention policy is required")
        return report

    # Usage error: do not scan or nominate candidates when confirmation is absent.
    if apply and not offline_confirmed:
        report["blocked"] = True
        report["blockReasons"].append("offline_confirmation_required")
        _append_error(report, "usage: --apply requires --offline-confirmed")
        return report

    records_by_cache: Dict[str, List[Dict[str, object]]] = {}
    for cache_name in selected:
        records_by_cache[cache_name] = _scan_cache(root, cache_name, report)

    candidates = _select_candidates(
        records_by_cache,
        policies,
        time.time() if now_epoch is None else now_epoch,
    )
    report["candidates"] = [_public_candidate(candidate) for candidate in candidates]

    if not apply:
        return report

    block_reasons = session_checker(root)
    if block_reasons:
        report["blocked"] = True
        report["blockReasons"].extend(block_reasons)
        return report

    remove = unlinker or _default_unlink

    for candidate in candidates:
        record = candidate["record"]
        file_path = record["path_object"]
        file_text = record["path"]

        # Re-check immediately before unlinking; never remove a changed symlink,
        # directory, or non-regular path.
        if not _is_regular_non_symlink(file_path):
            _append_skipped(report, file_text, "changed_before_removal")
            continue

        try:
            remove(file_path)
        except OSError as exc:
            _append_error(
                report,
                "remove failed for {0}: {1}".format(
                    file_text,
                    type(exc).__name__,
                ),
            )
            continue

        report["removed"].append(_public_candidate(candidate))
        report["recoveredBytes"] += int(record["bytes"])

    return report


def parse_cli_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = JsonArgumentParser(
        add_help=False,
        allow_abbrev=False,
        description="Retention utility for allow-listed runtime caches.",
    )
    parser.add_argument(
        "--cache",
        action="append",
        choices=tuple(CACHE_RELATIVE_DIRS.keys()),
        dest="caches",
    )
    parser.add_argument(
        "--max-age-days",
        type=_non_negative_int,
        dest="max_age_days",
    )
    parser.add_argument(
        "--max-files",
        type=_non_negative_int,
        dest="max_files",
    )
    parser.add_argument(
        "--max-total-bytes",
        type=_non_negative_int,
        dest="max_total_bytes",
    )

    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument("--dry-run", action="store_true")
    mode_group.add_argument("--apply", action="store_true")
    parser.add_argument("--offline-confirmed", action="store_true")

    args = parser.parse_args(argv)

    if not args.caches:
        raise UsageError("--cache is required")

    policies = RetentionPolicies(
        max_age_days=args.max_age_days,
        max_files=args.max_files,
        max_total_bytes=args.max_total_bytes,
    )
    if not policies.has_any():
        raise UsageError("at least one retention policy is required")

    return args


def _usage_report(message: str, mode: str) -> Dict[str, object]:
    report = _new_report([], RetentionPolicies(), mode)
    _append_error(report, "usage: {0}".format(message))
    return report


def main(argv: Optional[Sequence[str]] = None) -> int:
    supplied = list(sys.argv[1:] if argv is None else argv)
    requested_mode = "apply" if "--apply" in supplied else "dry-run"

    try:
        args = parse_cli_args(supplied)
    except UsageError as exc:
        report = _usage_report(str(exc), requested_mode)
        sys.stdout.write(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        return 2

    policies = RetentionPolicies(
        max_age_days=args.max_age_days,
        max_files=args.max_files,
        max_total_bytes=args.max_total_bytes,
    )
    report = run_cleanup(
        selected_caches=args.caches,
        policies=policies,
        apply=args.apply,
        offline_confirmed=args.offline_confirmed,
    )
    sys.stdout.write(json.dumps(report, ensure_ascii=False, indent=2) + "\n")

    if any(
        isinstance(error, str) and error.startswith("usage:")
        for error in report["errors"]
    ):
        return 2
    if report["blocked"]:
        return 3
    if report["errors"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
