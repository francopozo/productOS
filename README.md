# productOS

`productOS` es un conjunto de herramientas para automatizar tareas de catalogo en Airtable.

El proyecto centraliza procesos repetitivos para mantener consistencia en los productos, reducir trabajo manual y dejar listo el catalogo con una misma logica de operacion.

## Que hace

- Genera descripciones comerciales para productos.
- Construye SKUs de forma ordenada y repetible.
- Trabaja sobre registros ya existentes en Airtable.
- Permite agregar nuevas tareas sin cambiar la estructura general del proyecto.

## Herramientas incluidas

- `generate_descriptions.py`: lee productos desde una tabla de Airtable, genera una descripcion comercial con OpenAI y la guarda en el campo configurado.
- `generate_skus.py`: toma los campos del producto, aplica reglas de normalizacion y crea un SKU consistente para cada registro.

## Como se organiza

El proyecto usa `config.json` para definir las tareas disponibles. Cada tarea puede apuntar a una tabla distinta y a los campos que necesita.

En la practica, `TASK` define que flujo se ejecuta:

- `descriptions` para generar o actualizar descripciones.
- `skus` para crear codigos SKU.

## Requisitos

- Python 3.10+
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY` para la tarea de descripciones

## Configuracion y variables

Puedes definirlas en `.env` o en tu sesion de PowerShell:

- `AIRTABLE_API_KEY`: token de Airtable
- `AIRTABLE_BASE_ID`: base de Airtable
- `OPENAI_API_KEY`: clave de OpenAI
- `TASK`: tarea a ejecutar
- `CONFIG_FILE`: ruta alternativa de configuracion
- `DRY_RUN`: simula la ejecucion sin guardar cambios
- `LIMIT`: limita la cantidad de registros a procesar
- `LOAD_DOTENV`: opcional; por defecto local carga `.env` automaticamente y en CI/GitHub Actions no lo carga. Puedes forzarlo con `true/false`.

## Ejecucion local

```powershell
py -3 .\scripts\generate_descriptions.py --dry-run
py -3 .\scripts\generate_descriptions.py --limit 10
py -3 .\scripts\generate_skus.py
```

## Flujo general

- `generate_descriptions.py` revisa cada producto, evita duplicados y puede omitir registros que ya tienen descripcion, salvo que se indique lo contrario.
- `generate_skus.py` solo completa el SKU cuando el campo esta vacio y sigue reglas consistentes de formato para el catalogo.
- Ambos scripts se apoyan en una configuracion comun para que el proyecto se mantenga ordenado y extensible.

## GitHub Actions

El proyecto tambien puede ejecutarse desde GitHub Actions para automatizar estas tareas sin hacerlo manualmente.

Workflow disponible: `Run Airtable Script` (`.github/workflows/run_airtable_script.yml`)

- `script`: selecciona el script dentro de `scripts/` (por ejemplo `generate_skus` o `generate_descriptions`).
- `task`: key opcional de `config.json` que se pasa como `--task`.
- `dry_run`: agrega `--dry-run` al comando.
- `limit`: se aplica a `generate_descriptions` como `--limit`.
- `extra_args`: argumentos extra para extender la ejecucion sin editar el workflow.

Ejemplos desde `workflow_dispatch`:

- SKUs:
  - `script=generate_skus`
  - `task=skus`
  - `dry_run=true`
- Descripciones:
  - `script=generate_descriptions`
  - `task=descriptions`
  - `limit=25`
  - `dry_run=true`
