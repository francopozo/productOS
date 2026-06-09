# productOS

`productOS` centraliza automatizaciones y utilidades para operar el catalogo desde Airtable, n8n y scripts locales.

El repositorio separa dos contextos de trabajo:

- `modules/airtable-actions/`: scripts, configuracion y ejecucion remota sobre Airtable.
- `modules/n8n-automation/`: workflows SDK, documentacion operativa y material de diseno para n8n.

## Alcance

- generar descripciones comerciales
- generar SKUs consistentes
- sincronizar productos hacia otros sistemas
- dejar contratos claros para que otro coding agent pueda continuar sin reconstruir reglas desde cero

## Automatizaciones actuales

### Airtable-Woo

- origen: Airtable `CatalogOS > Productos`
- destino: WooCommerce
- estado documentado: Fase 1 versionada en SDK local
- documento operativo: `modules/n8n-automation/docs/airtable-woocommerce-minimo.md`
- SDK local: `modules/n8n-automation/workflows/airtable-woo-sdk.js`

### Airtable-Generate-Descriptions

- origen: Airtable `CatalogOS > Productos`
- destino: campo `Descripcion` en Airtable
- estado documentado: workflow operativo con SDK local
- documento operativo: `modules/n8n-automation/docs/airtable-generate-descriptions.md`
- SDK local: `modules/n8n-automation/workflows/airtable-generate-descriptions-sdk.js`

### Airtable-Generate-SKUs

- origen: Airtable `CatalogOS > Productos`
- destino: campo `SKU` en Airtable
- estado documentado: workflow operativo con SDK local
- documento operativo: `modules/n8n-automation/docs/airtable-generate-skus.md`
- SDK local: `modules/n8n-automation/workflows/airtable-generate-skus-sdk.js`

## Scripts locales

- `scripts/generate_descriptions.py`: genera descripciones comerciales con OpenAI y escribe el resultado en Airtable.
- `scripts/generate_skus.py`: version local de referencia para reglas de SKU; la operacion principal ya tiene workflow equivalente en n8n.

## Estructura

- `modules/airtable-actions/` concentra scripts Python, contratos y ejecucion por GitHub Actions.
- `modules/n8n-automation/` concentra workflows, prompts y documentacion viva de automatizaciones.
- `scripts/`, `config.json` y `.github/workflows/run_airtable_script.yml` mantienen el flujo local/remoto basado en Python.

## Requisitos

- Python 3.10+
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY` para descripciones

## Variables utiles

- `AIRTABLE_API_KEY`: token de Airtable
- `AIRTABLE_BASE_ID`: base de Airtable
- `OPENAI_API_KEY`: clave de OpenAI
- `TASK`: tarea a ejecutar
- `CONFIG_FILE`: ruta alternativa de configuracion
- `DRY_RUN`: simula la ejecucion sin guardar cambios
- `LIMIT`: limita registros procesados
- `LOAD_DOTENV`: controla la carga automatica de `.env`

## Ejecucion local

```powershell
py -3 .\scripts\generate_descriptions.py --dry-run
py -3 .\scripts\generate_descriptions.py --limit 10
py -3 .\scripts\generate_skus.py
```

## Navegacion rapida

- `docs/mapa-repo.md`: mapa del repositorio
- `docs/arquitectura.md`: arquitectura general
- `docs/contratos-scripts.md`: contratos de scripts
- `modules/n8n-automation/docs/automations.md`: indice de automatizaciones
