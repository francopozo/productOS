import { workflow, node, trigger, switchCase, expr, newCredential } from '@n8n/workflow-sdk';

const airtableDescriptionTrigger = trigger({
  type: 'n8n-nodes-base.airtableTrigger',
  version: 1,
  config: {
    name: 'Airtable Description Trigger',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [96, -32],
    parameters: {
      pollTimes: {
        item: [
          {
            mode: 'everyMinute',
          },
        ],
      },
      authentication: 'airtableTokenApi',
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
      triggerField: 'Desc Trigger Modified',
      additionalFields: {
        fields: 'Producto,Descripcion,SKU,Disponibilidad,Categoria,Attachments,Caracteristica,Desc Sync,Desc Estado,Desc Error,Desc Ult Gen,Identity Key',
        formula: 'AND({Desc Sync}=1)',
      },
    },
  },
  output: [
    {
      id: 'rec_desc_001',
      Producto: 'Tarjeta plastica premium',
      Descripcion: '',
      SKU: 'CORTP008',
      Disponibilidad: 'En stock',
      Categoria: 'Corporativo',
      Attachments: [],
      Caracteristica: 'Acabado brillante',
      'Desc Sync': true,
      'Desc Estado': 'Pendiente',
      'Desc Error': '',
      'Desc Ult Gen': '',
      'Identity Key': 'tarjeta plastica premium|cortp008',
    },
  ],
});

const preflightDescriptionRecord = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Preflight Description Record',
    position: [304, -32],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const row = $input.item.json;
const source = row.fields ?? row;

const normalizeText = (value) => {
  const nl = String.fromCharCode(10);
  const cr = String.fromCharCode(13);
  const tab = String.fromCharCode(9);
  return String(value ?? '').trim().toLowerCase().split(nl).join(' ').split(cr).join(' ').split(tab).join(' ').split(' ').filter(Boolean).join(' ');
};
const pickPlain = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item?.name === 'string') return item.name.trim();
      if (typeof item?.url === 'string') return item.url.trim();
      return '';
    }).filter(Boolean).join(', ');
  }
  if (typeof value?.name === 'string') return value.name.trim();
  return '';
};
const isInternalCodeField = (fieldName) => {
  const normalized = normalizeText(fieldName);
  return normalized.includes('sku') || normalized.includes('codigo') || normalized.includes('code') || normalized.includes('reference') || normalized.includes('barcode') || normalized.includes('ean') || normalized.includes('upc') || normalized.includes('gtin') || normalized.includes('asin');
};

const productName = pickPlain(source.Producto);
const sku = pickPlain(source.SKU);
const currentDescription = pickPlain(source.Descripcion);
const identityKey = normalizeText(source['Identity Key'] || (productName + '|' + sku));
const descSync = Boolean(source['Desc Sync']);

const ignoredFields = new Set(['Producto', 'Descripcion', 'SKU', 'Attachments', 'Desc Sync', 'Desc Estado', 'Desc Error', 'Desc Ult Gen', 'Desc Trigger Modified', 'Identity Key', 'Woo Sync', 'Woo ID', 'Woo URL', 'Woo Estado Sync', 'Woo Ult Sync', 'Woo Error', 'Woo Trigger Modified', 'Button', 'Whatsapp', 'Created']);
const attributes = {};
for (const [key, value] of Object.entries(source)) {
  if (ignoredFields.has(key) || isInternalCodeField(key)) continue;
  const plain = pickPlain(value);
  if (plain) attributes[key] = plain;
}

let routeIndex = 3;
let syncError = '';
if (!descSync) {
  routeIndex = 1;
  syncError = 'El registro no esta marcado para generar descripcion.';
} else if (!productName) {
  routeIndex = 0;
  syncError = 'Falta el nombre del producto en Airtable.';
} else if (!identityKey) {
  routeIndex = 0;
  syncError = 'No pude construir la identidad del producto.';
} else if (currentDescription) {
  routeIndex = 1;
  syncError = 'La descripcion ya existe y no se sobrescribe automaticamente.';
}

