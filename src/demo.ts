import {
  countInstances,
  logAccess,
  logContext,
  logInitialFieldValue,
  logInstanceCreation,
  rangeValidation,
  timeMethod,
} from "./decorators.js";
//} from "./decorators.ts"; // use this line when running "deno demo.ts"

@logInstanceCreation
@logContext
@countInstances
export class MyClass {
  //@logContext
  @logInitialFieldValue
  sport = "football";

  #foo = 1;

  //@logContext
  get foo() {
    return this.#foo;
  }

  //@logContext
  set foo(value) {
    this.#foo = value;
  }

  // The "accessor" keyword create auto-accessors.
  // It is defined in the TC39 "Decorators" proposal
  // which is at stage 3 as of 12/23/2025.
  // See https://github.com/tc39/proposal-decorators#class-auto-accessors.
  //@logContext
  @logAccess
  accessor count = 0;

  //@logContext
  @timeMethod
  increment() {
    this.count++;
    //console.log("count =", this.count);
  }

  logCount() {
    console.log("MyClass.log: count =", this.count);
  }
}

let mc = new MyClass();
mc.increment();
mc.increment();
mc.logCount();
mc = new MyClass();
mc = new MyClass();
console.log("MyClass.instanceCount =", (MyClass as any).instanceCount);

@countInstances
export class Dog {
  name = "";

  @logAccess
  @rangeValidation(0, 20)
  accessor age = 0;

  constructor(name: string) {
    this.name = name;
  }
}

const dog = new Dog("Comet");
console.log(dog.age);
dog.age = 5;
console.log(dog.age);
//dog.age = 50; // This throws.

const comet = new Dog("Comet");
const dogs = [new Dog("Ramsay"), new Dog("Oscar"), comet, new Dog("Greta")];
console.log("dogs.length =", dogs.length);
console.log("Dog.instanceCount =", (Dog as any).instanceCount);

function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

class MathLab {
  @timeMethod
  static fibonacci(n: number): number {
    return fib(n);
  }
}

console.log("fibonacci(20) =", MathLab.fibonacci(20));
