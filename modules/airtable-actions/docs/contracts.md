# Contratos

Resumen operativo del modulo `airtable-actions`.

## Sistemas Involucrados

- Airtable como fuente y destino de datos
- OpenAI para descripciones
- GitHub Actions para ejecucion remota manual
- Python como runtime

## Entradas

- variables de entorno
- argumentos CLI
- `config.json`
- `scripts/sku_dictionary.json`

## Salidas

- actualizaciones sobre registros en Airtable
- salida JSON resumida en consola
- logs de ejecucion local o CI

## Entry Points

- `scripts/generate_descriptions.py`
- `scripts/generate_skus.py`
- `.github/workflows/run_airtable_script.yml`

## Regla De Integracion

Si una automatizacion externa necesita usar este modulo, primero define:

- que datos entran
- que sistema dispara la ejecucion
- que salida produce
- donde vive ese contrato
