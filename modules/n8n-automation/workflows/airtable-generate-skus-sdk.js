import { workflow, node, trigger, switchCase, expr, newCredential } from '@n8n/workflow-sdk';

const airtableSkuTrigger = trigger({
  type: 'n8n-nodes-base.airtableTrigger',
  version: 1,
  config: {
    name: 'Airtable SKU Trigger',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [260, 320],
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
      triggerField: 'SKU Trigger Modified',
      additionalFields: {
        formula: 'AND({SKU Sync}=1)',
        fields: 'Producto,Categoria,Grupo,SKU,SKU Sync,SKU Estado,SKU Error,SKU Ult Gen',
      },
    },
  },
  output: [
    {
      id: 'rec_test_001',
      Producto: 'Tarjeta Premium',
      Categoria: 'Corporativo',
      Grupo: 'Tarjetas Personales',
      SKU: '',
      'SKU Sync': true,
      'SKU Estado': 'Pendiente',
      'SKU Error': '',
      'SKU Ult Gen': '',
    },
  ],
});

const preflightSkuRecord = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Preflight SKU Record',
    position: [560, 320],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const row = $input.item.json;
const source = row.fields ?? row;
const productRaw = source.Producto ?? row.Producto ?? '';
const skuRaw = source.SKU ?? row.SKU ?? '';
const categoryRaw = source.Categoria ?? row.Categoria ?? '';

const productName = typeof productRaw === 'string' ? productRaw.trim() : '';
const currentSku = typeof skuRaw === 'string' ? skuRaw.trim() : '';
const categoryName = typeof categoryRaw === 'string'
  ? categoryRaw.trim()
  : typeof categoryRaw?.name === 'string'
    ? categoryRaw.name.trim()
    : '';

let routeIndex = 2;
let syncError = '';
let skipReason = '';

if (!productName) {
  routeIndex = 0;
  syncError = 'Falta el nombre del producto en Airtable.';
} else if (currentSku) {
  routeIndex = 1;
  skipReason = 'Registro omitido porque ya tiene SKU.';
} else if (!categoryName) {
  routeIndex = 0;
  syncError = 'Falta la categoria en Airtable.';
}

