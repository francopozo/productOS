# Workflow Del Modulo

Referencia rapida del workflow:

- `.github/workflows/run_airtable_script.yml`

## Tipo

- `workflow_dispatch`

## Inputs

- `script`
- `task`
- `limit`
- `dry_run`
- `extra_args`

## Comportamiento

- valida que el script exista dentro de `scripts/`
- ejecuta Python 3.11
- inyecta secrets de Airtable y OpenAI
- agrega `--task`, `--dry-run` y `--limit` segun el input

## Regla

Este workflow es el punto de ejecucion remota de esta area.
