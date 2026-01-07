import {
  accessorLog,
  countInstances,
  fieldLog,
  initializerDemo,
  logAccess,
  logContext,
  logInitialFieldValue,
  logInstanceCreation,
  minLength,
  nonNegative,
  range,
  rangeValidation,
  regex,
  required,
  timeMethod,
  validate,
} from "./decorators.js";
//} from "./decorators.ts"; // use this line when running "deno demo.ts"

@logInstanceCreation
@logContext
@countInstances
export class MyClass {
  //@logContext
  @logInitialFieldValue
  sport = "football";

  // The "accessor" keyword create auto-accessors.
  // It is defined in the TC39 "Decorators" proposal
  // which is at stage 3 as of 12/23/2025.
  // See https://github.com/tc39/proposal-decorators#class-auto-accessors.
  //@logContext
  @initializerDemo
  @logAccess
  accessor count = 0;

  #foo = 1;

  //@logContext
  get foo() {
    return this.#foo;
  }

  //@logContext
  set foo(value) {
    this.#foo = value;
  }

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

class SignupForm {
  @required
  @minLength(8)
  username = "";

  constructor(username: string) {
    this.username = username;
  }
}

/*
const badAttempt = new SignupForm("abc");
console.log(validate(badAttempt));
// { valid: false, errors: ["username must be at least 8 characters"] }

const goodAttempt = new SignupForm("super_secure_user");
console.log(validate(goodAttempt));
// { valid: true, errors: [] }
*/

export class Residence {
  @required
  @minLength(3)
  accessor city = "";

  @regex("^[0-9]{5}$")
  accessor zip = "";

  @range(0, 100)
  @accessorLog
  accessor years = 0;

  @fieldLog
  //#secret = "mystery";
  secret = "random";
}

const residence = new Residence();
residence.years = -3;
console.log(validate(residence));
console.log("demo.ts : residence.secret =", residence.secret);

residence.city = "St. Charles";
residence.zip = "63304";
residence.years = 27;
console.log(validate(residence));

/*
const { valid, errors } = validate(residence);
if (valid) {
  console.log("valid residence");
} else {
  console.log("invalid residence", errors);
}
*/

class Game {
  #name = "";
  #score = 0;

  get name() {
    return this.#name;
  }

  /* Can only be applied to a setter.
  @nonNegative
   */
  get score() {
    return this.#score;
  }

  /* Can't be applied to a setter for a property that is not a number.
  @nonNegative
   */
  set name(value) {
    this.#name = value;
  }

  @nonNegative
  set score(value) {
    this.#score = value;
  }
}

const game = new Game();
game.score = 7; // works
game.score = -1; // throws
