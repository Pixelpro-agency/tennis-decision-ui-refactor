#!/usr/bin/env python3
"""Read-only Markdown/MDX link checker for the repository.

The checker never rewrites files. It scans repository Markdown sources, reports
source file, line and target, and distinguishes missing targets from anchor
problems. During the MDX -> Markdown migration, .mdx references are warnings by
default and can be promoted to errors with --forbid-mdx-links.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterator, Sequence
from urllib.parse import unquote, urlsplit

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MARKDOWN_SUFFIXES = {".md", ".mdx"}
DEFAULT_EXCLUDED_PARTS = {
    ".git",
    ".idea",
    ".pytest_cache",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "node_modules",
    "venv",
}
DEFAULT_EXCLUDED_PREFIXES = {
    ("backend", "match_history"),
    ("backend", "betfair_network_dump"),
    ("backend", "betfair_cache"),
    ("backend", "scraper_cache"),
    ("backend", "scraper_profile"),
    ("launcher", ".runtime"),
}
EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}

INLINE_LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
REFERENCE_LINK_RE = re.compile(r"^\s{0,3}\[[^\]]+\]:\s*(\S+)")
ATX_HEADING_RE = re.compile(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$")
SETEXT_RE = re.compile(r"^\s{0,3}(=+|-+)\s*$")
EXPLICIT_ID_RE = re.compile(r"\b(?:id|name)\s*=\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)
MARKDOWN_LINK_TEXT_RE = re.compile(r"!?\[([^\]]+)\]\([^)]*\)")
HTML_TAG_RE = re.compile(r"<[^>]+>")
CODE_SPAN_RE = re.compile(r"`+([^`]*)`+")


@dataclass(frozen=True)
class Finding:
    severity: str
    code: str
    source: str
    line: int
    target: str
    message: str


class UsageError(ValueError):
    pass


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise UsageError(message)


def relative_path(root: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def is_excluded(root: Path, path: Path, include_legacy: bool) -> bool:
    try:
        parts = path.resolve().relative_to(root.resolve()).parts
    except ValueError:
        return True

    if any(part in DEFAULT_EXCLUDED_PARTS for part in parts):
        return True
    if not include_legacy and "legacy" in parts:
        return True
    for prefix in DEFAULT_EXCLUDED_PREFIXES:
        if parts[: len(prefix)] == prefix:
            return True
    return False


def iter_markdown_files(root: Path, include_legacy: bool = False) -> Iterator[Path]:
    for current_root, dirnames, filenames in os.walk(root):
        current = Path(current_root)
        dirnames[:] = sorted(
            dirname
            for dirname in dirnames
            if not is_excluded(root, current / dirname, include_legacy)
        )
        for filename in sorted(filenames):
            path = current / filename
            if path.suffix.lower() in MARKDOWN_SUFFIXES and not is_excluded(
                root, path, include_legacy
            ):
                yield path


def strip_optional_title(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<") and ">" in value:
        return value[1 : value.index(">")]
    # Markdown permits an optional quoted title after whitespace. Repository
    # paths containing spaces should be wrapped in angle brackets.
    match = re.match(r"^(\S+)(?:\s+['\"(].*)?$", value)
    return match.group(1) if match else value


def iter_links(path: Path) -> Iterator[tuple[int, str]]:
    in_fence = False
    fence_char = ""
    fence_len = 0
    lines = path.read_text(encoding="utf-8").splitlines()

    for line_number, line in enumerate(lines, 1):
        fence_match = re.match(r"^\s*(`{3,}|~{3,})", line)
        if fence_match:
            marker = fence_match.group(1)
            if not in_fence:
                in_fence = True
                fence_char = marker[0]
                fence_len = len(marker)
            elif marker[0] == fence_char and len(marker) >= fence_len:
                in_fence = False
            continue
        if in_fence:
            continue

        for match in INLINE_LINK_RE.finditer(line):
            yield line_number, strip_optional_title(match.group(1))
        reference = REFERENCE_LINK_RE.match(line)
        if reference:
            yield line_number, strip_optional_title(reference.group(1))


def slugify_heading(value: str) -> str:
    value = html.unescape(value.strip())
    value = MARKDOWN_LINK_TEXT_RE.sub(r"\1", value)
    value = CODE_SPAN_RE.sub(r"\1", value)
    value = HTML_TAG_RE.sub("", value)
    value = unicodedata.normalize("NFC", value).lower()
    output: list[str] = []
    for char in value:
        category = unicodedata.category(char)
        if char.isspace():
            output.append("-")
        elif char in {"-", "_"} or category[0] in {"L", "N"}:
            output.append(char)
    slug = re.sub(r"-+", "-", "".join(output)).strip("-")
    return slug


def extract_anchors(path: Path) -> set[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    anchors: set[str] = set()
    counts: dict[str, int] = {}
    in_fence = False
    fence_char = ""
    fence_len = 0
    previous_text: tuple[int, str] | None = None

    def add_heading(text: str) -> None:
        base = slugify_heading(text)
        if not base:
            return
        count = counts.get(base, 0)
        anchor = base if count == 0 else f"{base}-{count}"
        counts[base] = count + 1
        anchors.add(anchor)

    for line_number, line in enumerate(lines, 1):
        fence_match = re.match(r"^\s*(`{3,}|~{3,})", line)
        if fence_match:
            marker = fence_match.group(1)
            if not in_fence:
                in_fence = True
                fence_char = marker[0]
                fence_len = len(marker)
            elif marker[0] == fence_char and len(marker) >= fence_len:
                in_fence = False
            previous_text = None
            continue
        if in_fence:
            continue

        for explicit in EXPLICIT_ID_RE.finditer(line):
            anchors.add(unquote(explicit.group(1)).lower())

        atx = ATX_HEADING_RE.match(line)
        if atx:
            add_heading(atx.group(2))
            previous_text = None
            continue

        if SETEXT_RE.match(line) and previous_text and previous_text[1].strip():
            add_heading(previous_text[1])
            previous_text = None
            continue

        previous_text = (line_number, line) if line.strip() else None

    return anchors


def split_target(raw_target: str) -> tuple[str, str]:
    decoded = unquote(raw_target.strip())
    if decoded.startswith("#"):
        return "", decoded[1:]
    parsed = urlsplit(decoded)
    return parsed.path, parsed.fragment


def is_external_target(raw_target: str) -> bool:
    value = raw_target.strip()
    if value.startswith("//"):
        return True
    parsed = urlsplit(value)
    if parsed.scheme.lower() in EXTERNAL_SCHEMES:
        return True
    # Windows absolute paths and other URI-like targets are not repository
    # relative links. They are outside the filesystem checker contract.
    if parsed.scheme and len(parsed.scheme) > 1:
        return True
    return False


def resolve_target(root: Path, source: Path, target_path: str) -> Path:
    if not target_path:
        return source
    if target_path.startswith("/"):
        return root / target_path.lstrip("/")
    return source.parent / target_path


def check_links(
    root: Path,
    *,
    include_legacy: bool = False,
    forbid_mdx_links: bool = False,
) -> dict[str, object]:
    root = root.resolve()
    findings: list[Finding] = []
    scanned_files = 0
    scanned_links = 0
    anchor_cache: dict[Path, set[str]] = {}

    for source in iter_markdown_files(root, include_legacy=include_legacy):
        scanned_files += 1
        try:
            links = list(iter_links(source))
        except (OSError, UnicodeError) as exc:
            findings.append(
                Finding(
                    "error",
                    "source_unreadable",
                    relative_path(root, source),
                    0,
                    "",
                    f"cannot read source: {type(exc).__name__}",
                )
            )
            continue

        for line_number, raw_target in links:
            scanned_links += 1
            if not raw_target or is_external_target(raw_target):
                continue
            target_path, anchor = split_target(raw_target)
            resolved = resolve_target(root, source, target_path).resolve()
            source_text = relative_path(root, source)

            if target_path.lower().endswith(".mdx"):
                findings.append(
                    Finding(
                        "error" if forbid_mdx_links else "warning",
                        "legacy_mdx_link",
                        source_text,
                        line_number,
                        raw_target,
                        "link still points to an .mdx document",
                    )
                )

            try:
                exists = resolved.exists()
            except OSError:
                exists = False
            if not exists:
                findings.append(
                    Finding(
                        "error",
                        "target_missing",
                        source_text,
                        line_number,
                        raw_target,
                        f"target does not exist: {relative_path(root, resolved)}",
                    )
                )
                continue

            if not anchor:
                continue
            normalized_anchor = unquote(anchor).strip().lower()
            if not normalized_anchor:
                findings.append(
                    Finding(
                        "error",
                        "anchor_unverifiable",
                        source_text,
                        line_number,
                        raw_target,
                        "anchor is empty after decoding",
                    )
                )
                continue
            if resolved.suffix.lower() not in MARKDOWN_SUFFIXES:
                findings.append(
                    Finding(
                        "error",
                        "anchor_unverifiable",
                        source_text,
                        line_number,
                        raw_target,
                        "anchor target is not a Markdown/MDX file",
                    )
                )
                continue
            try:
                anchors = anchor_cache.setdefault(resolved, extract_anchors(resolved))
            except (OSError, UnicodeError) as exc:
                findings.append(
                    Finding(
                        "error",
                        "anchor_unverifiable",
                        source_text,
                        line_number,
                        raw_target,
                        f"cannot inspect target anchors: {type(exc).__name__}",
                    )
                )
                continue
            if normalized_anchor not in anchors:
                findings.append(
                    Finding(
                        "error",
                        "anchor_missing",
                        source_text,
                        line_number,
                        raw_target,
                        f"anchor not found in {relative_path(root, resolved)}",
                    )
                )

    errors = sum(1 for item in findings if item.severity == "error")
    warnings = sum(1 for item in findings if item.severity == "warning")
    return {
        "tool": "documentation_links",
        "root": ".",
        "readOnly": True,
        "scannedFiles": scanned_files,
        "scannedLinks": scanned_links,
        "errors": errors,
        "warnings": warnings,
        "findings": [asdict(item) for item in findings],
    }


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = JsonArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=PROJECT_ROOT)
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--include-legacy", action="store_true")
    parser.add_argument("--forbid-mdx-links", action="store_true")
    parser.add_argument("--fail-on-warning", action="store_true")
    return parser.parse_args(argv)


def print_text(report: dict[str, object]) -> None:
    print(
        "documentation links: {0} files, {1} links, {2} errors, {3} warnings".format(
            report["scannedFiles"],
            report["scannedLinks"],
            report["errors"],
            report["warnings"],
        )
    )
    for item in report["findings"]:
        print(
            "{severity} {code} {source}:{line} -> {target}: {message}".format(**item)
        )


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = parse_args(argv)
        report = check_links(
            args.root,
            include_legacy=args.include_legacy,
            forbid_mdx_links=args.forbid_mdx_links,
        )
    except UsageError as exc:
        print(json.dumps({"tool": "documentation_links", "usageError": str(exc)}))
        return 2
    except Exception as exc:  # fail closed, bounded public error
        print(
            json.dumps(
                {
                    "tool": "documentation_links",
                    "internalError": type(exc).__name__,
                }
            )
        )
        return 2

    if args.format == "json":
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_text(report)

    if report["errors"]:
        return 1
    if args.fail_on_warning and report["warnings"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
