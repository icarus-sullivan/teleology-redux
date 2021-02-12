import { createStore as original, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { createMiddlewares } from './middleware';
import defaultPersistLayer from './persist';

const DEFAULT_OPTIONS = {
  middlewares: [],
  persist: true,
  devtools: false,
  state: {},
};

const DEFAULT_REDUCER = (s) => s || null;

export const createStore = (options = {}) => {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Make sure we use the default persistance layer
  if (opts.persist && !opts.persistLayer) {
    opts.persistLayer = defaultPersistLayer;
  }

  if (opts.persistLayer) {
    opts.state = opts.persistLayer.restore();
  }

  // This is due to peristance layer trying to create state - spoof reducers until they 
  // are dynamically created
  const spoofs = Object.assign({}, opts.state || {});
  const spoofedReducers = Object.keys(opts.state || {}).reduce((a, k) => (a[k] = DEFAULT_REDUCER, a), {});
  const sagas = {};
  const reducers = { ...spoofedReducers, __core: DEFAULT_REDUCER };
  const combined = (s, a) => combineReducers(reducers)(s, a);

  const sagaMiddleware = createSagaMiddleware();
  const store = original(
    combined,
    opts.state,
    createMiddlewares(opts, sagaMiddleware, ...opts.middlewares),
  );

  store.attachSaga = ({ key, saga }) => {
    if (!sagas[key]) {
      sagas[key] = saga;
      sagaMiddleware.run(sagas[key]);
    }
  };

  store.attachReducer = ({ key, reducer }) => {
    // We have a spoofed reducer, replace it with the dynamic one
    if (spoofs[key]) {
      delete spoofs[key];
      reducers[key] = reducer;
    }

    if (!reducers[key]) {
      reducers[key] = reducer;
    }
  };

  if (opts.persistLayer) {
    store.subscribe(() => opts.persistLayer.save(store.getState()));
  }

  return store;
};
