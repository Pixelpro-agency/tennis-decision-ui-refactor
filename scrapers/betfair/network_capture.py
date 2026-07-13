import asyncio
import hashlib
import json
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

from .config import (
    BETFAIR_HOSTS,
    EXCLUDED_HOSTS,
    INTERESTING_PATH_KEYWORDS,
    NETWORK_DUMP_DIR,
    log,
)
from .diagnostic_redaction import (
    redact_headers,
    redact_text,
    redact_url,
    redact_value,
)
from .parsing import sanitize_filename


INTERESTING_DATA_KEYS = (
    "price",
    "odds",
    "traded",
    "volume",
    "matched",
    "time",
    "timestamp",
    "ltp",
    "runner",
    "selection",
    "market",
)


def ensure_network_dump_dir():
    try:
        NETWORK_DUMP_DIR.mkdir(parents=True, exist_ok=True)
    except Exception as error:
        log(f"[NetworkCapture] Failed to create dump dir: {error}")

    return NETWORK_DUMP_DIR


def is_interesting_betfair_response(url, content_type=""):
    if not url:
        return False

    parsed = urlsplit(url)
    host = (parsed.hostname or "").lower()
    path = (parsed.path or "").lower()

    if any(
        host == excluded or host.endswith("." + excluded)
        for excluded in EXCLUDED_HOSTS
    ):
        return False

    if host in BETFAIR_HOSTS:
        return True

    if host.endswith(".betfair.it"):
        return any(keyword in path for keyword in INTERESTING_PATH_KEYWORDS)

    return False


async def handle_network_response(response, collector, dump_dir):
    if not collector.get("enabled"):
        return

    dumpPath = Path(dump_dir)

    try:
        url = response.url
        redactedUrl = redact_url(url)
        status = response.status
        headers = response.headers

        contentType = ""

        for key, value in headers.items():
            if key.lower() == "content-type":
                contentType = (value or "").lower()
                break

        if not is_interesting_betfair_response(url, contentType):
            return

        record = {
            "url": redactedUrl,
            "status": status,
            "content_type": redact_text(contentType),
            "timestamp": datetime.now().isoformat(),
            "headers": redact_headers(headers),
        }

        collector["responses"].append(record)

        shortName = sanitize_filename(
            redactedUrl.split("?")[0].split("/")[-1] or "response"
        )[:80]

        urlHash = hashlib.md5(
            redactedUrl.encode("utf-8")
        ).hexdigest()[:12]

        baseName = (
            f"{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}_"
            f"{shortName}_{urlHash}"
        )

        body = None
        bodySaved = False

        try:
            body = await response.body()
        except Exception as error:
            errorText = redact_text(str(error))
            log(
                f"[NetworkCapture] Could not read body for "
                f"{redactedUrl}: {errorText}"
            )
            collector["errors"].append({
                "url": redactedUrl,
                "error": f"body read failed: {errorText}",
            })

        if body is not None and len(body) > 5 * 1024 * 1024:
            log(
                f"[NetworkCapture] Body too large "
                f"({len(body)} bytes), skipping save: {redactedUrl}"
            )
            body = None
            record["skipped"] = "body_too_large"

        parsedJson = None
        redactedJson = None

        if body is not None:
            looksJson = (
                "json" in contentType
                or body.strip()[:1] in (b"{", b"[")
            )

            if looksJson:
                try:
                    parsedJson = json.loads(
                        body.decode("utf-8", errors="replace")
                    )
                    redactedJson = redact_value(parsedJson)
                    record["json"] = True
                    collector["json_payloads"].append({
                        "url": redactedUrl,
                        "status": status,
                        "payload": redactedJson,
                    })
                except Exception as error:
                    errorText = redact_text(str(error))
                    log(
                        f"[NetworkCapture] JSON parse failed "
                        f"for {redactedUrl}: {errorText}"
                    )
                    collector["errors"].append({
                        "url": redactedUrl,
                        "error": f"json parse: {errorText}",
                    })

        try:
            metaPath = dumpPath / f"{baseName}_meta.json"

            with metaPath.open("w", encoding="utf-8") as file:
                json.dump(record, file, ensure_ascii=False, indent=2)

            collector["saved"].append(str(metaPath))
        except Exception as error:
            errorText = redact_text(str(error))
            log(
                f"[NetworkCapture] Failed to write metadata "
                f"for {redactedUrl}: {errorText}"
            )
            collector["errors"].append({
                "url": redactedUrl,
                "error": f"metadata write: {errorText}",
            })

        if parsedJson is not None:
            try:
                jsonPath = dumpPath / f"{baseName}_body.json"

                with jsonPath.open("w", encoding="utf-8") as file:
                    json.dump(
                        redactedJson,
                        file,
                        ensure_ascii=False,
                        indent=2,
                    )

                collector["saved"].append(str(jsonPath))
                bodySaved = True
            except Exception as error:
                errorText = redact_text(str(error))
                log(
                    f"[NetworkCapture] Failed to write JSON "
                    f"body for {redactedUrl}: {errorText}"
                )
                collector["errors"].append({
                    "url": redactedUrl,
                    "error": f"json write: {errorText}",
                })

        if body is not None and not bodySaved and len(body) <= 256 * 1024:
            try:
                textPath = dumpPath / f"{baseName}_body.txt"

                with textPath.open(
                    "w",
                    encoding="utf-8",
                    errors="replace",
                ) as file:
                    file.write(
                        redact_text(
                            body.decode("utf-8", errors="replace")
                        )
                    )

                collector["saved"].append(str(textPath))
            except Exception as error:
                errorText = redact_text(str(error))
                log(
                    f"[NetworkCapture] Failed to write text "
                    f"body for {redactedUrl}: {errorText}"
                )

    except Exception as error:
        try:
            url = getattr(response, "url", "unknown")
        except Exception:
            url = "unknown"

        redactedUrl = redact_url(url)
        errorText = redact_text(str(error))

        log(
            f"[NetworkCapture] Unhandled error for "
            f"{redactedUrl}: {errorText}"
        )

        collector["errors"].append({
            "url": redactedUrl,
            "error": errorText,
        })

