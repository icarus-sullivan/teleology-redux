const save = (state) => (localStorage._s = JSON.stringify(state || {}));

const restore = () => JSON.parse(localStorage._s || '{}');

export default {
  save,
  restore,
};