return {
  json: {
    ...row,
    ...source,
    airtable_record_id: row.id,
    product_name: productName,
    current_sku: currentSku,
    category_name: categoryName,
    routeIndex,
    sync_error: syncError,
    skip_reason: skipReason,
  },
};
      `,
    },
  },
  output: [
    {
      id: 'rec_test_001',
      Producto: 'Tarjeta Premium',
      Categoria: 'Corporativo',
      Grupo: 'Tarjetas Personales',
      SKU: '',
      'SKU Sync': true,
      airtable_record_id: 'rec_test_001',
      product_name: 'Tarjeta Premium',
      current_sku: '',
      category_name: 'Corporativo',
      routeIndex: 2,
      sync_error: '',
      skip_reason: '',
    },
  ],
});

const preflightRoute = switchCase({
  version: 3.4,
  config: {
    name: 'Preflight Route',
    position: [860, 320],
    parameters: {
      mode: 'expression',
      numberOutputs: 3,
      output: expr('{{ $json.routeIndex }}'),
    },
  },
});

const buildSkuPrefix = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build SKU Prefix',
    position: [1140, 480],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const row = $input.item.json;

const config = {
  type_map: {
    CORPORATIVO: 'COR',
    PUBLICITARIA: 'PUB',
    REVISTAS: 'REV',
    'GRAN FORMATO': 'GFO',
    EXPOSITORES: 'EXP',
    'ARTICULOS PROMOCIONALES': 'MKT',
    EMBAJALES: 'EMP',
    IDENTIFICACION: 'IDE',
  },
  var_map: {},
  categoria_field: 'Categoria',
  grupo_field: 'Grupo',
  var_field: '',
  sku_field: 'SKU',
  id_padding: 3,
};

function cleanText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toUpperCase().split(/\\s+/).filter(Boolean).join(' ');
}

function normalizeKey(value) {
  const text = cleanText(value);
  if (!text) {
    return '';
  }
  return text
    .normalize('NFKD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\\s+/)
    .filter(Boolean)
    .join(' ');
}

function compactCode(value) {
  const text = cleanText(value)
    .normalize('NFKD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/-/g, ' ');
  return text.replace(/\\s+/g, '').replace(/[^A-Z0-9]/g, '');
}

function fieldToText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = fieldToText(item);
      if (text) {
        return text;
      }
    }
    return '';
  }
  if (typeof value === 'object') {
    if (typeof value.name === 'string' && value.name.trim()) {
      return cleanText(value.name);
    }
    if (typeof value.primaryFieldValue === 'string' && value.primaryFieldValue.trim()) {
      return cleanText(value.primaryFieldValue);
    }
    return '';
  }
  return cleanText(value);
}

function mapToken(value, mapping, optional) {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return optional ? '' : null;
  }
  if (Object.prototype.hasOwnProperty.call(mapping, normalized)) {
    return compactCode(mapping[normalized]);
  }
  const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (!key) {
      continue;
    }
    if (normalized.startsWith(key) || normalized.includes(key)) {
      return compactCode(mapping[key]);
    }
  }
  return optional ? compactCode(normalized) : null;
}

const categoryValue = fieldToText(row[config.categoria_field]);
const groupValue = fieldToText(row[config.grupo_field]);
const variantValue = config.var_field ? fieldToText(row[config.var_field]) : '';

const typeCode = mapToken(categoryValue, config.type_map, false);
if (!typeCode) {
  return {
    json: {
      ...row,
      routeIndex: 0,
      sync_error: 'Categoria invalida o no mapeada para generar SKU.',
    },
  };
}

const variantCode = mapToken(variantValue, config.var_map, true) || '';
const categoryPrefix = compactCode(typeCode);

return {
  json: {
    ...row,
    routeIndex: 1,
    category_prefix: categoryPrefix,
    group_value: groupValue,
    id_padding: config.id_padding,
    latest_sku_formula: 'AND({SKU}!="", FIND("' + categoryPrefix + '", {SKU}) = 1)',
  },
};
      `,
    },
  },
  output: [
    {
      id: 'rec_test_001',
      Producto: 'Tarjeta Premium',
      Categoria: 'Corporativo',
      Grupo: 'Tarjetas Personales',
      airtable_record_id: 'rec_test_001',
      routeIndex: 1,
      category_prefix: 'COR',
      group_value: 'TARJETAS PERSONALES',
      id_padding: 3,
      latest_sku_formula: 'AND({SKU}!="", FIND("COR", {SKU}) = 1)',
      sync_error: '',
    },
  ],
});

const prefixRoute = switchCase({
  version: 3.4,
  config: {
    name: 'Prefix Route',
    position: [1420, 480],
    parameters: {
      mode: 'expression',
      numberOutputs: 2,
      output: expr('{{ $json.routeIndex }}'),
    },
  },
});

const fetchLatestSkuForPrefix = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch Latest SKU For Prefix',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [1700, 580],
    parameters: {
      method: 'GET',
      url: 'https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          {
            name: 'pageSize',
            value: '100',
          },
          {
            name: 'filterByFormula',
            value: expr('{{ $json.latest_sku_formula }}'),
          },
        ],
      },
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
      records: [
        {
          id: 'rec_existing_001',
          fields: {
            SKU: 'CORTAR007',
          },
        },
      ],
    },
  ],
});

