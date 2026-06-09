# Airtable -> WooCommerce Fase 1

## Objetivo

Crear productos simples en WooCommerce desde registros de Airtable con control por registro, validacion previa y escritura de vuelta a Airtable.

## Workflow Objetivo

- workflow en n8n: `Airtable-Woo`
- workflow id: `Hl7g6exfaDKNMjzg`
- SDK local: `modules/n8n-automation/workflows/airtable-woo-sdk.js`
- estado documentado: Fase 1 versionada en SDK local

## Fuente De Verdad

Tomar como fuente de verdad, en este orden:

1. el workflow activo en n8n
2. el SDK local `modules/n8n-automation/workflows/airtable-woo-sdk.js`
3. esta documentacion como contrato funcional

Si hay diferencia entre esta pagina y el workflow real, prevalece el workflow activo y luego hay que corregir la documentacion.

## Alcance Actual

- Fase 1 implementada en el SDK local
- diseno centrado en alta de productos
- evita recrear registros que ya tienen `Woo ID`
- escribe `Woo ID`, `Woo URL`, `Woo Estado Sync`, `Woo Ult Sync` y `Woo Error` en Airtable
- usa `Categoria` como `single select` local en `Productos`
- ya no depende de `Categorias`, `Categoria-Look`, `Grupo` ni `Grupo-Look` en runtime
- deja `Grupo` fuera de esta fase

## Campos Requeridos En Airtable

### Tabla `Productos`

Crear manualmente solo si esos campos aun no existen:

- `Woo Sync` (`checkbox`)
- `Woo ID` (`single line text`)
- `Woo URL` (`single line text` o `url`)
- `Woo Estado Sync` (`single select`)
- `Woo Ult Sync` (`dateTime`)
- `Woo Error` (`multiline text`)
- `Woo Trigger Modified` (`last modified time`)

Configurar `Woo Trigger Modified` para observar como minimo:

- `Woo Sync`
- `Producto`
- `Descripcion`
- `SKU`
- `Attachments`
- `Disponibilidad`
- `Categoria`

Campos ya existentes usados por el flujo:

- `Producto`
- `Descripcion`
- `SKU`
- `Disponibilidad`
- `Categoria`
- `Attachments`

## Comportamiento De Fase 1

### Trigger

- nodo: `Airtable Product Sync Trigger`
- base: `CatalogOS`
- tabla: `Productos`
- trigger field: `Woo Trigger Modified`
- filtro: `AND({Woo Sync}=1)`

### Validacion

Antes de crear en Woo:

- `Producto` debe existir
- `SKU` debe existir
- `Categoria` debe existir
- `Woo ID` debe estar vacio

Si falla una validacion:

- `Woo Estado Sync = Error`
- `Woo Error = mensaje legible`

### Mapeo A WooCommerce

- `Producto` -> `name`
- `Descripcion` -> `description`
- `SKU` -> `sku`
- `Disponibilidad` -> `stockStatus`
- `Attachments[0].url` -> imagen principal si existe
- valor fijo -> `status = draft`
- valor fijo -> `type = simple`

## Escritura De Vuelta A Airtable

En alta exitosa:

- `Woo ID`
- `Woo URL`
- `Woo Estado Sync = Enviado`
- `Woo Ult Sync = fecha ISO`
- `Woo Error = ""`

En error previo a Woo:

- `Woo Estado Sync = Error`
- `Woo Error = mensaje`

## Credenciales

Verificar antes de publicar cambios:

1. crear los campos nuevos en Airtable
2. reconectar credencial Airtable en:
   - trigger
   - `Write Validation Error To Airtable`
   - `Write Woo Success To Airtable`
3. reconectar credencial WooCommerce en:
   - `Create Woo Product Without Image`
   - `Create Woo Product With Image`
4. probar con un registro controlado
5. publicar el workflow

## Limitaciones Conocidas

- esta fase no actualiza productos existentes en WooCommerce
- por ahora el workflow no asigna categoria en WooCommerce aunque si valida que el `single select` `Categoria` exista
- si quieres asignar categoria tambien en Woo, el siguiente paso sera mapear cada opcion del `single select` a su Woo category ID
- la Fase 2 seguira con conciliacion por `SKU` y actualizacion por `Woo ID` o match unico por SKU
