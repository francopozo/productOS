# Airtable Generate Descriptions

## Objetivo

Generar descripciones comerciales desde Airtable usando OpenAI, con activacion por registro, validacion previa, control de duplicados y escritura de vuelta a Airtable.

## Identidad Del Workflow

- workflow en n8n: `Airtable-Generate-Descriptions`
- workflow id: `lN4yW1cZbfjJ4rkh`
- estado actual: operativo
- SDK local: `modules/n8n-automation/workflows/airtable-generate-descriptions-sdk.js`

## Fuente De Verdad

Tomar como fuente de verdad, en este orden:

1. el workflow activo en n8n
2. el SDK local `modules/n8n-automation/workflows/airtable-generate-descriptions-sdk.js`
3. esta documentacion como contrato funcional

Si hay diferencia entre esta pagina y el workflow real, prevalece el workflow activo y luego hay que corregir la documentacion.

## Entorno Operativo Del Agent

Para este flujo se asume que el agent tiene acceso a:

- MCP de n8n para inspeccionar, validar, actualizar y publicar el workflow
- plugin conector de Airtable para revisar campos, estructura y registros relacionados

Regla de trabajo:

- usar esas herramientas primero
- pedir intervencion manual solo cuando el agent no tenga herramientas o permisos reales para ejecutar el cambio
- si se cambia la logica del workflow, el cambio no se considera cerrado hasta publicar la nueva version en n8n
- al tocar este workflow tambien se debe crear o actualizar su archivo SDK en `modules/n8n-automation/workflows/`

## Relacion Con El Script Original

Este flujo reemplaza en n8n la logica principal de `scripts/generate_descriptions.py`.

Contrato que conserva:

- lee productos desde Airtable
- usa `Producto` y `SKU` para construir una identidad estable
- omite registros que ya tienen `Descripcion`
- evita generar contenido sobre identidades duplicadas
- escribe la descripcion final de vuelta en Airtable

Diferencias operativas:

- el script Python trabaja por corrida manual o por GitHub Actions
- el workflow n8n trabaja por trigger sobre cambios en Airtable
- el workflow agrega campos de estado para observabilidad por registro

## Contrato Funcional

El workflow solo debe generar descripcion cuando se cumplen estas condiciones:

- `Desc Sync = true`
- `Producto` tiene valor
- `Identity Key` puede resolverse
- `Descripcion` esta vacia

El workflow no debe:

- sobrescribir una `Descripcion` existente
- ignorar duplicados de `Identity Key`
- pedir trabajo manual si el cambio puede hacerse con MCP de n8n o conector Airtable

## Campos Requeridos En Airtable

### Tabla `Productos`

Campos usados por el flujo:

- `Producto`
- `Descripcion`
- `SKU`
- `Disponibilidad`
- `Categoria`
- `Attachments`
- `Caracteristica`
- `Identity Key`

Campos de control requeridos:

- `Desc Sync` (`checkbox`)
- `Desc Estado` (`single select`)
- `Desc Error` (`multiline text`)
- `Desc Ult Gen` (`dateTime`)
- `Desc Trigger Modified` (`last modified time`)

Configurar `Desc Trigger Modified` para observar como minimo:

- `Desc Sync`
- `Producto`
- `Descripcion`
- `SKU`
- `Disponibilidad`
- `Categoria`
- `Attachments`
- `Caracteristica`

## Comportamiento Del Flujo

### Trigger

- nodo: `Airtable Description Trigger`
- base: `CatalogOS`
- tabla: `Productos`
- trigger field: `Desc Trigger Modified`
- filtro: `AND({Desc Sync}=1)`

### Preflight

Antes de generar:

- `Desc Sync` debe estar marcado
- `Producto` debe existir
- `Identity Key` debe poder resolverse
- `Descripcion` debe estar vacia

Si falla una validacion:

- `Desc Estado = Error` o `Omitido`
- `Desc Error = mensaje legible`
- `Desc Sync = false`

### Control De Duplicados

El flujo busca en Airtable otros registros con la misma `Identity Key`.

Si encuentra otro registro con la misma identidad:

- no genera descripcion
- marca `Desc Estado = Omitido`
- escribe el motivo en `Desc Error`

### Construccion Del Prompt

El flujo:

- toma atributos visibles del producto
- excluye campos de control y codigos internos
- busca hasta 5 descripciones previas para evitar repeticiones
- arma un prompt corto de estilo ecommerce en espanol

### Generacion

- proveedor: OpenAI
- modelo actual: `gpt-4.1-mini`
- salida esperada: una descripcion comercial breve, sin bullets ni JSON

### Escritura De Vuelta A Airtable

En generacion exitosa:

- `Descripcion = texto generado`
- `Desc Estado = Generado`
- `Desc Error = ""`
- `Desc Ult Gen = fecha ISO`
- `Desc Sync = false`

En error:

- `Desc Estado = Error`
- `Desc Error = mensaje`
- `Desc Sync = false`

## Estados Esperados

Valores de uso practico para `Desc Estado`:

- `Pendiente`
- `Generado`
- `Omitido`
- `Error`

## Credenciales

El workflow usa dos tipos de credenciales:

- Airtable
- OpenAI

Aplicar esa verificacion al menos en:

- `Airtable Description Trigger`
- `Lookup Duplicate Identity`
- `Fetch Recent Descriptions`
- `Mark Description Pending`
- `Write Description Error`
- `Write Description Skipped`
- `Write Description Success`
- `Generate Description`

## Checklist Para Coding Agent

- usar MCP de n8n y conector Airtable antes de pedir trabajo manual
- pedir intervencion manual solo si no hay herramientas o permisos para ejecutar el cambio
- si se modifica el workflow, crear o actualizar su SDK local
- validar workflow antes de publicarlo
- publicar el workflow despues de cambios exitosos

## Limitaciones Conocidas

- el workflow no sobreescribe descripciones existentes
- la deteccion de duplicados depende de que `Identity Key` sea consistente
- la calidad del texto depende de los atributos realmente presentes en Airtable