const computeCandidateSku = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compute Candidate SKU',
    position: [1980, 580],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `
const response = $input.item.json;
const base = $('Build SKU Prefix').item.json;
const records = Array.isArray(response.records) ? response.records : [];

function compactCode(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/-/g, ' ')
    .replace(/\\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function parseNumericSuffix(sku, prefix) {
  const compactSku = compactCode(sku);
  if (!compactSku.startsWith(prefix)) {
    return null;
  }
  const suffix = compactSku.slice(prefix.length);
  return /^\\d+$/.test(suffix) ? Number(suffix) : null;
}

function groupKey(value) {
  const compact = compactCode(value);
  return compact || '';
}

function splitWords(value) {
  return normalizeKey(value).split(' ').filter(Boolean);
}

function abbreviateGroupBase(value) {
  const words = splitWords(value);
  if (words.length === 0) {
    return '';
  }
  if (words.length === 1) {
    return words[0].slice(0, 3);
  }
  return words.slice(0, 3).map((word) => word[0]).join('');
}

function abbreviateGroupVariant(value, variantIndex) {
  const words = splitWords(value);
  if (words.length === 0) {
    return '';
  }
  if (variantIndex === 0) {
    return abbreviateGroupBase(value);
  }
  if (words.length === 1) {
    return words[0].slice(0, Math.min(words[0].length, 3 + variantIndex));
  }
  const initials = words.slice(0, Math.min(words.length, 3 + variantIndex)).map((word) => word[0]).join('');
  if (words.length > 3 && initials.length >= 3 + variantIndex) {
    return initials;
  }
  const extra = words[0].slice(1, 1 + Math.max(1, variantIndex));
  return compactCode(initials + extra);
}

function extractSubCode(sku, categoryPrefix) {
  const compactSku = compactCode(sku);
  if (!compactSku.startsWith(categoryPrefix)) {
    return '';
  }
  const remainder = compactSku.slice(categoryPrefix.length);
  const match = remainder.match(/^([A-Z]*?)(\\d+)$/);
  if (!match) {
    return '';
  }
  return match[1] || '';
}

const currentGroupKey = groupKey(base.group_value);
const usedSubcodesByGroup = new Map();
const usedSubcodes = new Set();

for (const record of records) {
  const skuValue = typeof record?.fields?.SKU === 'string' ? record.fields.SKU.trim() : '';
  const subCode = extractSubCode(skuValue, base.category_prefix);
  const existingGroupValue =
    typeof record?.fields?.Grupo === 'string'
      ? record.fields.Grupo.trim()
      : typeof record?.fields?.Grupo?.name === 'string'
        ? record.fields.Grupo.name.trim()
        : '';
  const existingGroupKey = groupKey(existingGroupValue);
  if (subCode) {
    usedSubcodes.add(subCode);
    if (existingGroupKey) {
      if (!usedSubcodesByGroup.has(existingGroupKey)) {
        usedSubcodesByGroup.set(existingGroupKey, new Set());
      }
      usedSubcodesByGroup.get(existingGroupKey).add(subCode);
    }
  }
}

let subCode = '';
let groupResolutionError = '';

if (currentGroupKey) {
  const existingSubcodesForGroup = Array.from(usedSubcodesByGroup.get(currentGroupKey) ?? []);
  if (existingSubcodesForGroup.length > 0) {
    existingSubcodesForGroup.sort((a, b) => a.length - b.length || a.localeCompare(b));
    subCode = existingSubcodesForGroup[0];
  } else {
    for (let variantIndex = 0; variantIndex < 10; variantIndex += 1) {
      const candidateSubCode = abbreviateGroupVariant(base.group_value, variantIndex);
      if (!candidateSubCode) {
        continue;
      }
      if (!usedSubcodes.has(candidateSubCode)) {
        subCode = candidateSubCode;
        break;
      }
    }
    if (!subCode) {
      groupResolutionError = 'No se pudo derivar una abreviacion unica para Grupo.';
    }
  }
}

const skuPrefix = compactCode(base.category_prefix + subCode);

let latestNumber = 0;
let latestSku = '';
for (const record of records) {
  const skuValue = typeof record?.fields?.SKU === 'string' ? record.fields.SKU.trim() : '';
  const suffixNumber = parseNumericSuffix(skuValue, skuPrefix);
  if (suffixNumber !== null && suffixNumber > latestNumber) {
    latestNumber = suffixNumber;
    latestSku = skuValue;
  }
}

const nextId = String(latestNumber + 1).padStart(base.id_padding ?? 3, '0');
const candidateSku = compactCode(skuPrefix + nextId);
const hasExactMatch = records.some((record) => compactCode(record?.fields?.SKU ?? '') === candidateSku);

return {
  json: {
    ...base,
    sku_prefix: skuPrefix,
    sub_code: subCode,
    latest_sku_found: latestSku,
    latest_suffix: latestNumber,
    next_id: nextId,
    candidate_sku: candidateSku,
    candidate_formula: '{SKU}="' + candidateSku + '"',
    routeIndex: groupResolutionError ? 0 : hasExactMatch ? 0 : 1,
    sync_error: groupResolutionError || (hasExactMatch
      ? 'El SKU candidato ya existe dentro del prefijo actual en Airtable.'
      : ''),
  },
};
      `,
    },
  },
  output: [
    {
      airtable_record_id: 'rec_test_001',
      category_prefix: 'COR',
      group_value: 'TARJETAS PERSONALES',
      sku_prefix: 'CORTP',
      sub_code: 'TP',
      latest_sku_found: 'CORTP007',
      latest_suffix: 7,
      next_id: '008',
      candidate_sku: 'CORTP008',
      candidate_formula: '{SKU}="CORTP008"',
      routeIndex: 1,
      sync_error: '',
    },
  ],
});

