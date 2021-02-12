import { composeWithDevTools } from 'redux-devtools-extension';
import { applyMiddleware } from 'redux';

export const createMiddlewares = (options, ...middlewares) => {
  const applied = applyMiddleware(...middlewares);
  return options.devtools
    ? composeWithDevTools(applied)
    : applied;
}
