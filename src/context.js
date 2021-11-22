class Context extends Map {
  extend(context = new Map()) {
    context.forEach((value, key) => {
      this.set(key, value);
    });
  }
}

class DefaultContext extends Map {
  set() {
    throw new Error('Default context doens`t have set method.');
  }
};

export const defaultContext = new DefaultContext();

export default Context;
