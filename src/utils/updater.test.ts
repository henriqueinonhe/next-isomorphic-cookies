import { updatedValueFromUpdater } from "./updater";

describe("When updater is function", () => {
  const setup = () => {
    const oldValue = "Some Value";
    const updater = (value: string) => value.toUpperCase();
    const newValue = updatedValueFromUpdater(oldValue, updater);

    return {
      oldValue,
      updater,
      newValue,
    };
  };

  it("Derives new value by calling updater on old value", () => {
    const { newValue, oldValue, updater } = setup();

    expect(newValue).toBe(updater(oldValue));
  });
});

describe("When updater is NOT a function", () => {
  const setup = () => {
    const oldValue = "Some Value";
    const updater = "New Value";
    const newValue = updatedValueFromUpdater(oldValue, updater);

    return {
      oldValue,
      updater,
      newValue,
    };
  };

  it("Returns updater", () => {
    const { newValue, updater } = setup();

    expect(newValue).toBe(updater);
  });
});
