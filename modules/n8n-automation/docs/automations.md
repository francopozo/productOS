# Automatizaciones

Catalogo base para definir automatizaciones n8n.

## Automatizaciones Activas O En Curso

### Airtable-Woo

- objetivo: sincronizar productos simples desde Airtable hacia WooCommerce con activacion por registro
- workflow id: `Hl7g6exfaDKNMjzg`
- trigger: `Airtable Trigger` sobre `CatalogOS > Productos`
- estado documentado: Fase 1 versionada en SDK local
- documento operativo: `docs/airtable-woocommerce-minimo.md`

### Airtable-Generate-Descriptions

- objetivo: generar descripciones comerciales desde Airtable con OpenAI y writeback de estado por registro
- workflow id: `lN4yW1cZbfjJ4rkh`
- trigger: `Airtable Description Trigger` sobre `CatalogOS > Productos`
- estado documentado: workflow operativo con SDK local
- documento operativo: `docs/airtable-generate-descriptions.md`

### Airtable-Generate-SKUs

- objetivo: generar SKUs desde Airtable usando `Categoria` y `Grupo`, con writeback de estado por registro
- workflow id: `Kd6a3ClzOTpow9ca`
- trigger: `Airtable SKU Trigger` sobre `CatalogOS > Productos`
- estado documentado: workflow operativo con SDK local
- documento operativo: `docs/airtable-generate-skus.md`

## Plantilla Sugerida

Para cada automatizacion documenta:

- nombre
- objetivo
- trigger
- entradas
- transformaciones
- salidas
- errores esperados
- dependencias externas

## Regla

Si una automatizacion toca Airtable o scripts Python, deja esa relacion explicita como contrato.
