# AGENTS

Usa este modulo cuando la tarea sea sobre Airtable, scripts Python, SKUs, descripciones o GitHub Actions.

## Contexto Principal

Lee primero:

- `README.md`
- `docs/contracts.md`
- `docs/notes.md`
- `scripts/generate_descriptions.py`
- `scripts/generate_skus.py`
- `config.json`
- `.github/workflows/run_airtable_script.yml`

## Limites

- No abras `modules/n8n-automation/` salvo que la tarea hable de integracion explicita.
- No muevas scripts existentes solo por ordenar.
- Conserva compatibilidad con el workflow salvo pedido explicito.

## Forma De Trabajo

- Trata `scripts/` como runtime real.
- Usa este modulo como capa de contexto y documentacion.
- Si una integracion con n8n aparece, documenta primero entradas, salidas y sistema responsable.
