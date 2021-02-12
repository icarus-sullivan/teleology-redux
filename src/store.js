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

  const sagas = {};
  const reducers = { __core: (s) => null };
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
    if (!reducers[key]) {
      reducers[key] = reducer;
    }
  };

  if (opts.persistLayer) {
    store.subscribe(() => opts.persistLayer.save(store.getState()));
  }

  return store;
};
