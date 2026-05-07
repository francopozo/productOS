# Contratos De Scripts

Este documento define el comportamiento esperado de los scripts del proyecto.

## `generate_descriptions.py`

Tarea: `descriptions`

Entrada:

- tabla de Airtable definida en `config.table_name`
- campos fuente definidos en `config.name_fields`

Salida:

- escribe texto generado en `config.field_name`

Comportamiento:

- genera una descripcion con OpenAI
- omite filas con valor existente salvo que se use `--overwrite`
- evita identidades duplicadas

CLI:

- `--task`
- `--limit`
- `--dry-run`
- `--overwrite`

## `generate_skus.py`

Tarea: `skus`

Entrada:

- `categoria_field`
- `grupo_field`
- `producto_field`
- `var_field`
- `dictionary_file`

Salida:

- escribe el SKU en `sku_field`

Comportamiento:

- genera SKU solo si el campo esta vacio
- compone el SKU a partir de mappings y sufijo numerico
- usa `dictionary_file` para mappings externos

CLI:

- `--task`
- `--config-file`
- `--config`
- `--dry-run`
- `--table`

## Contrato De Configuracion

Archivo: `config.json`

Cada tarea debe definir sus claves requeridas.

### `descriptions`

- `table_name`
- `field_name`
- `name_fields`

### `skus`

- `table_name`
- `categoria_field`
- `grupo_field`
- `producto_field`
- `sku_field`
- `var_field`
- `dictionary_file`
- `id_padding`

## Variables De Entorno

Requeridas:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `OPENAI_API_KEY`

Opcionales de runtime:

- `TASK`
- `SKU_TASK`
- `CONFIG_FILE`
- `DRY_RUN`
- `LIMIT`
- `LOAD_DOTENV`

## Contrato De Workflow

Archivo:

- `.github/workflows/run_airtable_script.yml`

Inputs:

- `script`
- `task`
- `dry_run`
- `limit`
- `extra_args`

## Requisitos De Scripts

Todo script debe:

1. Parsear argumentos CLI.
2. Cargar `config.json`.
3. Resolver una tarea.
4. Validar variables requeridas.
5. Ejecutar la logica.
6. Imprimir un resultado claro y breve.

## Restricciones

- No duplicar logica entre scripts si empieza a crecer de forma real.
- Mantener mappings externos en archivos JSON.
- Evitar comportamiento implicito; lo importante debe vivir en config o CLI.
