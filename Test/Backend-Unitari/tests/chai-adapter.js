// Adapter per far funzionare i test Chai con Jest
const chai = {
  expect: (value) => {
    const jestExpect = expect(value);
    
    return {
      to: {
        be: {
          true: () => jestExpect.toBe(true),
          false: () => jestExpect.toBe(false),
          undefined: () => jestExpect.toBeUndefined(),
          null: () => jestExpect.toBeNull(),
          a: (type) => {
            if (type === 'function') return jestExpect.toBeInstanceOf(Function);
            if (type === 'string') return jestExpect.toBeString();
            if (type === 'number') return jestExpect.toBeNumber();
            if (type === 'object') return jestExpect.toBeObject();
            if (type === 'array') return jestExpect.toBeArray();
            return jestExpect.toBe(type);
          }
        },
        equal: (expected) => jestExpect.toBe(expected),
        deep: {
          equal: (expected) => jestExpect.toEqual(expected)
        },
        include: (expected) => {
          if (typeof value === 'object' && value !== null) {
            return jestExpect.toMatchObject(expected);
          }
          return jestExpect.toContain(expected);
        },
        have: {
          property: (prop) => jestExpect.toHaveProperty(prop),
          lengthOf: (length) => jestExpect.toHaveLength(length)
        },
        contain: (item) => jestExpect.toContain(item)
      }
    };
  }
};

module.exports = chai; 