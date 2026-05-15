"""
Advanced Python: async, descriptors, metaclasses, type system.
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator, Callable, Coroutine
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass, field
from enum import Enum, auto
from functools import cached_property, wraps
from typing import (
    Any,
    ClassVar,
    Final,
    Generic,
    Literal,
    Never,
    ParamSpec,
    Protocol,
    Self,
    TypeGuard,
    TypeVar,
    overload,
    reveal_type,
)

P = ParamSpec("P")
T = TypeVar("T")
T_co = TypeVar("T_co", covariant=True)
T_contra = TypeVar("T_contra", contravariant=True)

# Literal and Never types
Status = Literal["pending", "running", "done", "failed"]
def assert_never(value: Never) -> Never:
    raise AssertionError(f"Expected never, got {value}")

# Protocol with runtime_check
@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> str: ...

# Generic class with bound TypeVar
class Container(Generic[T]):
    __slots__ = ("_value",)
    
    def __init__(self, value: T) -> None:
        self._value = value
    
    def map[U](self, fn: Callable[[T], U]) -> Container[U]:
        return Container(fn(self._value))
    
    def __repr__(self) -> str:
        return f"Container({self._value!r})"

# Descriptor protocol
class Validated[T]:
    def __init__(self, validator: Callable[[Any], T]) -> None:
        self.validator = validator
        self._name: str | None = None
    
    def __set_name__(self, owner: type, name: str) -> None:
        self._name = f"_{name}"
    
    def __get__(self, obj: Any, objtype: type | None = None) -> T | None:
        if obj is None:
            return None
        return getattr(obj, self._name, None)
    
    def __set__(self, obj: Any, value: Any) -> None:
        validated = self.validator(value)
        setattr(obj, self._name, validated)

# Metaclass
class SingletonMeta(type):
    _instances: dict[type, Any] = {}
    
    def __call__[T](cls: type[T], *args: Any, **kwargs: Any) -> T:
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self) -> None:
        self._connected = False
    
    def connect(self) -> None:
        self._connected = True

# Async context manager and iterator
@asynccontextmanager
async def transaction(conn: str) -> AsyncIterator[str]:
    print(f"BEGIN {conn}")
    try:
        yield conn
        print(f"COMMIT {conn}")
    except Exception:
        print(f"ROLLBACK {conn}")
        raise

async def stream_items(n: int) -> AsyncIterator[int]:
    for i in range(n):
        await asyncio.sleep(0.01)
        yield i * 2

# Decorator with ParamSpec
def retry[P, R](
    max_attempts: int = 3,
    delay: float = 0.1,
) -> Callable[[Callable[P, Coroutine[Any, Any, R]]], Callable[P, Coroutine[Any, Any, R]]]:
    def decorator(fn: Callable[P, Coroutine[Any, Any, R]]) -> Callable[P, Coroutine[Any, Any, R]]:
        @wraps(fn)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            last_error: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return await fn(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        await asyncio.sleep(delay)
            raise last_error or RuntimeError("Unknown error")
        return wrapper
    return decorator

# Dataclass with slots and frozen
@dataclass(frozen=True, slots=True, kw_only=True)
class User:
    id: int
    name: str
    roles: tuple[Literal["admin", "editor", "viewer"], ...] = ()
    metadata: dict[str, Any] = field(default_factory=dict)
    
    @cached_property
    def is_admin(self) -> bool:
        return "admin" in self.roles

# Enum with custom behavior
class OpCode(Enum):
    ADD = auto()
    SUB = auto()
    MUL = auto()
    DIV = auto()
    
    def apply(self, a: float, b: float) -> float:
        match self:
            case OpCode.ADD:
                return a + b
            case OpCode.SUB:
                return a - b
            case OpCode.MUL:
                return a * b
            case OpCode.DIV:
                return a / b if b != 0 else float("inf")

# TypeGuard and overload
def is_str_list(value: list[Any]) -> TypeGuard[list[str]]:
    return all(isinstance(x, str) for x in value)

@overload
def process(value: int) -> str: ...
@overload
def process(value: str) -> int: ...
def process(value: int | str) -> str | int:
    if isinstance(value, int):
        return str(value)
    return int(value)

# Match statement with patterns
def describe(obj: object) -> str:
    match obj:
        case {"type": "user", "id": int(id), **rest}:
            return f"User {id} with {len(rest)} extra fields"
        case [first, *middle, last]:
            return f"List with {first}, ..., {last}"
        case int(x) if x > 0:
            return f"Positive integer: {x}"
        case int(x):
            return f"Non-positive integer: {x}"
        case _:
            return "Unknown"

# Abstract base class with Self
class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...
    
    @abstractmethod
    def scale(self, factor: float) -> Self: ...

class Circle(Shape):
    def __init__(self, radius: float) -> None:
        self.radius = radius
    
    def area(self) -> float:
        return 3.14159 * self.radius ** 2
    
    def scale(self, factor: float) -> Self:
        return Circle(self.radius * factor)

# Main async entry point
async def main() -> None:
    async with transaction("db:main"):
        async for item in stream_items(5):
            print(f"Item: {item}")

if __name__ == "__main__":
    asyncio.run(main())
