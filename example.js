const { takeEvery, put } = require('redux-saga/effects');
const {
  createStore,
  mergeActions,
  createActions,
  createAsyncActions,
  createReducer,
} = require('./lib');

const mockPeristLayer = {
  save: (state) => {
    console.log('saving', state);
  },
  restore: () => ({}),
};

const logger = (s) => (next) => (action) => {
  console.log('action', action);
  const returnVal = next(action);
  console.log('state when action is dispatched', s.getState());
  return returnVal;
};

const store = createStore({
  persistLayer: mockPeristLayer,
  middleware: [logger],
});

const regular = createActions({
  test: ['arg1'],
  folk: { foo: 'bar' },
  tester: () => ({ type: 'foop' }),
});

const asyncOnes = createAsyncActions({
  stocks: async (id) => [
    {
      id,
      price: '9000',
      currency: '$',
    },
    {
      id,
      price: '9001',
      currency: '$',
    },
    {
      id,
      price: '8999',
      currency: '$',
    },
  ],
});

const { types, actions } = mergeActions(regular, asyncOnes);

const reducer = createReducer({
  [types.TEST]: (state, { arg1 }) => ({
    arg1,
  }),
});

store.attachReducer({ key: 't', reducer });
store.attachReducer({
  key: 'z',
  reducer: createReducer({
    [types.FOLK]: (state, d) => d,
  }),
});

function* testOut(act) {
  yield put(actions.folk({ greeting: act.arg1 }));
}

store.attachSaga({
  key: 'z',
  *saga() {
    yield takeEvery(types.TEST, testOut);
  },
});

store.dispatch(actions.test('hello'));

console.log('actions', actions);
actions.stocks('PRI_d')(store.dispatch);

store.dispatch(actions.tester());
