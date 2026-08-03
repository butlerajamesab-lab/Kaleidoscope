const UNSUPPORTED = new Set(['undefined', 'function', 'symbol', 'bigint']);

function normalize(value, path = '$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`Non-finite number at ${path}`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (UNSUPPORTED.has(typeof value)) throw new TypeError(`Unsupported ${typeof value} at ${path}`);
  if (Array.isArray(value)) return value.map((item, index) => normalize(item, `${path}[${index}]`));
  if (typeof value === 'object') {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      if (typeof value[key] === 'undefined') throw new TypeError(`Undefined value at ${path}.${key}`);
      output[key] = normalize(value[key], `${path}.${key}`);
    }
    return output;
  }
  throw new TypeError(`Unsupported value at ${path}`);
}

export function canonicalize(value) {
  return JSON.stringify(normalize(value));
}

export function canonicalValue(value) {
  return JSON.parse(canonicalize(value));
}
