# n8n Automation

Este modulo concentra workflows, documentacion operativa y material de diseno para automatizaciones n8n.

## Alcance

- workflows SDK
- briefs de automatizaciones
- prompts para Codex y OpenCode
- patrones de nodos y flujos
- checklists
- drafts y material de trabajo

## Enfoque

Este modulo sirve para pensar, definir, exportar y documentar automatizaciones sin mezclar ese contexto con los scripts de Airtable.

## Operacion Esperada

- los cambios sobre workflows deben trabajarse usando el MCP de n8n siempre que sea posible
- la validacion de Airtable debe apoyarse en el plugin conector de Airtable cuando haga falta revisar campos, registros o contratos reales
- los pedidos manuales al usuario deben limitarse a casos donde el agent no tenga herramientas o permisos suficientes para ejecutar el cambio
- si se modifica un workflow, el cierre esperado incluye validar y publicar la nueva version
- si un workflow no tiene SDK local, crear ese archivo tambien es parte del cierre esperado

## Estado Actual

- `Airtable-Woo` tiene SDK local y documento operativo
- `Airtable-Generate-Descriptions` tiene SDK local y documento operativo
- `Airtable-Generate-SKUs` tiene SDK local y documento operativo
- los flujos de descripciones y SKUs ya trabajan con writeback por registro
- la documentacion viva principal esta en `docs/`

## Documentos Del Modulo

- `AGENTS.md`
- `docs/automations.md`
- `docs/airtable-woocommerce-minimo.md`
- `docs/airtable-generate-descriptions.md`
- `docs/airtable-generate-skus.md`
- `docs/patterns.md`
- `docs/prompts.md`

## Carpetas

- `workflows/`: espacio para exports o estructuras de flujos
- `scratch/`: espacio para borradores rapidos
