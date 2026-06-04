const { LocalModel } = require('./localDB');

const wrapModel = (modelName, mongooseModel) => {
  const localInstance = new LocalModel(modelName);

  return new Proxy(mongooseModel, {
    get(target, prop) {
      if (global.useLocalDB) {
        if (typeof localInstance[prop] === 'function') {
          return localInstance[prop].bind(localInstance);
        }
        return localInstance[prop];
      }
      // Delegate to mongoose model
      return target[prop];
    }
  });
};

module.exports = wrapModel;
