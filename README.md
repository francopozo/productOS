# productOS

Script para leer productos desde Airtable, generar descripciones comerciales con OpenAI y guardarlas en el campo `descripcion`.

## Requisitos

- Python 3.10+
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME`
- `OPENAI_API_KEY`

## Variables de entorno

Puedes definirlas en `.env` o en tu sesión de PowerShell:

- `AIRTABLE_API_KEY`: token de Airtable
- `AIRTABLE_BASE_ID`: base donde está tu tabla
- `AIRTABLE_TABLE_NAME`: nombre exacto de la tabla
- `AIRTABLE_DESC_FIELD`: campo destino, por defecto `descripcion`
- `AIRTABLE_NAME_FIELDS`: campos usados para identificar duplicados, separados por coma
- `AIRTABLE_SKIP_IF_DESC_EXISTS`: `true` o `false`, por defecto `true`
- `OPENAI_API_KEY`: clave de OpenAI
- `OPENAI_MODEL`: modelo a usar, por defecto `gpt-4.1-mini`
- `OPENAI_API_URL`: endpoint de OpenAI, por defecto `https://api.openai.com/v1/chat/completions`
- `DRY_RUN`: `true` para simular sin escribir en Airtable

El script puede cargar `.env` desde la raíz del proyecto o desde el directorio actual si defines `LOAD_DOTENV=true`.
Para GitHub Actions, usa secretos del repositorio y deja `LOAD_DOTENV=false`.

## Uso

```powershell
python .\scripts\generate_descriptions.py --dry-run
python .\scripts\generate_descriptions.py
python .\scripts\generate_descriptions.py --overwrite
```

## Qué hace la deduplicación

- No procesa dos veces el mismo producto si comparte los campos definidos en `AIRTABLE_NAME_FIELDS`
- Evita volver a generar si el campo `descripcion` ya tiene contenido, salvo que uses `--overwrite`
- Intenta que la descripción generada no sea idéntica a otra ya producida en la misma corrida
