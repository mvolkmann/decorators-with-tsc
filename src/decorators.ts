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

export function logContext(target: any, context: DecoratorContext) {
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

export function logAccess<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  { kind, name }: ClassAccessorDecoratorContext<This, Value>
) {
  if (kind !== "accessor") {
    throw new Error(
      "This decorator can only be applied to " +
        'a property with the "accessor" keyword.'
    );
  }
  const nameString = String(name); // name is a Symbol
  return {
    get(this: This) {
      const value = target.get.call(this);
      console.log(`Getting ${nameString} property value ${value}.`);
      return value;
    },
    set(this: This, value: Value) {
      console.log(`Setting ${nameString} property to ${value}.`);
      target.set.call(this, value);
    },
  };
}

export function timeMethod<This, Return>(
  originalMethod: (this: This, ...args: any[]) => Return,
  { kind, name }: ClassMethodDecoratorContext<This>
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
  return function <This, Value extends number>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    function validate(newValue: Value) {
      if (newValue < min || newValue > max) {
        const name = String(context.name);
        throw new Error(
          `${name} ${newValue} is outside range ${min} to ${max}`
        );
      }
      return newValue;
    }

    return {
      init(initialValue: Value): Value {
        return validate(initialValue);
      },
      set(this: This, newValue: Value) {
        validate(newValue);
        target.set.call(this, newValue); // Call the original underlying setter
      },
    };
  };
}
