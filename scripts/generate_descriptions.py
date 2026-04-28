#!/usr/bin/env python3
"""Generate commercial product descriptions from Airtable records.

The script:
- reads products from an Airtable table
- generates a commercial description with the OpenAI API
- updates the Airtable field configured as `descripcion`
- avoids duplicate work by skipping repeated product identities

Environment variables:
  AIRTABLE_API_KEY      Airtable personal access token
  AIRTABLE_BASE_ID      Airtable base id, e.g. appXXXXXXXXXXXXXX
  AIRTABLE_TABLE_NAME   Airtable table name, e.g. Products
  AIRTABLE_DESC_FIELD   Description field name, default: descripcion
  AIRTABLE_NAME_FIELDS  Comma-separated fields used to identify the product
  AIRTABLE_SKIP_IF_DESC_EXISTS  true/false, default: true
  OPENAI_API_KEY        OpenAI API key
  OPENAI_MODEL          Model name, default: gpt-4.1-mini
  OPENAI_API_URL        default: https://api.openai.com/v1/chat/completions
  DRY_RUN               true/false, default: false
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Sequence, Tuple


def load_dotenv_file(paths: Sequence[str]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        with open(path, "r", encoding="utf-8") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def env_list(name: str, default: Sequence[str]) -> List[str]:
    value = os.getenv(name)
    if not value:
        return list(default)
    items = [part.strip() for part in value.split(",")]
    return [item for item in items if item]


def http_json(
    method: str,
    url: str,
    headers: Optional[Dict[str, str]] = None,
    body: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    payload = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=payload, method=method.upper())
    request.add_header("Accept", "application/json")
    request.add_header("Content-Type", "application/json")
    if headers:
        for key, value in headers.items():
            request.add_header(key, value)

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        message = raw.strip() or exc.reason
        raise RuntimeError(f"HTTP {exc.code} calling {url}: {message}") from exc


def airtable_records(base_id: str, table_name: str, api_key: str) -> List[Dict[str, Any]]:
    encoded_table = urllib.parse.quote(table_name, safe="")
    url = f"https://api.airtable.com/v0/{base_id}/{encoded_table}"
    records: List[Dict[str, Any]] = []
    offset: Optional[str] = None

    while True:
        params = {"pageSize": 100}
        if offset:
            params["offset"] = offset
        query = urllib.parse.urlencode(params)
        payload = http_json(
            "GET",
            f"{url}?{query}",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            return records


def airtable_batch_update(
    base_id: str,
    table_name: str,
    api_key: str,
    updates: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if not updates:
        return {"records": []}

    encoded_table = urllib.parse.quote(table_name, safe="")
    url = f"https://api.airtable.com/v0/{base_id}/{encoded_table}"
    return http_json(
        "PATCH",
        url,
        headers={"Authorization": f"Bearer {api_key}"},
        body={"records": updates},
    )


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip().lower()
    return " ".join(text.split())


def record_identity(record: Dict[str, Any], fields: Sequence[str]) -> Tuple[str, ...]:
    record_fields = record.get("fields", {})
    values = [normalize_text(record_fields.get(field)) for field in fields]
    values = [value for value in values if value]
    if not values:
        return (record.get("id", ""),)
    return tuple(values)


def record_summary(record: Dict[str, Any], description_field: str) -> Dict[str, Any]:
    record_fields = record.get("fields", {})
    summary: Dict[str, Any] = {
        "record_id": record.get("id"),
        "name": None,
        "sku": None,
        "category": None,
        "current_description": None,
        "attributes": {},
    }
    for key in ("name", "Name", "producto", "Producto", "title", "Title"):
        if record_fields.get(key):
            summary["name"] = record_fields.get(key)
            break
    for key in ("sku", "SKU", "reference", "Reference", "codigo", "Codigo"):
        if record_fields.get(key):
            summary["sku"] = record_fields.get(key)
            break
    for key in ("categoria", "category", "Category"):
        if record_fields.get(key):
            summary["category"] = record_fields.get(key)
            break

    summary["current_description"] = record_fields.get(description_field)

    for field, value in record_fields.items():
        if field == description_field:
            continue
        if normalize_text(value):
            summary["attributes"][field] = value
    return summary


def build_prompt(product: Dict[str, Any], existing_descriptions: Sequence[str]) -> str:
    attributes = product.get("attributes", {})
    compact = {key: value for key, value in attributes.items() if value not in (None, "", [])}

    prompt_lines = [
        "Escribe una descripcion comercial en espanol para un producto de ecommerce.",
        "Objetivo: vender sin sonar exagerado, con tono claro, natural y profesional.",
        "Requisitos:",
        "- Entre 35 y 70 palabras.",
        "- Debe ser especifica para el producto y usar sus atributos reales.",
        "- No repitas frases genericas.",
        "- No incluyas bullets, titulos, comillas ni etiquetas JSON.",
        "- Evita copiar descripciones ya existentes o sonar demasiado parecida a ellas.",
    ]

    if existing_descriptions:
        prompt_lines.append("Descripciones previas que ya fueron usadas y debes evitar repetir:")
        for item in existing_descriptions[-5:]:
            prompt_lines.append(f"- {item}")

    prompt_lines.append("Datos del producto:")
    for key, value in compact.items():
        prompt_lines.append(f"- {key}: {value}")

    return "\n".join(prompt_lines)


def openai_generate_description(
    api_key: str,
    model: str,
    api_url: str,
    product: Dict[str, Any],
    existing_descriptions: Sequence[str],
) -> str:
    prompt = build_prompt(product, existing_descriptions)
    body = {
        "model": model,
        "temperature": 0.8,
        "max_tokens": 180,
        "messages": [
            {
                "role": "system",
                "content": "Eres un copywriter de ecommerce. Respondes solo con el texto final de la descripcion.",
            },
            {"role": "user", "content": prompt},
        ],
    }
    payload = http_json(
        "POST",
        api_url,
        headers={"Authorization": f"Bearer {api_key}"},
        body=body,
    )

    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Respuesta inesperada de OpenAI: {payload}") from exc

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        text = "\n".join(parts).strip()
    else:
        text = str(content).strip()

    return " ".join(text.split())


def main() -> int:
    if env_bool("LOAD_DOTENV", False) and os.getenv("GITHUB_ACTIONS") != "true":
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        load_dotenv_file(
            [
                os.path.join(project_dir, ".env"),
                os.path.join(os.getcwd(), ".env"),
            ]
        )

    parser = argparse.ArgumentParser(description="Generate commercial Airtable descriptions.")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of records to process.")
    parser.add_argument("--dry-run", action="store_true", help="Generate descriptions without updating Airtable.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Regenerate descriptions even if the target field already has content.",
    )
    args = parser.parse_args()

    airtable_api_key = os.getenv("AIRTABLE_API_KEY", "").strip()
    airtable_base_id = os.getenv("AIRTABLE_BASE_ID", "").strip()
    airtable_table_name = os.getenv("AIRTABLE_TABLE_NAME", "").strip()
    openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()

    if not airtable_api_key:
        print("Falta AIRTABLE_API_KEY.", file=sys.stderr)
        return 1
    if not airtable_base_id:
        print("Falta AIRTABLE_BASE_ID.", file=sys.stderr)
        return 1
    if not airtable_table_name:
        print("Falta AIRTABLE_TABLE_NAME.", file=sys.stderr)
        return 1
    if not openai_api_key:
        print("Falta OPENAI_API_KEY.", file=sys.stderr)
        return 1

    description_field = (os.getenv("AIRTABLE_DESC_FIELD") or "Descripcion").strip()
    identity_fields = env_list("AIRTABLE_NAME_FIELDS", ("Producto", "SKU"))
    skip_if_description_exists = env_bool("AIRTABLE_SKIP_IF_DESC_EXISTS", True)
    dry_run = args.dry_run or env_bool("DRY_RUN", False)
    model = (os.getenv("OPENAI_MODEL") or "gpt-4.1-mini").strip()
    api_url = (os.getenv("OPENAI_API_URL") or "https://api.openai.com/v1/chat/completions").strip()

    records = airtable_records(airtable_base_id, airtable_table_name, airtable_api_key)
    if args.limit is not None:
        records = records[: max(args.limit, 0)]

    seen_identities = set()
    used_descriptions = set()
    pending_updates: List[Dict[str, Any]] = []
    generated_count = 0
    skipped_duplicates = 0
    skipped_existing = 0

    for record in records:
        fields = record.get("fields", {})
        identity = record_identity(record, identity_fields)
        if identity in seen_identities:
            skipped_duplicates += 1
            continue
        seen_identities.add(identity)

        current_description = fields.get(description_field)
        if skip_if_description_exists and not args.overwrite and str(current_description or "").strip():
            skipped_existing += 1
            continue

        summary = record_summary(record, description_field)
        attempts = 0
        description = ""
        while attempts < 3:
            attempts += 1
            description = openai_generate_description(
                openai_api_key,
                model,
                api_url,
                summary,
                sorted(used_descriptions),
            )
            normalized = normalize_text(description)
            if normalized and normalized not in used_descriptions:
                used_descriptions.add(normalized)
                break
            description = ""
        if not description:
            print(
                f"No pude generar una descripcion unica para {record.get('id')} ({summary.get('name') or 'sin nombre'}).",
                file=sys.stderr,
            )
            continue

        generated_count += 1
        print(f"[OK] {record.get('id')} -> {description}")
        if not dry_run:
            pending_updates.append({"id": record["id"], "fields": {description_field: description}})

        if len(pending_updates) == 10:
            airtable_batch_update(airtable_base_id, airtable_table_name, airtable_api_key, pending_updates)
            pending_updates = []
            time.sleep(0.25)

    if not dry_run and pending_updates:
        airtable_batch_update(airtable_base_id, airtable_table_name, airtable_api_key, pending_updates)

    print(
        json.dumps(
            {
                "processed": len(records),
                "generated": generated_count,
                "duplicates_skipped": skipped_duplicates,
                "existing_skipped": skipped_existing,
                "dry_run": dry_run,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
