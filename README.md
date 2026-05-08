# productOS

`productOS` es un conjunto de herramientas para automatizar tareas de catalogo y preparar automatizaciones asistidas por AI.

El proyecto organiza dos areas de trabajo dentro del mismo repositorio:

- `modules/airtable-actions/`: scripts y documentacion para procesos sobre Airtable y ejecucion con GitHub Actions.
- `modules/n8n-automation/`: documentacion, prompts y diseno de automatizaciones para n8n.

La idea es mantener separados los contextos de trabajo sin dividir el proyecto en varios repositorios.

## Que hace

- Genera descripciones comerciales para productos.
- Construye SKUs de forma consistente.
- Ejecuta procesos manuales o remotos sobre Airtable.
- Sirve como base de trabajo para disenar automatizaciones n8n con apoyo de agentes AI.

## Avance Actual

Ya existe una automatizacion n8n publicada llamada `Airtable-Woo`.

- origen: Airtable `CatalogOS > Productos`
- destino: WooCommerce
- comportamiento actual: crea productos simples en estado `draft` cuando aparece un nuevo registro
- documentacion operativa: `modules/n8n-automation/docs/airtable-woocommerce-minimo.md`
- base SDK local: `modules/n8n-automation/workflows/airtable-woo-sdk.js`

## Herramientas incluidas

- `scripts/generate_descriptions.py`: lee productos desde Airtable, genera una descripcion comercial con OpenAI y la guarda en el campo configurado.
- `scripts/generate_skus.py`: toma los campos del producto, aplica reglas de normalizacion y crea un SKU consistente para cada registro.

## Como se organiza

El repo se divide en dos modulos:

- `modules/airtable-actions/` concentra el contexto de Airtable, scripts Python, configuracion y GitHub Actions.
- `modules/n8n-automation/` concentra el contexto de prompts, patrones, ideas y estructura de automatizaciones n8n.

Los archivos operativos del flujo Airtable permanecen en:

- `scripts/`
- `config.json`
- `.github/workflows/run_airtable_script.yml`

## Requisitos

- Python 3.10+
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY` para la tarea de descripciones

## Configuracion y variables

Puedes definirlas en `.env` o en tu sesion de terminal:

- `AIRTABLE_API_KEY`: token de Airtable
- `AIRTABLE_BASE_ID`: base de Airtable
- `OPENAI_API_KEY`: clave de OpenAI
- `TASK`: tarea a ejecutar
- `CONFIG_FILE`: ruta alternativa de configuracion
- `DRY_RUN`: simula la ejecucion sin guardar cambios
- `LIMIT`: limita la cantidad de registros a procesar
- `LOAD_DOTENV`: controla si se carga `.env` automaticamente

## Ejecucion local

```powershell
py -3 .\scripts\generate_descriptions.py --dry-run
py -3 .\scripts\generate_descriptions.py --limit 10
py -3 .\scripts\generate_skus.py
```

## Flujo general

- `generate_descriptions.py` revisa productos, evita duplicados y puede omitir registros que ya tienen descripcion.
- `generate_skus.py` completa el SKU cuando el campo esta vacio y aplica reglas consistentes de formato.
- Ambos scripts usan `config.json` para resolver tareas y mantener un comportamiento explicito.

## GitHub Actions

El proyecto tambien puede ejecutarse desde GitHub Actions.

Workflow disponible:

- `.github/workflows/run_airtable_script.yml`

Inputs principales:

- `script`
- `task`
- `dry_run`
- `limit`
- `extra_args`

## Navegacion rapida

- `docs/mapa-repo.md`: mapa del repositorio
- `docs/arquitectura.md`: arquitectura del proyecto
- `docs/contratos-scripts.md`: contratos de scripts
