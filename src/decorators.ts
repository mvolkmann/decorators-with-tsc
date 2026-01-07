export function countInstances<Value extends new (...args: any[]) => {}>(
  target: Value,
  { kind }: ClassDecoratorContext<Value>
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

export function initializerDemo<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
) {
  if (context.kind !== "accessor") {
    throw new Error(
      "This decorator can only be applied to " +
        'a field with the "accessor" keyword.'
    );
  }

  context.addInitializer(() => {
    console.log("running first initializer");
  });
  context.addInitializer(() => {
    console.log("running second initializer");
  });
}

export function logAccess<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  { kind, name }: ClassAccessorDecoratorContext<This, Value>
) {
  if (kind !== "accessor") {
    throw new Error(
      "This decorator can only be applied to " +
        'a field with the "accessor" keyword.'
    );
  }
  const nameString = String(name); // name is a Symbol
  return {
    get(this: This) {
      const value = target.get.call(this);
      console.log(`Getting ${nameString} field value ${value}.`);
      return value;
    },
    set(this: This, value: Value) {
      console.log(`Setting ${nameString} field to ${value}.`);
      target.set.call(this, value);
    },
  };
}

export function logContext(target: any, context: DecoratorContext) {
  console.log("===");
  console.log(context.name, "is a", target.constructor.name);
  console.log("context =", context);
}

export function logInitialFieldValue(
  value: any,
  { kind, name }: ClassFieldDecoratorContext
) {
  if (kind !== "field") {
    throw new Error("This decorator can only be applied to a class field.");
  }
  const nameString = String(name); // name is a Symbol
  console.log(`The initial value of the ${nameString} field is "${value}".`);
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

export function nonNegative<This>(
  target: (value: number) => void,
  context: ClassSetterDecoratorContext<This>
) {
  return function (this: This, newValue: number) {
    if (newValue < 0) {
      const name = String(context.name);
      throw new Error(`${name} cannot be negative`);
    }
    target.call(this, newValue);
  };
}

export function rangeValidation(min: number, max: number) {
  return function <This, Value extends number>(
    target: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>
  ): ClassAccessorDecoratorResult<This, Value> {
    function validate(value: Value) {
      if (value < min || value > max) {
        const name = String(context.name);
        throw new Error(`${name} ${value} is outside range ${min} to ${max}`);
      }
    }

    return {
      init(initialValue: Value): Value {
        validate(initialValue);
        return initialValue;
      },
      set(this: This, newValue: Value) {
        validate(newValue);
        target.set.call(this, newValue); // Call the original underlying setter
      },
    };
  };
}

export function timeMethod<This, Return>(
  originalMethod: (...args: any[]) => Return,
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

// ==== Validator stuff follows =====

// Ensure the metadata global Symbol exists before any classes are loaded.
(Symbol as any).metadata ??= Symbol("Symbol.metadata");

type ValidationRule = {
  validate: (value: any) => boolean;
  message: string;
};

function accessorOrField(context: DecoratorContext) {
  const { kind } = context;
  if (kind !== "accessor" && kind !== "field") {
    throw new Error(
      "This decorator can only be applied to a class accessor or field."
    );
  }
}

function addValidationRule(context: DecoratorContext, rule: ValidationRule) {
  const { metadata } = context;
  let constraints = metadata["constraints"] as Record<string, ValidationRule[]>;
  if (!constraints) constraints = metadata.constraints = {};
  const name = String(context.name);
  constraints[name] ??= [];
  constraints[name].push(rule);
}

export function minLength(len: number) {
  return (_target: unknown, context: DecoratorContext) => {
    accessorOrField(context);
    addValidationRule(context, {
      validate: (v) => typeof v === "string" && v.length >= len,
      message: `${String(context.name)} must be at least ${len} characters`,
    });
  };
}

export function range(min: number, max: number) {
  return (target: unknown, context: DecoratorContext) => {
    accessorOrField(context);
    const name = String(context.name);
    addValidationRule(context, {
      validate: (v) => min <= v && v <= max,
      message: `${name} must be between ${min} and ${max}`,
    });
  };
}

export function regex(pattern: string) {
  return (_target: unknown, context: ClassAccessorDecoratorContext) => {
    accessorOrField(context);
    addValidationRule(context, {
      validate: (v) => new RegExp(pattern).test(v),
      message: `${String(context.name)} must match pattern ${pattern}`,
    });
  };
}

export function required(_target: unknown, context: DecoratorContext) {
  accessorOrField(context);
  addValidationRule(context, {
    validate: (v: unknown) => v !== undefined && v !== null && v !== "",
    message: `${String(context.name)} is required`,
  });
}

// Unlike the rangeValidation decorator factory,
// this approach performs validation on request
// rather than each time a field is set.
export function validate(instance: Record<string, any>) {
  const metadata = instance.constructor[Symbol.metadata] ?? {};
  const constraints = metadata["constraints"] ?? {};
  const errors: string[] = [];
  for (const [prop, rules] of Object.entries(constraints)) {
    const value = instance[prop];
    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(`${rule.message} (value is ${JSON.stringify(value)})`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function accessorLog<This, Value>(
  target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
) {
  if (context.kind !== "accessor") {
    throw new Error(
      "This decorator can only be applied to " +
        'a field with the "accessor" keyword.'
    );
  }

  const name = String(context.name);
  return {
    init(initialValue: Value) {
      console.log(`${name} initial value is ${initialValue}`);
      return initialValue;
    },
    get(this: This) {
      const value = target.get.call(this) as Value;
      console.log(`${name} value = ${value}`);
      return value;
    },
    set(this: This, value: Value) {
      const oldValue = context.access.get(this);
      console.log(`${name} changing from "${oldValue}" to "${value}"`);
      target.set.call(this, value);
    },
  };
}

export function fieldLog<This, Value>(
  target: undefined, // always undefined in field decorators
  context: ClassFieldDecoratorContext<This, Value>
) {
  if (context.kind !== "field") {
    throw new Error("This decorator can only be applied to a field.");
  }
  context.addInitializer(function (this: This) {
    const name = String(context.name);
    const initialValue = context.access.get(this);
    console.log(`${name} initial value is ${initialValue}`);
    if (initialValue === "random") {
      context.access.set(this, String(Math.random()) as Value);
    }
  });
}
