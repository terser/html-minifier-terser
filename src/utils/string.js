export const uniqueId = (value) => {
  let id;

  do {
    id = Math.random().toString(36).replace(/^0\.[0-9]*/, '');
  } while (~value.indexOf(id));

  return id;
};