def install_network_capture(page, collector, dump_dir):
    if not collector.get("enabled"):
        return

    page.on(
        "response",
        lambda response: asyncio.create_task(
            handle_network_response(response, collector, dump_dir)
        ),
    )


def find_json_candidates(
    value,
    source_url,
    path="$",
    max_depth=8,
    found=None,
):
    if found is None:
        found = []

    if max_depth <= 0:
        return found

    if isinstance(value, dict):
        keys = list(value.keys())

        sampleKeys = [
            key
            for key in keys[:20]
            if any(
                interesting in key.lower()
                for interesting in INTERESTING_DATA_KEYS
            )
        ]

        if sampleKeys:
            found.append({
                "sourceUrl": source_url,
                "path": path,
                "length": len(keys),
                "sampleKeys": sampleKeys[:10],
                "reason": "object contains price/traded/time-like keys",
            })

        for key, child in value.items():
            if isinstance(child, (dict, list)):
                find_json_candidates(
                    child,
                    source_url,
                    f"{path}.{key}",
                    max_depth - 1,
                    found,
                )

    elif isinstance(value, list):
        if (
            len(value) > 0
            and any(isinstance(item, (dict, list)) for item in value[:10])
        ):
            sample = next(
                (
                    item
                    for item in value
                    if isinstance(item, dict)
                ),
                None,
            )

            if sample:
                sampleKeys = [
                    key
                    for key in list(sample.keys())[:20]
                    if any(
                        interesting in key.lower()
                        for interesting in INTERESTING_DATA_KEYS
                    )
                ]

                if sampleKeys:
                    found.append({
                        "sourceUrl": source_url,
                        "path": path,
                        "length": len(value),
                        "sampleKeys": sampleKeys[:10],
                        "reason": (
                            "array contains price/traded/time-like keys"
                        ),
                    })

            for index, item in enumerate(value[:100]):
                find_json_candidates(
                    item,
                    source_url,
                    f"{path}[{index}]",
                    max_depth - 1,
                    found,
                )

        elif len(value) > 0:
            found.append({
                "sourceUrl": source_url,
                "path": path,
                "length": len(value),
                "sampleKeys": [],
                "reason": "primitive array (possible data series)",
            })

    return found


def extract_network_candidates_from_collector(collector):
    candidates = []
    seen = set()

    for item in collector.get("json_payloads", []):
        url = item.get("url", "unknown")
        payload = item.get("payload")

        for candidate in find_json_candidates(payload, url):
            key = (
                candidate["sourceUrl"],
                candidate["path"],
                candidate["reason"],
            )

            if key in seen:
                continue

            seen.add(key)
            candidates.append(candidate)

    return candidates[:50]


def summarize_network_capture(collector):
    responses = collector.get("responses", [])
    saved = collector.get("saved", [])
    jsonPayloads = collector.get("json_payloads", [])
    errors = collector.get("errors", [])

    interestingUrls = []

    for response in responses:
        url = response.get("url")

        if url and url not in interestingUrls:
            interestingUrls.append(url)

            if len(interestingUrls) >= 25:
                break

    return {
        "enabled": collector.get("enabled", False),
        "response_count": len(responses),
        "saved_count": len(saved),
        "json_count": len(jsonPayloads),
        "errors_count": len(errors),
        "interesting_urls": interestingUrls,
        "dump_dir": str(collector.get("dump_dir", "")),
        "candidates": extract_network_candidates_from_collector(collector),
    }
