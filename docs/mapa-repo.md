# Mapa Del Repositorio

`productOS` se organiza en dos zonas de trabajo para separar contextos sin perder integracion.

## Airtable Actions

Usa `modules/airtable-actions/` cuando la tarea toque:

- scripts Python
- `config.json`
- GitHub Actions
- logica de SKUs
- generacion de descripciones

Archivos principales de esta area:

- `scripts/generate_descriptions.py`
- `scripts/generate_skus.py`
- `scripts/sku_dictionary.json`
- `config.json`
- `.github/workflows/run_airtable_script.yml`

## n8n Automation

Usa `modules/n8n-automation/` cuando la tarea toque:

- ideas de automatizaciones
- prompts para Codex u OpenCode
- estructuras de workflows n8n
- patrones de integracion
- documentacion y checklists

Esta area se enfoca en diseno, definicion y apoyo documental para automatizaciones.

## Regla De Aislamiento

- Un modulo por tarea.
- Si una tarea pertenece a Airtable, trabaja dentro del contexto de `airtable-actions`.
- Si una tarea pertenece a n8n, trabaja dentro del contexto de `n8n-automation`.
- Si una tarea conecta ambas areas, documenta primero el contrato entre entrada, salida y sistema responsable.
