export function countInstances<T extends new (...args: any[]) => {}>(
  target: T,
  { kind }: ClassDecoratorContext<T>
) {
  if (kind !== "class") {
    throw new Error("This decorator can only be applied to a class.");
  }
  return class extends target {
    private static _instanceCount = 0;

    constructor(...args: any[]) {
      super(...args);
      (this.constructor as any)._instanceCount++;
    }

    static get instanceCount() {
      return this._instanceCount;
    }
  };
}

export function logContext(target: any, context: any) {
  console.log("===");
  console.log(context.name, "is a", target.constructor.name);
  console.log("context =", context);
}

// The generic type T captures the type of the class being decorated.
export function logInstanceCreation<T extends new (...args: any[]) => {}>(
  target: T,
  { kind, name }: ClassDecoratorContext<T>
) {
  if (kind !== "class") {
    throw new Error("This decorator can only be applied to a class.");
  }
  const nameString = String(name); // name is a Symbol
  return class extends target {
    constructor(...args: any[]) {
      super(...args);
      const time = new Date().toLocaleTimeString();
      console.log(`${nameString} instance created at ${time}.`);
    }
  };
}

export function logInitialFieldValue(
  value: any,
  { kind, name }: ClassFieldDecoratorContext
) {
  if (kind !== "field") {
    throw new Error("This decorator can only be applied to a class field.");
  }
  const nameString = String(name); // name is a Symbol
  console.log(`The initial value of the ${nameString} property is "${value}".`);
}

export function logAccess(
  target: any,
  { kind, name }: ClassAccessorDecoratorContext
) {
  if (kind !== "accessor") {
    throw new Error(
      "This decorator can only be applied to " +
        'a property with the "accessor" keyword.'
    );
  }
  const nameString = String(name); // name is a Symbol
  return {
    get() {
      const value = target.get.call(this);
      console.log(`Getting ${nameString} property value ${value}.`);
      return value;
    },
    set(value: unknown) {
      console.log(`Setting ${nameString} property to ${value}.`);
      target.set.call(this, value);
    },
  };
}

export function timeMethod<This, Return>(
  originalMethod: (this: This, ...args: any[]) => Return,
  { kind, name }: ClassMethodDecoratorContext
) {
  if (kind !== "method") {
    throw new Error("This decorator can only be applied to a method.");
  }
  const nameString = String(name); // name is a Symbol

  return function (this: This, ...args: any[]): Return {
    console.time(nameString);
    const result = originalMethod.call(this, ...args);
    console.timeEnd(nameString);
    return result;
  };
}

export function rangeValidation(min: number, max: number) {
  return (target: any, context: ClassAccessorDecoratorContext) => {
    let value: number;
    return {
      get() {
        return value;
      },
      set(newValue: number) {
        if (newValue < min || newValue > max) {
          const name = String(context.name);
          throw new Error(
            `${name} ${newValue} is outside range ${min} to ${max}`
          );
        }
        value = newValue;
      },
    };
  };
}
