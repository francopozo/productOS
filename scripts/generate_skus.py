#!/usr/bin/env python3
"""Generate hybrid SKU values for Airtable product records.

Rules implemented:
- Format: TIPO + SUB + VAR + ID
- Uppercase, no spaces, no hyphens
- SUB optional
- VAR optional
- ID numeric with 3-digit padding
- SKU generated only when SKU field is empty

Default field names expected in records["fields"]:
- Categoria
- Grupo
- Producto
- SKU
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set


DEFAULT_TYPE_MAP: Dict[str, str] = {
    "TARJETAS": "TARJ",
    "TARJETA": "TARJ",
    "FLYERS": "FLY",
    "FLYER": "FLY",
    "LOGOS": "LOGO",
    "LOGO": "LOGO",
    "MERCHADISING": "MER",
    "MERCHANDISING": "MER",
}

DEFAULT_SUB_MAP: Dict[str, str] = {
    "PREMIUM": "PRE",
    "METALIZADA": "M",
    "DOBLE CARA": "DC",
}

DEFAULT_VAR_MAP: Dict[str, str] = {
    "MATE": "M",
    "BRILLANTE": "B",
}


@dataclass(frozen=True)
class SKUConfig:
    type_map: Dict[str, str]
    sub_map: Dict[str, str]
    var_map: Dict[str, str]
    categoria_field: str = "Categoria-Look"
    grupo_field: str = "Grupo-Look"
    producto_field: str = "Producto"
    sku_field: str = "SKU"
    id_padding: int = 3
    var_field: str = ""


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


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip().upper()
    text = " ".join(text.split())
    return text


def normalize_key(value: Any) -> str:
    text = clean_text(value)
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^A-Z0-9 ]", " ", text)
    return " ".join(text.split())


def compact_code(value: Any) -> str:
    text = clean_text(value)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("-", " ")
    text = "".join(text.split())
    return re.sub(r"[^A-Z0-9]", "", text)


def has_value(value: Any) -> bool:
    return bool(str(value or "").strip())


def linked_value_to_text(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, list):
        parts = [linked_value_to_text(item) for item in value]
        parts = [part for part in parts if part]
        return ",".join(parts)

    if isinstance(value, dict):
        # Airtable can expose linked items as objects in some contexts.
        for key in ("name", "Nombre", "primaryFieldValue"):
            if has_value(value.get(key)):
                return clean_text(value.get(key))
        # Ignore raw linked IDs (e.g. recXXXXXXXX) for lookup logic.
        if has_value(value.get("id")):
            rec_id = clean_text(value.get("id"))
            if not rec_id.startswith("REC"):
                return rec_id
        return ""

    return clean_text(value)


def first_linked_name(value: Any) -> str:
    text = linked_value_to_text(value)
    if not text:
        return ""
    parts = [part.strip() for part in text.split(",") if part.strip()]
    return clean_text(parts[0]) if parts else ""


def extract_lookup_values(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        result: List[str] = []
        for item in value:
            text = linked_value_to_text(item)
            if text:
                result.append(clean_text(text))
        return result
    text = linked_value_to_text(value)
    return [clean_text(text)] if text else []


def resolve_field_value(fields: Dict[str, Any], field_name: str) -> Any:
    if field_name in fields:
        return fields.get(field_name)

    target = normalize_key(field_name).replace(" ", "")
    for key, value in fields.items():
        normalized = normalize_key(key).replace(" ", "")
        if normalized == target:
            return value
    return None


def map_token(value: Any, mapping: Dict[str, str], *, optional: bool) -> Optional[str]:
    normalized = normalize_key(value)
    if not normalized:
        return "" if optional else None

    if normalized in mapping:
        return compact_code(mapping[normalized])

    # Fallback for noisy lookup text: try partial match by longest key first.
    for key in sorted(mapping.keys(), key=len, reverse=True):
        if not key:
            continue
        if normalized.startswith(key) or key in normalized:
            return compact_code(mapping[key])

    # Fallback: allow raw token when optional, but strict on TIPO.
    if optional:
        return compact_code(normalized)
    return None


def parse_numeric_suffix(sku: str, prefix: str) -> Optional[int]:
    if not sku.startswith(prefix):
        return None
    suffix = sku[len(prefix) :]
    if suffix.isdigit():
        return int(suffix)
    return None


def next_id_for_prefix(prefix: str, used_skus: Iterable[str], padding: int) -> str:
    highest = 0
    for sku in used_skus:
        number = parse_numeric_suffix(compact_code(sku), prefix)
        if number is not None and number > highest:
            highest = number
    return str(highest + 1).zfill(padding)


def build_prefix(
    record_fields: Dict[str, Any],
    config: SKUConfig,
) -> str:
    categoria_raw = resolve_field_value(record_fields, config.categoria_field)
    grupo_raw = resolve_field_value(record_fields, config.grupo_field)

    categoria_candidates = extract_lookup_values(categoria_raw)
    categoria_value = categoria_candidates[0] if categoria_candidates else ""

    tipo = None
    for candidate in categoria_candidates:
        tipo = map_token(candidate, config.type_map, optional=False)
        if tipo:
            categoria_value = candidate
            break

    if not tipo:
        raise ValueError(
            f"TIPO inválido/no mapeado en '{config.categoria_field}'. "
            f"Valor raw={categoria_raw!r}, candidatos={categoria_candidates!r}"
        )

    grupo_candidates = extract_lookup_values(grupo_raw)
    grupo_value = grupo_candidates[0] if grupo_candidates else ""
    sub = map_token(grupo_value, config.sub_map, optional=True) or ""

    var_source = resolve_field_value(record_fields, config.var_field) if config.var_field else ""
    var = map_token(var_source, config.var_map, optional=True) or ""

    return f"{tipo}{sub}{var}"


def build_sku(prefix: str, next_id: str) -> str:
    return compact_code(f"{prefix}{next_id}")


def validate_sku_unique(candidate: str, used_skus: Set[str]) -> None:
    if candidate in used_skus:
        raise ValueError(f"SKU duplicado detectado: {candidate}")


def generate_sku(
    record: Dict[str, Any],
    *,
    used_skus: Optional[Set[str]] = None,
    config: Optional[SKUConfig] = None,
) -> Optional[str]:
    """Generate a SKU for one record.

    Returns None when SKU already exists (does not overwrite).
    """
    local_config = config or SKUConfig(
        type_map=DEFAULT_TYPE_MAP,
        sub_map=DEFAULT_SUB_MAP,
        var_map=DEFAULT_VAR_MAP,
    )
    local_used = used_skus if used_skus is not None else set()

    fields = record.get("fields", {}) if isinstance(record, dict) else {}
    current_sku = fields.get(local_config.sku_field)
    if has_value(current_sku):
        return None

    prefix = build_prefix(fields, local_config)
    next_id = next_id_for_prefix(prefix, local_used, local_config.id_padding)
    candidate = build_sku(prefix, next_id)
    validate_sku_unique(candidate, local_used)

    local_used.add(candidate)
    return candidate


def generate_missing_skus(
    records: Sequence[Dict[str, Any]],
    *,
    config: Optional[SKUConfig] = None,
) -> List[Dict[str, Any]]:
    """Generate update payloads for records with empty SKU."""
    local_config = config or SKUConfig(
        type_map=DEFAULT_TYPE_MAP,
        sub_map=DEFAULT_SUB_MAP,
        var_map=DEFAULT_VAR_MAP,
    )

    used_skus: Set[str] = set()
    for record in records:
        fields = record.get("fields", {})
        existing = compact_code(fields.get(local_config.sku_field))
        if existing:
            used_skus.add(existing)

    updates: List[Dict[str, Any]] = []
    for record in records:
        try:
            sku = generate_sku(
                record,
                used_skus=used_skus,
                config=local_config,
            )
        except ValueError as exc:
            record_id = record.get("id")
            print(f"[SKIP] {record_id}: {exc}", file=sys.stderr)
            continue
        if not sku:
            continue
        updates.append(
            {
                "id": record.get("id"),
                "fields": {local_config.sku_field: sku},
            }
        )
    return updates


def _airtable_get_records(api_key: str, base_id: str, table_name: str) -> List[Dict[str, Any]]:
    encoded_table = urllib.parse.quote(table_name, safe="")
    base_url = f"https://api.airtable.com/v0/{base_id}/{encoded_table}"
    records: List[Dict[str, Any]] = []
    offset: Optional[str] = None

    while True:
        params = {"pageSize": 100, "cellFormat": "json"}
        if offset:
            params["offset"] = offset
        query = urllib.parse.urlencode(params)
        url = f"{base_url}?{query}"

        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {api_key}")
        req.add_header("Accept", "application/json")

        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Error Airtable GET {table_name} ({exc.code}): {raw.strip() or exc.reason}"
            ) from exc

        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            return records


def _airtable_patch_records(api_key: str, base_id: str, table_name: str, updates: Sequence[Dict[str, Any]]) -> None:
    if not updates:
        return

    encoded_table = urllib.parse.quote(table_name, safe="")
    url = f"https://api.airtable.com/v0/{base_id}/{encoded_table}"

    batch_size = 10
    for i in range(0, len(updates), batch_size):
        chunk = updates[i : i + batch_size]
        body = json.dumps({"records": chunk}).encode("utf-8")
        req = urllib.request.Request(url, data=body, method="PATCH")
        req.add_header("Authorization", f"Bearer {api_key}")
        req.add_header("Accept", "application/json")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=60):
                pass
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Error Airtable PATCH {table_name} ({exc.code}): {raw.strip() or exc.reason}"
            ) from exc


def _load_json(path: str) -> Dict[str, Any]:
    if not os.path.isfile(path):
        return {}
    # utf-8-sig handles files saved with UTF-8 BOM (common in Windows editors)
    with open(path, "r", encoding="utf-8-sig") as handle:
        data = json.load(handle)
    return data if isinstance(data, dict) else {}


def _load_task_config(config_path: str, task_name: str) -> Dict[str, Any]:
    data = _load_json(config_path)
    tasks = data.get("tasks", {})
    if not isinstance(tasks, dict):
        return {}
    task = tasks.get(task_name, {})
    return task if isinstance(task, dict) else {}


def main() -> int:
    auto_load_dotenv = os.getenv("GITHUB_ACTIONS") != "true" and os.getenv("CI") != "true"
    if env_bool("LOAD_DOTENV", auto_load_dotenv):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(script_dir)
        load_dotenv_file(
            [
                os.path.join(project_dir, ".env"),
                os.path.join(os.getcwd(), ".env"),
            ]
        )

    parser = argparse.ArgumentParser(description="Generate missing SKU values in Airtable.")
    parser.add_argument("--table", type=str, default="", help="Airtable table name")
    parser.add_argument("--dry-run", action="store_true", help="Preview without updating Airtable")
    parser.add_argument("--task", type=str, default="", help="Task key from config file (default: skus)")
    parser.add_argument("--config-file", type=str, default="", help="Config file path (default: config.json)")
    parser.add_argument("--config", type=str, default="", help="Optional JSON config with only maps (legacy)")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    config_file = (args.config_file.strip() or os.getenv("CONFIG_FILE", "").strip() or os.path.join(project_dir, "config.json"))
    # Do not depend on generic TASK env var (used by other scripts).
    # For this script we default to "skus" unless --task or SKU_TASK is provided.
    task_name = (args.task.strip() or os.getenv("SKU_TASK", "").strip() or "skus")
    task_config = _load_task_config(config_file, task_name)

    api_key = os.getenv("AIRTABLE_API_KEY", "").strip()
    base_id = os.getenv("AIRTABLE_BASE_ID", "").strip()
    table = (
        args.table.strip()
        or str(task_config.get("table_name") or "").strip()
        or os.getenv("AIRTABLE_TABLE_NAME", "").strip()
    )

    if not api_key or not base_id or not table:
        print("Faltan AIRTABLE_API_KEY, AIRTABLE_BASE_ID o --table/AIRTABLE_TABLE_NAME.", file=sys.stderr)
        return 1

    cfg_data = _load_json(args.config) if args.config else task_config
    dictionary_file = str(cfg_data.get("dictionary_file") or "").strip()
    dict_data: Dict[str, Any] = {}
    if dictionary_file:
        dictionary_path = (
            dictionary_file
            if os.path.isabs(dictionary_file)
            else os.path.join(project_dir, dictionary_file)
        )
        dict_data = _load_json(dictionary_path)

    mapping_source = dict_data if dict_data else cfg_data
    type_map = {normalize_key(k): compact_code(v) for k, v in mapping_source.get("type_map", DEFAULT_TYPE_MAP).items()}
    sub_map = {normalize_key(k): compact_code(v) for k, v in mapping_source.get("sub_map", DEFAULT_SUB_MAP).items()}
    var_map = {normalize_key(k): compact_code(v) for k, v in mapping_source.get("var_map", {}).items()}
    categoria_field = str(cfg_data.get("categoria_field") or "Categoria-Look")
    grupo_field = str(cfg_data.get("grupo_field") or "Grupo-Look")
    producto_field = str(cfg_data.get("producto_field") or "Producto")
    sku_field = str(cfg_data.get("sku_field") or "SKU")
    id_padding = int(cfg_data.get("id_padding") or 3)
    var_field = str(cfg_data.get("var_field") or "")

    config = SKUConfig(
        type_map=type_map,
        sub_map=sub_map,
        var_map=var_map,
        categoria_field=categoria_field,
        grupo_field=grupo_field,
        producto_field=producto_field,
        sku_field=sku_field,
        id_padding=id_padding,
        var_field=var_field,
    )

    records = _airtable_get_records(api_key, base_id, table)
    updates = generate_missing_skus(records, config=config)

    if args.dry_run:
        print(
            json.dumps(
                {
                    "task": task_name,
                    "table": table,
                    "categoria_field": config.categoria_field,
                    "grupo_field": config.grupo_field,
                    "dictionary_file": dictionary_file or None,
                    "type_map_size": len(type_map),
                    "records": len(records),
                    "updates": len(updates),
                    "dry_run": True,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        for item in updates[:20]:
            print(f"{item['id']}: {item['fields'][config.sku_field]}")
        return 0

    _airtable_patch_records(api_key, base_id, table, updates)
    print(json.dumps({"records": len(records), "updates": len(updates), "dry_run": False}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

