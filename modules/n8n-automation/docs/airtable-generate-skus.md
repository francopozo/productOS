# Airtable Generate SKUs

## Objetivo

Generar SKUs desde Airtable usando `Categoria` y `Grupo` directamente, con activacion por registro y writeback de estado por registro.

## Identidad Del Workflow

- workflow en n8n: `Airtable-Generate-SKUs`
- workflow id: `Kd6a3ClzOTpow9ca`
- estado actual: operativo
- SDK local: `modules/n8n-automation/workflows/airtable-generate-skus-sdk.js`

## Fuente De Verdad

Tomar como fuente de verdad, en este orden:

1. el workflow activo en n8n
2. el SDK local `modules/n8n-automation/workflows/airtable-generate-skus-sdk.js`
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

## Relacion Con El Script Original

Este flujo reemplaza en n8n la logica principal de `scripts/generate_skus.py`.

Contrato que conserva:

- genera SKU solo si el campo `SKU` esta vacio
- normaliza texto a mayusculas, sin acentos, sin espacios y sin guiones
- compone `TIPO + SUB + VAR + ID`
- usa mapping fijo para `Categoria`
- calcula correlativo numerico con padding de 3

Diferencias operativas:

- el workflow usa `Categoria` en lugar de `Categoria-Look`
- el workflow usa `Grupo` en lugar de `Grupo-Look`
- el diccionario de `Categoria` vive dentro de un nodo `Code` editable en n8n
- `Grupo` se deriva automaticamente y no depende de mapping manual
- el flujo trabaja por trigger sobre Airtable y agrega writeback de observabilidad

## Campos Requeridos En Airtable

### Tabla `Productos`

Campos usados por el flujo:

- `Producto`
- `Categoria`
- `Grupo`
- `SKU`

Campos de control requeridos:

- `SKU Sync` (`checkbox`)
- `SKU Estado` (`single select`)
- `SKU Error` (`multiline text`)
- `SKU Ult Gen` (`dateTime`)
- `SKU Trigger Modified` (`last modified time`)

Configurar `SKU Trigger Modified` para observar como minimo:

- `SKU Sync`
- `Categoria`
- `Grupo`
- `SKU`
- `Producto`

## Contrato Funcional

El workflow solo debe generar SKU cuando se cumplen estas condiciones:

- `SKU Sync = true`
- `Producto` tiene valor
- `Categoria` tiene valor valido en el diccionario
- `SKU` esta vacio

El workflow no debe:

- sobrescribir un `SKU` ya existente
- depender de `Categoria-Look`
- depender de `Grupo-Look`
- exigir diccionario manual por cada nuevo `Grupo`

## Flujo Logico

### Trigger

- nodo: `Airtable SKU Trigger`
- base: `CatalogOS`
- tabla: `Productos`
- trigger field: `SKU Trigger Modified`
- filtro: `AND({SKU Sync}=1)`

### Preflight

Antes de generar:

- `Producto` debe existir
- `Categoria` debe existir
- `SKU` debe estar vacio

Si falla una validacion:

- `SKU Estado = Error` o `Omitido`
- `SKU Error = mensaje legible`
- `SKU Sync = false`

### Construccion Del Prefijo

El flujo:

- toma `Categoria` y la resuelve contra `type_map` fijo
- toma `Grupo` y deriva una abreviacion automatica
- deja `var_map` soportado pero vacio por defecto
- conserva `id_padding = 3`

Si `Categoria` no tiene mapping:

- no genera SKU
- marca el registro como error

### Diccionario De Categoria

La configuracion editable vive en el nodo `Build SKU Prefix`.

El `type_map` actual es:

```js
{
  CORPORATIVO: 'COR',
  PUBLICITARIA: 'PUB',
  REVISTAS: 'REV',
  'GRAN FORMATO': 'GFO',
  EXPOSITORES: 'EXP',
  'ARTICULOS PROMOCIONALES': 'MKT',
  EMBAJALES: 'EMP',
  IDENTIFICACION: 'IDE',
}
```

