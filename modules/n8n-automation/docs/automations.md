# Automatizaciones

Catalogo base para definir automatizaciones n8n.

## Automatizaciones Activas O En Curso

### Airtable-Woo

- objetivo: crear productos simples en WooCommerce desde nuevos registros de Airtable
- workflow id: `Hl7g6exfaDKNMjzg`
- trigger: `Airtable Trigger` sobre `CatalogOS > Productos`
- estado: publicado y funcional en prueba inicial
- documento operativo: `docs/airtable-woocommerce-minimo.md`

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
