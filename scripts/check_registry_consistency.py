#!/usr/bin/env python3
"""Read-only consistency checker for Todo and revision registers.

The checker compares canonical synthetic rows in Todo Blocks E/F with detailed
owner cards under implementazioni/, validates declared prefixes, detects owner
and synthetic duplicates, and reports strict status contradictions. It never
renumbers IDs or edits files.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Sequence

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TODO_PATH = Path("todo-list-tennis-decision-ui.md")
METHOD_PATH = Path("implementazioni/00-metodo-e-stati.md")
REGISTRY_DIR = Path("implementazioni")

ID_RE = re.compile(r"\b([A-Z][A-Z0-9]*-\d{3})\b")
OWNER_HEADING_RE = re.compile(
    r"^(#{2,6})\s+([A-Z][A-Z0-9]*-\d{3})\s+[—-]\s+(.+?)\s*$"
)
TODO_ROW_RE = re.compile(r"^\s*-\s+\[[^\]]\]\s+`?([A-Z][A-Z0-9]*-\d{3})`?\s+[—-]")
PREFIX_RE = re.compile(r"`([A-Z][A-Z0-9]*)-`")
STATUS_LINE_RE = re.compile(r"^\s*\*\*Stato:\*\*\s*(.+?)\s*$", re.IGNORECASE)
SHA_LABEL_RE = re.compile(
    r"SHA\s+(?P<label>codice\s+verificato|checkpoint[^:]*):\s*(?P<sha>[0-9a-f]{7,40})",
    re.IGNORECASE,
)
RANGE_RE = re.compile(
    r"\b(?P<prefix>[A-Z][A-Z0-9]*)-(?P<start>\d{3})\s*(?:…|\.\.\.|–)\s*(?P<end>\d{3})\b"
)
POINT_HEADING_RE = re.compile(r"^#{1,6}.*\bPunto\s+(\d+)\b", re.IGNORECASE)
COMPLETED_POINT_RE = re.compile(
    r"\bPunto\s+(\d+)\b.*\b(?:completat|approvat)", re.IGNORECASE
)
NEXT_STEP_RE = re.compile(r"prossim[oa]\s+(?:passo|punto)\s*:\s*(.+)", re.IGNORECASE)
NEXT_TOKEN_RE = re.compile(r"\b(?:Batch\s+\d+|IMPL-\d{3}|Punto\s+\d+)\b", re.IGNORECASE)

PARITY_EXCLUDED_PREFIXES = {"DEC"}
SYNTHETIC_SECTION_HEADINGS = {
    "# BLOCCO E — Rilievi registrati",
    "# BLOCCO F — Implementazioni utili",
}
STRICT_STATE_TOKENS = {
    "DA VERIFICARE",
    "IN VERIFICA",
    "CONFERMATO",
    "DA DECIDERE",
    "APPROVATO",
    "PRONTO PER TASK",
    "IN ESECUZIONE",
    "COMPLETATO",
    "SCARTATO",
    "RINVIATO",
    "FUTURO",
    "MANCANTE",
}


@dataclass(frozen=True)
class Location:
    file: str
    line: int
    title: str
    status: str | None = None


@dataclass(frozen=True)
class Finding:
    severity: str
    code: str
    identifier: str
    locations: tuple[Location, ...]
    message: str


class UsageError(ValueError):
    pass


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise UsageError(message)


def relative_path(root: Path, path: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def normalize_text(value: str) -> str:
    value = value.replace("`", " ").replace("*", " ")
    return re.sub(r"\s+", " ", value).strip().upper()


def extract_state_tokens(value: str | None) -> set[str]:
    if not value:
        return set()
    normalized = normalize_text(value)
    return {token for token in STRICT_STATE_TOKENS if token in normalized}


def statuses_are_incompatible(owner_status: str | None, todo_status: str | None) -> bool:
    owner = extract_state_tokens(owner_status)
    todo = extract_state_tokens(todo_status)
    if not owner or not todo:
        return False

    if "COMPLETATO" in owner and todo.intersection(
        {"DA VERIFICARE", "IN VERIFICA", "IN ESECUZIONE", "MANCANTE"}
    ):
        return True
    if "MANCANTE" in owner and "COMPLETATO" in todo:
        return True
    if "SCARTATO" in owner and todo.intersection(
        {"APPROVATO", "PRONTO PER TASK", "IN ESECUZIONE", "COMPLETATO"}
    ):
        return True
    if owner.intersection({"RINVIATO", "FUTURO"}) and todo.intersection(
        {"PRONTO PER TASK", "IN ESECUZIONE", "COMPLETATO"}
    ):
        return True
    return False


def read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def find_card_status(lines: Sequence[str], start_index: int, heading_level: int) -> str | None:
    for index in range(start_index + 1, len(lines)):
        line = lines[index]
        heading = re.match(r"^(#{1,6})\s+", line)
        if heading and len(heading.group(1)) <= heading_level:
            break
        status = STATUS_LINE_RE.match(line)
        if status:
            return status.group(1).strip()
    return None


def collect_owner_cards(root: Path) -> dict[str, list[Location]]:
    owners: dict[str, list[Location]] = defaultdict(list)
    registry_root = root / REGISTRY_DIR
    if not registry_root.is_dir():
        raise FileNotFoundError(REGISTRY_DIR.as_posix())

    for path in sorted(registry_root.glob("*.md")):
        lines = read_lines(path)
        for index, line in enumerate(lines):
            match = OWNER_HEADING_RE.match(line)
            if not match:
                continue
            identifier = match.group(2)
            status = find_card_status(lines, index, len(match.group(1)))
            owners[identifier].append(
                Location(
                    relative_path(root, path),
                    index + 1,
                    match.group(3).strip(),
                    status,
                )
            )
    return owners


def collect_synthetic_rows(root: Path) -> dict[str, list[Location]]:
    path = root / TODO_PATH
    lines = read_lines(path)
    rows: dict[str, list[Location]] = defaultdict(list)
    active = False

    for index, line in enumerate(lines):
        if line.startswith("# "):
            active = line.strip() in SYNTHETIC_SECTION_HEADINGS
            continue
        if not active:
            continue
        match = TODO_ROW_RE.match(line)
        if not match:
            continue
        identifier = match.group(1)
        tail = line[match.end() :].strip()
        rows[identifier].append(
            Location(relative_path(root, path), index + 1, tail, tail)
        )
    return rows


def collect_declared_prefixes(root: Path) -> set[str]:
    path = root / METHOD_PATH
    prefixes = set(PREFIX_RE.findall(path.read_text(encoding="utf-8")))
    prefixes.add("DEC")
    return prefixes


def collect_all_ids(root: Path) -> dict[str, list[Location]]:
    occurrences: dict[str, list[Location]] = defaultdict(list)
    candidates = [root / TODO_PATH, root / "implementazioni-tennis-decision-ui.md"]
    candidates.extend(sorted((root / REGISTRY_DIR).glob("*.md")))
    for path in candidates:
        if not path.is_file():
            continue
        for line_number, line in enumerate(read_lines(path), 1):
            for identifier in ID_RE.findall(line):
                occurrences[identifier].append(
                    Location(relative_path(root, path), line_number, line.strip())
                )
    return occurrences


def prefix_of(identifier: str) -> str:
    return identifier.split("-", 1)[0]



def extract_next_step(lines: Sequence[str]) -> str | None:
    for line in lines:
        match = NEXT_STEP_RE.search(line)
        if match:
            return match.group(1).strip()

    start = None
    for index, line in enumerate(lines):
        if line.strip().lower() == "## prossimo punto":
            start = index + 1
            break
    if start is None:
        return None

    collected: list[str] = []
    in_fence = False
    for line in lines[start:]:
        if line.startswith("## "):
            break
        if line.strip().startswith("```"):
            in_fence = not in_fence
            continue
        text = line.strip()
        if not text or text == "---":
            continue
        collected.append(text)
        if len(collected) >= 8:
            break
    return " ".join(collected) if collected else None

def collect_summary_metadata(
    root: Path,
    owners: dict[str, list[Location]],
    rows: dict[str, list[Location]],
) -> dict[str, object]:
    summary_paths = [root / "implementazioni-tennis-decision-ui.md", root / TODO_PATH]
    sha_values: dict[str, set[str]] = defaultdict(set)
    ranges: list[dict[str, object]] = []
    next_steps: dict[str, str] = {}
    summary_ids: set[str] = set()

    for path in summary_paths:
        if not path.is_file():
            continue
        lines = read_lines(path)
        for line_number, line in enumerate(lines, 1):
            summary_ids.update(ID_RE.findall(line))
            for match in SHA_LABEL_RE.finditer(line):
                label = (
                    "code"
                    if "codice" in match.group("label").lower()
                    else "checkpoint"
                )
                sha_values[label].add(match.group("sha").lower())
            if path.name != TODO_PATH.name or line_number <= 180:
                for match in RANGE_RE.finditer(line):
                    ranges.append(
                        {
                            "file": relative_path(root, path),
                            "line": line_number,
                            "prefix": match.group("prefix"),
                            "start": int(match.group("start")),
                            "end": int(match.group("end")),
                            "text": match.group(0),
                        }
                    )
        next_step = extract_next_step(lines)
        if next_step:
            next_steps[relative_path(root, path)] = next_step

    audit_path = root / REGISTRY_DIR / "03-audit-codice.md"
    audit_point = None
    if audit_path.is_file():
        points = [
            int(match.group(1))
            for line in read_lines(audit_path)
            if (match := POINT_HEADING_RE.match(line))
        ]
        audit_point = max(points) if points else None

    summary_points: dict[str, int] = {}
    for path in summary_paths:
        if not path.is_file():
            continue
        points = []
        for line in read_lines(path):
            match = COMPLETED_POINT_RE.search(line)
            if match:
                points.append(int(match.group(1)))
        if points:
            summary_points[relative_path(root, path)] = max(points)

    owner_max: dict[str, int] = {}
    for identifier in owners:
        prefix, number = identifier.split("-", 1)
        owner_max[prefix] = max(owner_max.get(prefix, 0), int(number))
    row_max: dict[str, int] = {}
    for identifier in rows:
        prefix, number = identifier.split("-", 1)
        row_max[prefix] = max(row_max.get(prefix, 0), int(number))

    return {
        "shaValues": {key: sorted(values) for key, values in sha_values.items()},
        "ranges": ranges,
        "nextSteps": next_steps,
        "auditPoint": audit_point,
        "summaryPoints": summary_points,
        "ownerMax": owner_max,
        "rowMax": row_max,
        "summaryIds": summary_ids,
    }


def check_registries(root: Path) -> dict[str, object]:
    root = root.resolve()
    findings: list[Finding] = []
    owners = collect_owner_cards(root)
    rows = collect_synthetic_rows(root)
    declared = collect_declared_prefixes(root)
    all_ids = collect_all_ids(root)
    metadata = collect_summary_metadata(root, owners, rows)

    for identifier, locations in sorted(owners.items()):
        if len(locations) > 1:
            findings.append(
                Finding(
                    "error",
                    "duplicate_owner_card",
                    identifier,
                    tuple(locations),
                    "identifier has more than one detailed owner card",
                )
            )

    for identifier, locations in sorted(rows.items()):
        if len(locations) > 1:
            findings.append(
                Finding(
                    "error",
                    "duplicate_synthetic_row",
                    identifier,
                    tuple(locations),
                    "identifier has more than one canonical Todo row",
                )
            )

    parity_owner_ids = {
        identifier
        for identifier in owners
        if prefix_of(identifier) not in PARITY_EXCLUDED_PREFIXES
    }
    parity_row_ids = {
        identifier
        for identifier in rows
        if prefix_of(identifier) not in PARITY_EXCLUDED_PREFIXES
    }

    for identifier in sorted(parity_owner_ids - parity_row_ids):
        findings.append(
            Finding(
                "error",
                "owner_without_synthetic_row",
                identifier,
                tuple(owners[identifier]),
                "detailed owner card has no canonical Todo row in Blocks E/F",
            )
        )

    for identifier in sorted(parity_row_ids - parity_owner_ids):
        findings.append(
            Finding(
                "error",
                "synthetic_row_without_owner",
                identifier,
                tuple(rows[identifier]),
                "canonical Todo row has no detailed owner card",
            )
        )

    # Validate prefixes only for canonical registry identities. Free prose can
    # legitimately contain unrelated tokens such as SHA-256; those are not
    # registry IDs and must not produce an unknown-prefix finding.
    canonical_ids = set(owners) | set(rows)
    used_prefixes = {prefix_of(identifier) for identifier in canonical_ids}
    for prefix in sorted(used_prefixes - declared):
        locations: list[Location] = []
        for identifier in sorted(canonical_ids):
            if prefix_of(identifier) != prefix:
                continue
            locations.extend(owners.get(identifier, ())[:1])
            locations.extend(rows.get(identifier, ())[:1])
        findings.append(
            Finding(
                "error",
                "unknown_prefix",
                prefix + "-",
                tuple(locations[:10]),
                "prefix is used but not declared in implementazioni/00-metodo-e-stati.md",
            )
        )

    for identifier in sorted(set(owners).intersection(rows)):
        owner_statuses = [location.status for location in owners[identifier]]
        todo_statuses = [location.status for location in rows[identifier]]
        for owner_status in owner_statuses:
            for todo_status in todo_statuses:
                if statuses_are_incompatible(owner_status, todo_status):
                    findings.append(
                        Finding(
                            "error",
                            "incompatible_status",
                            identifier,
                            tuple(owners[identifier] + rows[identifier]),
                            f"owner status {owner_status!r} conflicts with Todo status {todo_status!r}",
                        )
                    )
                    break
            else:
                continue
            break

    for label, values in metadata["shaValues"].items():
        if len(values) > 1:
            findings.append(
                Finding(
                    "error",
                    "sha_baseline_mismatch",
                    label,
                    tuple(),
                    f"summary registries expose different {label} SHA values: {values}",
                )
            )

    for range_item in metadata["ranges"]:
        if range_item["start"] != 1:
            continue
        expected = metadata["ownerMax"].get(range_item["prefix"])
        if expected is not None and range_item["end"] != expected:
            findings.append(
                Finding(
                    "error",
                    "synthetic_range_mismatch",
                    range_item["text"],
                    (
                        Location(
                            range_item["file"],
                            range_item["line"],
                            range_item["text"],
                        ),
                    ),
                    f"range ends at {range_item['end']:03d}, detailed owner max is {expected:03d}",
                )
            )

    for prefix in ("TEST", "IMPL"):
        owner_latest = metadata["ownerMax"].get(prefix)
        row_latest = metadata["rowMax"].get(prefix)
        if owner_latest != row_latest:
            findings.append(
                Finding(
                    "error",
                    "latest_id_mismatch",
                    prefix + "-",
                    tuple(),
                    f"latest detailed ID is {owner_latest}, latest Todo ID is {row_latest}",
                )
            )

    latest_decision = metadata["ownerMax"].get("DEC")
    if latest_decision is not None:
        decision_id = f"DEC-{latest_decision:03d}"
        if decision_id not in metadata["summaryIds"]:
            findings.append(
                Finding(
                    "error",
                    "latest_decision_not_summarized",
                    decision_id,
                    tuple(),
                    "latest decision ID is absent from root/Todo summaries",
                )
            )

    audit_point = metadata["auditPoint"]
    for file_name, summary_point in metadata["summaryPoints"].items():
        if audit_point is not None and summary_point != audit_point:
            findings.append(
                Finding(
                    "error",
                    "last_point_mismatch",
                    f"Punto {summary_point}",
                    (Location(file_name, 0, f"Punto {summary_point}"),),
                    f"summary last completed point is {summary_point}, audit max point is {audit_point}",
                )
            )

    next_steps = metadata["nextSteps"]
    if len(next_steps) >= 2:
        token_sets = {
            file_name: {token.lower() for token in NEXT_TOKEN_RE.findall(value)}
            for file_name, value in next_steps.items()
        }
        non_empty = [tokens for tokens in token_sets.values() if tokens]
        if non_empty and any(tokens != non_empty[0] for tokens in non_empty[1:]):
            findings.append(
                Finding(
                    "error",
                    "next_step_mismatch",
                    "next-step",
                    tuple(
                        Location(file_name, 0, value)
                        for file_name, value in next_steps.items()
                    ),
                    f"summary registries expose different next-step tokens: {token_sets}",
                )
            )
    elif len(next_steps) < 2:
        findings.append(
            Finding(
                "warning",
                "next_step_marker_missing",
                "next-step",
                tuple(
                        Location(file_name, 0, value)
                        for file_name, value in next_steps.items()
                    ),
                "root index and Todo should both expose a parseable next-step marker",
            )
        )

    errors = sum(1 for item in findings if item.severity == "error")
    warnings = sum(1 for item in findings if item.severity == "warning")
    return {
        "tool": "registry_consistency",
        "root": ".",
        "readOnly": True,
        "ownerCards": len(owners),
        "syntheticRows": len(rows),
        "declaredPrefixes": sorted(declared),
        "metadata": {
            "shaValues": metadata["shaValues"],
            "ranges": metadata["ranges"],
            "nextSteps": metadata["nextSteps"],
            "auditPoint": metadata["auditPoint"],
            "summaryPoints": metadata["summaryPoints"],
            "ownerMax": metadata["ownerMax"],
            "rowMax": metadata["rowMax"],
        },
        "errors": errors,
        "warnings": warnings,
        "findings": [
            {
                **{
                    key: value
                    for key, value in asdict(item).items()
                    if key != "locations"
                },
                "locations": [asdict(location) for location in item.locations],
            }
            for item in findings
        ],
    }


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = JsonArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=PROJECT_ROOT)
    parser.add_argument("--format", choices=("text", "json"), default="text")
    return parser.parse_args(argv)


def print_text(report: dict[str, object]) -> None:
    print(
        "registry consistency: {0} owner IDs, {1} Todo rows, {2} errors, {3} warnings".format(
            report["ownerCards"],
            report["syntheticRows"],
            report["errors"],
            report["warnings"],
        )
    )
    for item in report["findings"]:
        locations = ", ".join(
            f"{location['file']}:{location['line']}" for location in item["locations"]
        )
        print(
            f"{item['severity']} {item['code']} {item['identifier']} [{locations}]: {item['message']}"
        )


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = parse_args(argv)
        report = check_registries(args.root)
    except UsageError as exc:
        print(json.dumps({"tool": "registry_consistency", "usageError": str(exc)}))
        return 2
    except Exception as exc:
        print(
            json.dumps(
                {
                    "tool": "registry_consistency",
                    "internalError": type(exc).__name__,
                }
            )
        )
        return 2

    if args.format == "json":
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_text(report)
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
