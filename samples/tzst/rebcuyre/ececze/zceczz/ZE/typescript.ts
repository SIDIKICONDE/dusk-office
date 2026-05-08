/**
 * Advanced TypeScript: generics, conditional types, mapped types, template literals.
 */

// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;
type ButtonEvents = EventName<"click" | "hover" | "focus">; // "onClick" | "onHover" | "onFocus"

// Mapped types with remapping
type Getters<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
};

type User = { id: number; name: string; email: string };
type UserGetters = Getters<User>; // { getId: () => number; getName: () => string; getEmail: () => string }

// Conditional types with infer
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type UnwrappedResult = UnwrapPromise<Promise<string>>; // string

type Unarray<T> = T extends (infer U)[] ? U : T;
type Item = Unarray<number[]>; // number

// Recursive types
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Variadic tuple types
type Tail<T extends unknown[]> = T extends [infer _, ...infer Rest] ? Rest : never;
type Last<T extends unknown[]> = T extends [...infer _, infer L] ? L : never;

// Brand types for nominal typing
type Brand<T, B> = T & { readonly __brand: B };
type UserId = Brand<number, "UserId">;
type OrderId = Brand<number, "OrderId">;

const userId = 1 as UserId;
const orderId = 2 as OrderId;
// userId === orderId; // Error: Type 'OrderId' is not comparable to type 'UserId'

// Exhaustive pattern matching with discriminated unions
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw result.error;
}

// Async generator with type inference
async function* streamLines(path: string): AsyncGenerator<string, void, unknown> {
  const { open } = await import("node:fs/promises");
  const file = await open(path);
  for await (const line of file.readLines()) {
    yield line;
  }
}

// Decorator factory (stage 3)
function sealed(constructor: Function): void {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

function enumerable(value: boolean) {
  return function (_: unknown, context: ClassFieldDecoratorContext) {
    context.addInitializer(function () {
      Object.defineProperty(this, context.name, { enumerable: value });
    });
  };
}

@sealed
class Container<T extends object> {
  #data: Map<string, T>;
  readonly created = new Date();

  @enumerable(false)
  private internal = false;

  constructor(entries: [string, T][]) {
    this.#data = new Map(entries);
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.#data.get(key as string) as T[K] | undefined;
  }

  set<K extends keyof T>(key: K, value: T[K]): this {
    this.#data.set(key as string, value as T);
    return this;
  }
}

// Type-level programming: ParseInt
type ParseInt<T extends string> = T extends `${infer D extends number}`
  ? D
  : never;

type Int = ParseInt<"42">; // 42

// Currying with type inference
declare function curry<A, B, C>(fn: (a: A, b: B) => C): (a: A) => (b: B) => C;
declare function curry<A, B, C, D>(
  fn: (a: A, b: B, c: C) => D
): (a: A) => (b: B) => (c: C) => D;

export type { ButtonEvents, Container, DeepPartial, DeepReadonly, Getters, Result, UserId };
export { curry, streamLines, unwrap };