### Abreviacion Automatica De Grupo

La abreviacion de `Grupo` sigue esta regla:

- si tiene una sola palabra, usa las primeras 3 letras normalizadas
- si tiene 2 o mas palabras, usa iniciales de hasta 3 palabras
- si las iniciales quedan demasiado cortas para resolver una colision, completa con letras de la primera palabra
- si `Grupo` esta vacio, no agrega componente `SUB`

Ejemplos esperados:

- `Escritura` -> `ESC`
- `Tarjetas Personales` -> `TP`
- `Punto de Venta` -> `PDV`
- `Portacelulares` -> `POR`

### Colisiones De Grupo

Si dos grupos distintos convergen en la misma abreviacion base dentro de la misma categoria:

- el flujo intenta ampliar automaticamente la abreviacion
- para una palabra, agrega mas letras de la misma palabra
- para varias palabras, intenta usar mas iniciales y luego mas letras de la primera palabra
- si no encuentra una abreviacion unica tras varios intentos, marca error legible

Regla importante:

- si el grupo ya existe historicamente en esa categoria, debe reutilizar su mismo subcodigo
- solo se expande la abreviacion cuando la colision es con otro grupo distinto

### Resolucion Del Correlativo

El flujo consulta Airtable para encontrar el SKU mas alto del prefijo actual:

- filtra por prefijo de categoria sobre `SKU`
- deriva o reutiliza la abreviacion de `Grupo`
- reconstruye el prefijo final `TIPO + SUB + VAR`
- incrementa el sufijo numerico valido para ese prefijo final

Esto evita reintroducir el bug donde el correlativo se calculaba con un prefijo mas corto que el SKU real.

## Escritura De Vuelta A Airtable

En generacion exitosa:

- `SKU = valor generado`
- `SKU Estado = Generado`
- `SKU Error = ""`
- `SKU Ult Gen = fecha ISO`
- `SKU Sync = false`

En registro omitido:

- `SKU Estado = Omitido`
- `SKU Error = motivo`
- `SKU Ult Gen = fecha ISO`
- `SKU Sync = false`

En error:

- `SKU Estado = Error`
- `SKU Error = mensaje`
- `SKU Ult Gen = fecha ISO`
- `SKU Sync = false`

## Estados Esperados

Valores de uso practico para `SKU Estado`:

- `Pendiente`
- `Generado`
- `Omitido`
- `Error`

## Credenciales

El workflow usa credencial Airtable en n8n:

- `CatalogOS`

Verificar esa credencial especialmente en:

- `Write SKU Error`
- `Write SKU Skipped`
- `Fetch Latest SKU For Prefix`
- `Write SKU Success`

## Checklist Para Coding Agent

Antes de tocar este workflow:

- confirmar si el cambio afecta semantica de SKU o solo observabilidad
- revisar `type_map` y no cambiar abreviaciones historicas sin aprobacion
- conservar la regla de no sobrescribir `SKU` existente
- probar al menos un caso con `Grupo` de una palabra y otro con varias palabras
- usar MCP de n8n y conector Airtable antes de pedir trabajo manual
- pedir intervencion manual solo si faltan herramientas o permisos
- validar workflow antes de publicarlo
- publicar el workflow despues de cambios exitosos

## Casos Minimos De Verificacion

- `Escritura` -> `ESC`
- `Portacelulares` -> `POR`
- `Tarjetas Personales` -> `TP`
- `Punto de Venta` -> `PDV`
- `Grupo` vacio -> SKU con solo `Categoria + correlativo`
- colision semantica entre grupos parecidos -> ampliacion automatica sin reciclar subcodigo de otro grupo distinto

## Limitaciones Conocidas

- el diccionario de `Categoria` es editable dentro del workflow, pero no en una tabla separada
- la verificacion de colision reduce riesgo, pero no implementa locking distribuido
- si dos ejecuciones compiten exactamente al mismo tiempo para el mismo prefijo, puede quedar un registro en `Error` listo para reintento
