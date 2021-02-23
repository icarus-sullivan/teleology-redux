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

export const createAsyncActions = (map) => {
  const types = {};
  const actions = {};
  for (const [name, value] of Object.entries(map)) {
    if (typeof value !== 'function') {
      throw new Error('value of key-value must be async function');
    }

    const type = screamingSnake(name);

    actions[name] = (...args) => async (dispatch) => {
      try {
        dispatch({ type, arguments: args, loading: true });
        const res = await value(...args);
        if (Array.isArray(res) || typeof res !== 'object') {
          dispatch({ type: `${type}_SUCCESS`,  result: res });
        } else {
          dispatch({ type: `${type}_SUCCESS`, ...res });
        }
      } catch (e) {
        dispatch({ type: `${type}_FAILED`, error: e });
      } finally {
        dispatch({ type: `${type}_DONE`, loading: false });
      }
    };

    types[type] = type;
    types[`${type}_DONE`] = `${type}_DONE`;
    types[`${type}_SUCCESS`] = `${type}_SUCCESS`;
    types[`${type}_FAILED`] = `${type}_FAILED`;
  }

  return {
    types,
    actions,
  };
};

export const mergeActions = (...actions) =>
  actions.filter(Boolean).reduce(
    (a, { types = {}, actions = {} }) => ({
      types: { ...a.types, ...types },
      actions: { ...a.actions, ...actions },
    }),
    { types: {}, actions: {} },
  );
