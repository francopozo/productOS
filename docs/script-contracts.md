# Scripts Contracts

Defines how each script behaves. This is the source of truth for Codex.

---

## generate_descriptions.py

Task: descriptions

Input:
- Airtable table (config.table_name)
- Source fields (config.name_fields)

Output:
- Writes generated text to (config.field_name)

Behavior:
- Generate description using OpenAI
- Skip rows with existing value unless --overwrite is set
- Avoid duplicate identities

CLI:
- --task
- --limit
- --dry-run
- --overwrite

---

## generate_skus.py

Task: skus

Input:
- categoria_field
- grupo_field
- producto_field
- var_field
- dictionary_file (mapping JSON)

Output:
- Writes SKU to sku_field

Behavior:
- Generate SKU only if empty
- Compose SKU from mappings + numeric suffix
- Use dictionary_file for mappings

CLI:
- --task
- --config-file
- --config
- --dry-run
- --table

---

## Config Contract (config.json)

Each task must define required keys.

### descriptions

- table_name
- field_name
- name_fields

### skus

- table_name
- categoria_field
- grupo_field
- producto_field
- sku_field
- var_field
- dictionary_file
- id_padding

---

## Environment Variables

Required:

- AIRTABLE_API_KEY
- AIRTABLE_BASE_ID
- OPENAI_API_KEY

Optional runtime:

- TASK
- SKU_TASK
- CONFIG_FILE
- DRY_RUN
- LIMIT
- LOAD_DOTENV

---

## Workflow Contract (GitHub Actions)

File:
.github/workflows/run_airtable_script.yml

Inputs:

- script → script filename
- task → task key from config
- dry_run → boolean
- limit → number
- extra_args → string

---

## Script Requirements

All scripts must:

1. Parse CLI arguments
2. Load config.json
3. Resolve task
4. Validate required env vars
5. Execute logic
6. Output concise result

---

## Constraints

- Do not duplicate logic between scripts
- Move shared logic to common modules if needed
- Keep mappings external (JSON files)
- Avoid implicit behavior (everything must be explicit in config or CLI)