const CAPS = /[A-Z]/g;
const SPECIAL_CHARS_REGEX = /[^A-Z0-9_]/gi;

const screamingSnake = (it) =>
  it
    .replace(CAPS, (f, i) => (i !== 0 ? `_${f}` : f))
    .replace(SPECIAL_CHARS_REGEX, '')
    .toUpperCase();

export const createReducer = (map) => (state, action = {}) => {
  const { type, ...rest } = action;
  const handler = map[type];
  if (handler) {
    return handler(state, rest) || null;
  }
  return state || null;
};

export const createActions = (map) => {
  const types = {};
  const actions = {};
  for (const [name, value] of Object.entries(map)) {
    const type = screamingSnake(name);

    if (!value) {
      actions[name] = () => ({ type });
    }

    if (Array.isArray(value)) {
      actions[name] = (...args) =>
        args.reduce((a, b, i) => ({ ...a, [value[i]]: b }), { type });
    }

    if (value && typeof value === 'object' && value.constructor === Object) {
      actions[name] = (args) => ({ type, ...value, ...args });
    }

    if (typeof value === 'function') {
      actions[name] = value;
      continue;
    }

    types[type] = type;
  }

  return {
    types,
    actions,
  };
};
