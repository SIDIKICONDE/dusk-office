/**
 * Advanced ESM: decorators, proxies, generators, async patterns.
 */

// Decorator pattern (stage 3)
const logged = (fn, context) => {
  return function (...args) {
    console.log(`[call] ${context.name}`, args);
    return fn.apply(this, args);
  };
};

// Proxy with traps
const reactive = (target) =>
  new Proxy(target, {
    get(obj, key) {
      track(key);
      return Reflect.get(obj, key);
    },
    set(obj, key, val) {
      trigger(key);
      return Reflect.set(obj, key, val);
    },
  });

// Generator with yield*
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

function* fibonacci(n) {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Async iterator
async function* fetchPages(urls) {
  for (const url of urls) {
    const res = await fetch(url);
    yield res.json();
  }
}

// Pipeline operator (proposal)
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const process = pipe(
  (s) => s.trim(),
  (s) => s.toUpperCase(),
  (s) => `[${s}]`
);

// Private class fields with accessors
class Observable {
  #value;
  #subscribers = new Set();

  get value() {
    return this.#value;
  }

  set value(v) {
    this.#value = v;
    this.#notify();
  }

  subscribe(fn) {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  #notify() {
    for (const fn of this.#subscribers) fn(this.#value);
  }
}

// Top-level await with dynamic import
const { randomUUID } = await import("node:crypto");
export const uuid = randomUUID();

// Pattern matching (proposal)
const match = (val) => ({
  when: (cond, fn) => (cond(val) ? fn(val) : match(val)),
  otherwise: (fn) => fn(val),
});

const result = match({ type: "user", id: 42 })
  .when((x) => x.type === "admin", (x) => `admin:${x.id}`)
  .when((x) => x.type === "user", (x) => `user:${x.id}`)
  .otherwise(() => "unknown");

export { Observable, fibonacci, pipe, process, range, reactive };
