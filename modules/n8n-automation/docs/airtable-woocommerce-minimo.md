# Airtable -> WooCommerce Minimo

## Objetivo

Crear un producto simple en WooCommerce desde un nuevo registro en Airtable usando un flujo enteramente dentro de n8n.

## Estado Confirmado

- workflow existente en n8n: `Airtable-Woo`
- workflow id: `Hl7g6exfaDKNMjzg`
- URL: `https://n8n.ideamax.com.bo/workflow/Hl7g6exfaDKNMjzg`
- estado actual: publicado
- creacion validada: funciona creando productos simples en WooCommerce
- publicacion en `draft` para evitar exponer productos incompletos

## Alcance Actual

- solo alta de productos
- solo campos minimos para prueba
- credenciales cargadas manualmente por el usuario
- sin precio todavia
- sin escritura de vuelta a Airtable todavia

## Trigger

- `Airtable Trigger`
- evento esperado: nuevo registro en `CatalogOS > Productos`
- polling actual: cada minuto
- `triggerField` manual confirmado: `Created`

## Dependencias

- credencial Airtable dentro de n8n
- credencial WooCommerce dentro de n8n
- acceso a la tabla `Productos` en la base `CatalogOS`

## Ubicacion De Datos

- base Airtable: `CatalogOS`
- base id: `appaM2jqwYMS6fbiY`
- tabla: `Productos`
- table id: `tblnPHhOefx9R4NnT`

## Campos Confirmados En Airtable

Campos vistos en el workflow original o usados durante esta iteracion:

- `Created`
- `Producto`
- `Descripcion`
- `SKU`
- `Disponibilidad`
- `Categoria`
- `Grupo`
- `Attachments`
- `Caracteristica`

## Mapeo Actual A WooCommerce

- `Producto` -> `name`
- `Descripcion` -> `description`
- `SKU` -> `sku`
- valor fijo -> `status = draft`
- valor fijo -> `type = simple`

## Payload Minimo Real

```json
{
  "name": "Producto demo",
  "description": "Descripcion corta de prueba",
  "sku": "SKU-DEMO-001",
  "status": "draft",
  "type": "simple"
}
```

## Estructura Actual Del Workflow

1. `Airtable New Product`
2. `Map Woo Fields`
3. `Create Woo Product`

## Nodos Actuales

### Airtable New Product

- tipo: `n8n-nodes-base.airtableTrigger`
- base: `CatalogOS`
- tabla: `Productos`
- trigger field: `Created`
- fields incluidos: `Producto,Descripcion,SKU,Disponibilidad,Categoria,Grupo,Attachments,Caracteristica`

### Map Woo Fields

- tipo: `n8n-nodes-base.set`
- crea:
  - `wc_name`
  - `wc_description`
  - `wc_sku`
  - `wc_status`
  - `wc_type`

### Create Woo Product

- tipo: `n8n-nodes-base.wooCommerce`
- resource: `product`
- operation: `create`
- crea producto `simple`
- guarda producto en `draft`

## Pasos Manuales Vigentes

- conectar credencial Airtable en el trigger
- conectar credencial WooCommerce en el nodo de creacion
- mantener `triggerField = Created`
- si cambia el nombre del campo de tiempo, actualizar tambien el trigger

## Resultado De La Prueba

- creacion exitosa confirmada por el usuario
- el trigger detecta nuevos registros
- WooCommerce recibe el producto minimo correctamente

## Estado Actual

- workflow validado via `n8n-mcp`
- workflow actualizado en n8n via SDK
- workflow publicado manualmente por el usuario
- export SDK local guardado en `workflows/airtable-woo-sdk.js`

## Mejoras Futuras Sugeridas

- agregar precio cuando exista o se confirme el campo correcto en Airtable
- devolver a Airtable el ID o URL del producto creado en WooCommerce
- evitar duplicados usando SKU o un campo de control
- mapear categorias o grupos a categorias reales de WooCommerce
- adjuntar imagenes si `Attachments` contiene URLs validas
- agregar validacion previa si falta `Producto`
- publicar o no publicar segun una bandera de Airtable
