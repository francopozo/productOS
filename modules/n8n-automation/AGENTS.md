# AGENTS

Usa este modulo cuando la tarea sea sobre n8n, prompts, diseno de automatizaciones o documentacion de flujos.

## Herramientas Disponibles

Para este modulo asume, salvo que se indique lo contrario, que el agent puede trabajar con:

- MCP de n8n para leer, validar, actualizar y publicar workflows
- plugin conector de Airtable para revisar estructura, campos y registros cuando haga falta validar comportamiento

Usa esas herramientas antes de pedir trabajo manual al usuario.

## Contexto Principal

Lee primero:

- `README.md`
- `docs/automations.md`
- `docs/patterns.md`
- `docs/prompts.md`

## Limites

- No abras `scripts/`, `config.json` ni `.github/workflows/` salvo que la tarea mencione integracion con Airtable.
- No conviertas este modulo en runtime si no hace falta.
- Mantiene este espacio liviano y orientado a documentacion util.

## Forma De Trabajo

- Un flujo o idea por documento cuando ayude a mantener claridad.
- Documenta entradas, salidas y objetivo de cada automatizacion.
- Si aparece integracion con otra area, describe primero el contrato antes de tocar archivos operativos.
- Pide ajustes manuales solo cuando el agent no tenga herramientas o permisos reales para ejecutar el cambio.
- Si un cambio modifica un workflow de n8n, considera incompleto el trabajo hasta validar y publicar el flujo actualizado.
- Si un workflow no tiene SDK local en `workflows/`, crear o actualizar ese SDK forma parte del trabajo.
