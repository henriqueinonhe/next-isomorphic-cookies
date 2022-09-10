type Brandable = {
  __type: symbol;
};

export const makeWithBrand = <T>() => {
  const __type = Symbol();

  const factoryWrapper = <Args extends Array<unknown>, Return>(
    factory: (...args: Args) => Return
  ) => {
    return (...args: Args) => ({ ...factory(...args), __type });
  };

  const is = (value: unknown): value is T =>
    (value as Brandable).__type === __type;

  return {
    factoryWrapper,
    is,
  };
};
