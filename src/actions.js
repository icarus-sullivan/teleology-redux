const { isAsyncFunction } = require('@teleology/fp');

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

    if (isAsyncFunction(value)) {
      console.log('createing async');
      actions[name] = (...args) => async (dispatch) => {
        try {
          dispatch({ type, arguments: args });
          const res = await value(...args);
          dispatch({ type: `${type}_SUCCESS`, result: res });
        } catch (e) {
          dispatch({ type: `${type}_FAILED`, error: e });
        } finally {
          dispatch({ type: `${type}_DONE` });
        }
      }
      continue;
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