const tableName = encodeURIComponent('Productos');
const safeIdentity = String(source['Identity Key'] || (productName + '|' + sku)).replace(/\\"/g, '\\\\\\"');
const duplicateFormula = 'AND({Identity Key}="' + safeIdentity + '",RECORD_ID()!="' + row.id + '")';
const recentFormula = 'AND(RECORD_ID()!="' + row.id + '",LEN(TRIM({Descripcion}&""))>0)';

return {
  json: {
    ...row,
    ...source,
    airtable_record_id: row.id,
    product_name: productName,
    product_sku: sku,
    current_description: currentDescription,
    identity_key: identityKey,
    product_attributes: attributes,
    duplicate_lookup_url: 'https://api.airtable.com/v0/appaM2jqwYMS6fbiY/' + tableName + '?pageSize=5&filterByFormula=' + encodeURIComponent(duplicateFormula),
    recent_descriptions_url: 'https://api.airtable.com/v0/appaM2jqwYMS6fbiY/' + tableName + '?pageSize=5&filterByFormula=' + encodeURIComponent(recentFormula) + '&sort%5B0%5D%5Bfield%5D=Created&sort%5B0%5D%5Bdirection%5D=desc&fields%5B%5D=Descripcion',
    routeIndex,
    sync_error: syncError,
  },
};
      `,
    },
  },
  output: [
    {
      id: 'rec_desc_001',
      Producto: 'Tarjeta plastica premium',
      SKU: 'CORTP008',
      Descripcion: '',
      airtable_record_id: 'rec_desc_001',
      product_name: 'Tarjeta plastica premium',
      product_sku: 'CORTP008',
      current_description: '',
      identity_key: 'tarjeta plastica premium|cortp008',
      product_attributes: {
        Disponibilidad: 'En stock',
        Categoria: 'Corporativo',
        Caracteristica: 'Acabado brillante',
      },
      duplicate_lookup_url: 'https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos?pageSize=5',
      recent_descriptions_url: 'https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos?pageSize=5',
      routeIndex: 3,
      sync_error: '',
    },
  ],
});

const descriptionRoute = switchCase({
  version: 3.4,
  config: {
    name: 'Description Route',
    position: [512, -64],
    parameters: {
      mode: 'expression',
      numberOutputs: 4,
      output: expr('{{ $json.routeIndex }}'),
    },
  },
});

const writeDescriptionError = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write Description Error',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [2432, 320],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ ({ fields: { "Desc Estado": "Error", "Desc Error": $json.sync_error || "Error generando descripcion.", "Desc Sync": false }, typecast: true }) }}'),
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
  },
});

const writeDescriptionSkipped = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write Description Skipped',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [1456, -16],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ ({ fields: { "Desc Estado": "Omitido", "Desc Error": $json.sync_error || "Registro omitido.", "Desc Sync": false }, typecast: true }) }}'),
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
  },
});

const markDescriptionPending = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Mark Description Pending',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [672, 288],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ ({ fields: { "Desc Estado": "Pendiente", "Desc Error": "" }, typecast: true }) }}'),
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
  },
});

const lookupDuplicateIdentity = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Lookup Duplicate Identity',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [832, 288],
    parameters: {
      url: expr('{{ $("Preflight Description Record").item.json.duplicate_lookup_url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    alwaysOutputData: true,
  },
  output: [
    {
      records: [],
    },
  ],
});

const evaluateDuplicateIdentity = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Evaluate Duplicate Identity',
    position: [992, 288],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const lookup = $input.item.json;
const context = $('Preflight Description Record').item.json;
const records = Array.isArray(lookup.records) ? lookup.records : [];
const hasDuplicate = records.some((record) => record.id !== context.airtable_record_id);
return {
  json: {
    ...context,
    routeIndex: hasDuplicate ? 1 : 2,
    sync_error: hasDuplicate ? 'Identidad duplicada detectada para Producto + SKU.' : '',
  },
};
      `,
    },
  },
  output: [
    {
      airtable_record_id: 'rec_desc_001',
      routeIndex: 2,
      sync_error: '',
    },
  ],
});

const duplicateRoute = switchCase({
  version: 3.4,
  config: {
    name: 'Duplicate Route',
    position: [1168, 272],
    parameters: {
      mode: 'expression',
      numberOutputs: 3,
      output: expr('{{ $json.routeIndex }}'),
    },
  },
});

const fetchRecentDescriptions = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Recent Descriptions',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [1424, 448],
    parameters: {
      url: expr('{{ $json.recent_descriptions_url }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
    alwaysOutputData: true,
  },
  output: [
    {
      records: [
        {
          fields: {
            Descripcion: 'Descripcion previa de ejemplo.',
          },
        },
      ],
    },
  ],
});

const buildDescriptionPrompt = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Description Prompt',
    position: [1616, 448],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const payload = $input.item.json;
const context = $('Evaluate Duplicate Identity').item.json;
const records = Array.isArray(payload.records) ? payload.records : [];
const existingDescriptions = records.map((record) => String(record?.fields?.Descripcion ?? '').trim()).filter(Boolean).slice(0, 5);

const promptLines = [
  'Escribe una descripcion comercial en espanol para un producto de ecommerce.',
  'Objetivo: vender sin sonar exagerado, con tono claro, natural y profesional.',
  'Requisitos:',
  '- Entre 35 y 70 palabras.',
  '- Debe ser especifica para el producto y usar sus atributos reales.',
  '- No repitas frases genericas.',
  '- Ignora completamente SKU o codigos internos.',
  '- No incluyas bullets, titulos, comillas ni etiquetas JSON.',
  '- Evita copiar descripciones ya existentes o sonar demasiado parecida a ellas.',
];

if (existingDescriptions.length) {
  promptLines.push('Descripciones previas que ya fueron usadas y debes evitar repetir:');
  for (const item of existingDescriptions) promptLines.push('- ' + item);
}

promptLines.push('Datos del producto:');
promptLines.push('- Producto: ' + context.product_name);
for (const [key, value] of Object.entries(context.product_attributes ?? {})) {
  if (value) promptLines.push('- ' + key + ': ' + value);
}

