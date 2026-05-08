import { workflow, node, trigger, placeholder, expr } from '@n8n/workflow-sdk';

const airtableNewProduct = trigger({
  type: 'n8n-nodes-base.airtableTrigger',
  version: 1,
  config: {
    name: 'Airtable New Product',
    position: [260, 300],
    parameters: {
      pollTimes: {
        item: [
          {
            mode: 'everyMinute',
          },
        ],
      },
      baseId: {
        __rl: true,
        mode: 'id',
        value: 'appaM2jqwYMS6fbiY',
        cachedResultName: 'CatalogOS',
      },
      tableId: {
        __rl: true,
        mode: 'id',
        value: 'tblnPHhOefx9R4NnT',
        cachedResultName: 'Productos',
      },
      triggerField: placeholder('Select your Airtable Created Time or Last Modified Time field'),
      additionalFields: {
        fields: 'Producto,Descripcion,SKU,Disponibilidad,Categoria,Grupo,Attachments,Caracteristica',
      },
    },
  },
  output: [
    {
      id: 'rec_test_001',
      Producto: 'Producto demo',
      Descripcion: 'Descripcion corta de prueba',
      SKU: 'SKU-DEMO-001',
      Disponibilidad: 'Disponible',
      Categoria: ['Categoria demo'],
      Grupo: ['Grupo demo'],
      Attachments: [],
      Caracteristica: 'Prueba inicial',
    },
  ],
});

const mapWooFields = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Map Woo Fields',
    position: [620, 300],
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: 'wc_name',
            name: 'wc_name',
            value: expr('{{ $json.Producto }}'),
            type: 'string',
          },
          {
            id: 'wc_description',
            name: 'wc_description',
            value: expr('{{ $json.Descripcion || "" }}'),
            type: 'string',
          },
          {
            id: 'wc_sku',
            name: 'wc_sku',
            value: expr('{{ $json.SKU || "" }}'),
            type: 'string',
          },
          {
            id: 'wc_status',
            name: 'wc_status',
            value: 'draft',
            type: 'string',
          },
          {
            id: 'wc_type',
            name: 'wc_type',
            value: 'simple',
            type: 'string',
          },
        ],
      },
      options: {
        dotNotation: true,
        ignoreConversionErrors: false,
      },
    },
  },
  output: [
    {
      id: 'rec_test_001',
      Producto: 'Producto demo',
      Descripcion: 'Descripcion corta de prueba',
      SKU: 'SKU-DEMO-001',
      wc_name: 'Producto demo',
      wc_description: 'Descripcion corta de prueba',
      wc_sku: 'SKU-DEMO-001',
      wc_status: 'draft',
      wc_type: 'simple',
    },
  ],
});

const createWooProduct = node({
  type: 'n8n-nodes-base.wooCommerce',
  version: 1,
  config: {
    name: 'Create Woo Product',
    position: [980, 300],
    parameters: {
      resource: 'product',
      operation: 'create',
      name: expr('{{ $json.wc_name }}'),
      additionalFields: {
        description: expr('{{ $json.wc_description }}'),
        sku: expr('{{ $json.wc_sku }}'),
        status: 'draft',
        type: 'simple',
      },
    },
  },
  output: [
    {
      id: 101,
      name: 'Producto demo',
      sku: 'SKU-DEMO-001',
      status: 'draft',
      type: 'simple',
      description: 'Descripcion corta de prueba',
    },
  ],
});

export default workflow('airtable-woo', 'Airtable-Woo')
  .add(airtableNewProduct)
  .to(mapWooFields)
  .to(createWooProduct);
