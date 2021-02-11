const { createStore, createActions, createReducer } = require('./lib');
const { takeEvery, put } = require('redux-saga/effects');

const mockPeristLayer = {
  save: (state) => {
    console.log('saving', state);
  },
  restore: () => ({})
};

const store = createStore({
  persistLayer: mockPeristLayer,
});

const { types, actions } = createActions({
  test: ['arg1'],
  folk: { foo: 'bar' },
});

const reducer = createReducer({
  [types.TEST]: (state, { arg1 }) => ({
    arg1,
  }),
});

store.attachReducer({ key: 't', reducer });
store.attachReducer({ key: 'z', reducer: createReducer({
  [types.FOLK]: (state, d) => d,
}) });

function* testOut(act) {
  yield put(actions.folk({ greeting: act.arg1 }));
}

store.attachSaga({ 
  key: 'z', 
  saga: function*() { 
    yield takeEvery(types.TEST, testOut); 
  }
});

store.dispatch(actions.test('hello'));