return {
  json: {
    ...context,
    existing_descriptions: existingDescriptions,
    prompt: promptLines.join(String.fromCharCode(10)),
  },
};
      `,
    },
  },
  output: [
    {
      product_name: 'Tarjeta plastica premium',
      existing_descriptions: ['Descripcion previa de ejemplo.'],
      prompt: 'Escribe una descripcion comercial en espanol para un producto de ecommerce.',
    },
  ],
});

const generateDescription = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Generate Description',
    credentials: {
      openAiApi: newCredential('OpenAI'),
    },
    position: [1808, 448],
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/chat/completions',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'openAiApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ ({ model: "gpt-4.1-mini", temperature: 0.8, max_tokens: 180, messages: [{ role: "system", content: "Eres un copywriter de ecommerce. Respondes solo con el texto final de la descripcion." }, { role: "user", content: $json.prompt }] }) }}'),
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
  },
  output: [
    {
      choices: [
        {
          message: {
            content: 'Descripcion comercial de ejemplo generada para pruebas.',
          },
        },
      ],
    },
  ],
});

const evaluateGeneratedDescription = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Evaluate Generated Description',
    position: [2000, 448],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const payload = $input.item.json;
const context = $('Build Description Prompt').item.json;
const normalizeText = (value) => {
  const nl = String.fromCharCode(10);
  const cr = String.fromCharCode(13);
  const tab = String.fromCharCode(9);
  return String(value ?? '').trim().toLowerCase().split(nl).join(' ').split(cr).join(' ').split(tab).join(' ').split(' ').filter(Boolean).join(' ');
};

let generatedDescription = '';
if (payload?.error?.message) {
  return {
    json: {
      ...context,
      routeIndex: 0,
      sync_error: 'OpenAI devolvio un error: ' + payload.error.message,
    },
  };
}

const content = payload?.choices?.[0]?.message?.content;
if (Array.isArray(content)) {
  generatedDescription = content.map((item) => (item && item.type === 'text' ? item.text : '')).join(String.fromCharCode(10)).trim();
} else {
  generatedDescription = String(content ?? '').trim();
}

const nl = String.fromCharCode(10);
const cr = String.fromCharCode(13);
const tab = String.fromCharCode(9);
generatedDescription = generatedDescription.split(nl).join(' ').split(cr).join(' ').split(tab).join(' ').split(' ').filter(Boolean).join(' ');
const normalizedGenerated = normalizeText(generatedDescription);
const existing = Array.isArray(context.existing_descriptions) ? context.existing_descriptions.map(normalizeText).filter(Boolean) : [];

if (!normalizedGenerated) {
  return { json: { ...context, routeIndex: 0, sync_error: 'No se pudo extraer una descripcion valida desde OpenAI.' } };
}
if (existing.includes(normalizedGenerated)) {
  return { json: { ...context, routeIndex: 0, sync_error: 'La descripcion generada coincide con una descripcion previa.' } };
}

return {
  json: {
    ...context,
    routeIndex: 1,
    generated_description: generatedDescription,
    sync_error: '',
  },
};
      `,
    },
  },
  output: [
    {
      routeIndex: 1,
      generated_description: 'Descripcion comercial de ejemplo generada para pruebas.',
      sync_error: '',
    },
  ],
});

const aiOutputRoute = switchCase({
  version: 3.4,
  config: {
    name: 'AI Output Route',
    position: [2192, 448],
    parameters: {
      mode: 'expression',
      numberOutputs: 2,
      output: expr('{{ $json.routeIndex }}'),
    },
  },
});

const writeDescriptionSuccess = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write Description Success',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [2432, 512],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      specifyBody: 'json',
      jsonBody: expr('{{ ({ fields: { "Descripcion": $json.generated_description, "Desc Estado": "Generado", "Desc Error": "", "Desc Ult Gen": $now.toISO(), "Desc Sync": false }, typecast: true }) }}'),
      options: {
        response: {
          response: {
            neverError: true,
            responseFormat: 'json',
          },
        },
      },
    },
  },
});

export default workflow('airtable-generate-descriptions', 'Airtable-Generate-Descriptions')
  .add(airtableDescriptionTrigger)
  .to(
    preflightDescriptionRecord.to(
      descriptionRoute
        .onCase(0, writeDescriptionError)
        .onCase(1, writeDescriptionSkipped)
        .onCase(2, writeDescriptionSkipped)
        .onCase(
          3,
          markDescriptionPending.to(
            lookupDuplicateIdentity.to(
              evaluateDuplicateIdentity.to(
                duplicateRoute
                  .onCase(0, writeDescriptionError)
                  .onCase(1, writeDescriptionSkipped)
                  .onCase(
                    2,
                    fetchRecentDescriptions.to(
                      buildDescriptionPrompt.to(
                        generateDescription.to(
                          evaluateGeneratedDescription.to(
                            aiOutputRoute
                              .onCase(0, writeDescriptionError)
                              .onCase(1, writeDescriptionSuccess),
                          ),
                        ),
                      ),
                    ),
                  ),
              ),
            ),
          ),
        ),
    ),
  );