const candidateRoute = switchCase({
  version: 3.4,
  config: {
    name: 'Candidate Route',
    position: [2820, 580],
    parameters: {
      mode: 'expression',
      numberOutputs: 2,
      output: expr('{{ $json.routeIndex }}'),
    },
  },
});

const writeSkuError = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write SKU Error',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [1140, 160],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '{{ ({ fields: { "SKU Estado": "Error", "SKU Error": $json.sync_error || "Error al generar SKU.", "SKU Ult Gen": $now.toISO(), "SKU Sync": false }, typecast: true }) }}',
      ),
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
      id: 'rec_test_001',
      fields: {
        'SKU Estado': 'Error',
        'SKU Error': 'Categoria invalida o no mapeada para generar SKU.',
      },
    },
  ],
});

const writeSkuSkipped = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write SKU Skipped',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [1140, 320],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '{{ ({ fields: { "SKU Estado": "Omitido", "SKU Error": $json.skip_reason || "Registro omitido.", "SKU Ult Gen": $now.toISO(), "SKU Sync": false }, typecast: true }) }}',
      ),
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
      id: 'rec_test_001',
      fields: {
        'SKU Estado': 'Omitido',
        'SKU Error': 'Registro omitido porque ya tiene SKU.',
      },
    },
  ],
});

const writeSkuSuccess = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Write SKU Success',
    credentials: {
      airtableTokenApi: newCredential('CatalogOS'),
    },
    position: [3100, 640],
    parameters: {
      method: 'PATCH',
      url: expr('https://api.airtable.com/v0/appaM2jqwYMS6fbiY/Productos/{{ $json.airtable_record_id }}'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'airtableTokenApi',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr(
        '{{ ({ fields: { "SKU": $json.candidate_sku, "SKU Estado": "Generado", "SKU Error": "", "SKU Ult Gen": $now.toISO(), "SKU Sync": false }, typecast: true }) }}',
      ),
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
      id: 'rec_test_001',
      fields: {
        SKU: 'CORTP008',
        'SKU Estado': 'Generado',
        'SKU Error': '',
      },
    },
  ],
});

export default workflow('airtable-generate-skus', 'Airtable-Generate-SKUs')
  .add(airtableSkuTrigger)
  .to(
    preflightSkuRecord.to(
      preflightRoute
        .onCase(0, writeSkuError)
        .onCase(1, writeSkuSkipped)
        .onCase(
          2,
          buildSkuPrefix.to(
            prefixRoute
              .onCase(0, writeSkuError)
              .onCase(
                1,
                fetchLatestSkuForPrefix.to(
                  computeCandidateSku.to(
                    candidateRoute
                      .onCase(0, writeSkuError)
                      .onCase(1, writeSkuSuccess),
                  ),
                ),
              ),
          ),
        ),
    ),
  );
