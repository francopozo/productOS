# productOS

Script para leer productos desde Airtable, generar descripciones comerciales con OpenAI y guardarlas en Airtable.

## Requisitos

- Python 3.10+
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY`

## Configuración principal (`config.json`)

La configuración se define por tareas:

```json
{
  "tasks": {
    "descriptions": {
      "table_name": "Productos",
      "field_name": "Descripcion",
      "name_fields": ["Producto", "SKU"]
    }
  }
}
```

La variable `TASK` selecciona la tarea a ejecutar (por defecto: `descriptions`).

## Variables de entorno

Puedes definirlas en `.env` o en tu sesión de PowerShell:

- `AIRTABLE_API_KEY`: token de Airtable
- `AIRTABLE_BASE_ID`: base de Airtable
- `OPENAI_API_KEY`: clave de OpenAI
- `TASK`: nombre de la tarea en `config.json` (default: `descriptions`)
- `CONFIG_FILE`: ruta alternativa de config (opcional)
- `AIRTABLE_SKIP_IF_DESC_EXISTS`: `true` o `false` (default: `true`)
- `OPENAI_MODEL`: modelo (default: `gpt-4.1-mini`)
- `OPENAI_API_URL`: endpoint (default: `https://api.openai.com/v1/chat/completions`)
- `DRY_RUN`: `true` para simular sin escribir en Airtable
- `LIMIT`: límite de registros a procesar (opcional)
- `LOAD_DOTENV`: `true` para cargar `.env` localmente

## Compatibilidad (legacy)

El script mantiene fallback para variables antiguas (`TABLE_NAME`, `FIELD_NAME`, `NAME_FIELDS`, `AIRTABLE_*`) para no romper ejecución actual, pero la ruta recomendada es `config.json` + `TASK`.

## Uso local

```powershell
py -3 .\scripts\generate_descriptions.py --dry-run
py -3 .\scripts\generate_descriptions.py
py -3 .\scripts\generate_descriptions.py --task descriptions
py -3 .\scripts\generate_descriptions.py --limit 10
py -3 .\scripts\generate_descriptions.py --overwrite
```

## GitHub Actions

Workflow: `.github/workflows/generate_descriptions.yml`

- Secrets requeridos:
  - `OPENAI_API_KEY`
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
- Inputs de `workflow_dispatch`:
  - `task` (default: `descriptions`)
  - `limit`
  - `dry_run`

## Dedupe y comportamiento

- No procesa dos veces el mismo producto si comparte los campos definidos en `name_fields` de la tarea.
- Evita regenerar si el campo objetivo ya tiene contenido, salvo que uses `--overwrite`.
- Intenta que la descripción generada no sea idéntica a otra ya producida en la misma corrida.
