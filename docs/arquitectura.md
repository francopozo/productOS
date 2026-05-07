# Arquitectura

## Proposito

Automatizar procesos de catalogo con Airtable mediante scripts Python y ejecucion local o con GitHub Actions, mientras se mantiene una segunda area separada para el diseno de automatizaciones n8n.

## Componentes Principales

- `config.json`: define las tareas disponibles y su configuracion
- `scripts/`: contiene los scripts ejecutables
- `.github/workflows/run_airtable_script.yml`: permite ejecucion remota manual
- `modules/airtable-actions/`: concentra el contexto operativo de Airtable
- `modules/n8n-automation/`: concentra el contexto documental de n8n

## Estructura General

```text
productOS/
|- config.json
|- scripts/
|  |- generate_descriptions.py
|  |- generate_skus.py
|  `- sku_dictionary.json
|- modules/
|  |- airtable-actions/
|  `- n8n-automation/
`- .github/workflows/run_airtable_script.yml
```

## Flujo De Ejecucion

1. Se selecciona un script desde CLI o GitHub Actions.
2. El script resuelve la tarea a partir de `config.json`.
3. Se cargan variables de entorno y credenciales.
4. Se procesan registros.
5. Se escriben resultados en Airtable o se imprime una simulacion en `dry-run`.

## Reglas De Diseno

- No hardcodear tablas ni campos si pueden resolverse desde `config.json`.
- Mantener los scripts orientados por tarea.
- Tomar secretos solo desde variables de entorno.
- Mantener los procesos idempotentes cuando sea posible.
- Separar contexto de Airtable y de n8n sin duplicar repositorios.

## Tareas Disponibles

- `descriptions`: generacion de descripciones
- `skus`: generacion de SKUs
