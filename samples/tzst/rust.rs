//! Advanced Rust: async, lifetimes, traits, macros, unsafe.

use std::{
    collections::HashMap,
    fmt::{self, Display},
    future::Future,
    marker::PhantomData,
    ops::{Deref, DerefMut},
    pin::Pin,
    sync::Arc,
};

// Type alias and newtype pattern
pub type Id = u64;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(pub Id);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OrderId(pub Id);

// Generic struct with lifetime and const generic
pub struct Buffer<'a, T, const N: usize> {
    data: &'a mut [T; N],
    len: usize,
}

impl<'a, T, const N: usize> Buffer<'a, T, N> {
    pub fn new(data: &'a mut [T; N]) -> Self {
        Self { data, len: 0 }
    }

    pub fn push(&mut self, item: T) -> Result<(), T> {
        if self.len < N {
            self.data[self.len] = item;
            self.len += 1;
            Ok(())
        } else {
            Err(item)
        }
    }
}

// Trait with associated types and bounds
pub trait Repository {
    type Entity;
    type Error: std::error::Error;

    fn find(&self, id: Id) -> impl Future<Output = Result<Self::Entity, Self::Error>> + Send;
    fn save(&mut self, entity: Self::Entity) -> impl Future<Output = Result<Id, Self::Error>> + Send;
}

// Trait object with dynamic dispatch
pub trait DynRepository {
    fn find(&self, id: Id) -> Pin<Box<dyn Future<Output = Result<Box<dyn Any>, Box<dyn std::error::Error>>> + Send>>;
}

// Generic trait with lifetime
pub trait Serialize<'a> {
    fn serialize(&'a self) -> Vec<u8>;
}

// Marker trait and phantom data
pub trait Validated {}
pub trait Pending {}

pub struct Stateful<T, S> {
    inner: T,
    _state: PhantomData<S>,
}

impl<T> Stateful<T, Pending> {
    pub fn new(inner: T) -> Self {
        Self {
            inner,
            _state: PhantomData,
        }
    }

    pub fn validate(self) -> Stateful<T, Validated>
    where
        T: Validate,
    {
        self.inner.validate();
        Stateful {
            inner: self.inner,
            _state: PhantomData,
        }
    }
}

pub trait Validate {
    fn validate(&self);
}

// Smart pointer with Deref/DerefMut
pub struct Owned<T>(T);

impl<T> Deref for Owned<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<T> DerefMut for Owned<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

// Enum with variants containing different types
#[derive(Debug, Clone)]
pub enum Value {
    Null,
    Bool(bool),
    Int(i64),
    Float(f64),
    String(Arc<str>),
    Array(Vec<Value>),
    Object(HashMap<Arc<str>, Value>),
}

impl Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Value::Null => write!(f, "null"),
            Value::Bool(b) => write!(f, "{}", b),
            Value::Int(i) => write!(f, "{}", i),
            Value::Float(fl) => write!(f, "{}", fl),
            Value::String(s) => write!(f, "\"{}\"", s),
            Value::Array(a) => {
                write!(f, "[")?;
                for (i, v) in a.iter().enumerate() {
                    if i > 0 {
                        write!(f, ", ")?;
                    }
                    write!(f, "{}", v)?;
                }
                write!(f, "]")
            }
            Value::Object(o) => {
                write!(f, "{{")?;
                for (i, (k, v)) in o.iter().enumerate() {
                    if i > 0 {
                        write!(f, ", ")?;
                    }
                    write!(f, "\"{}\": {}", k, v)?;
                }
                write!(f, "}}")
            }
        }
    }
}

// Lifetime annotations with bounds
pub fn longest<'a, 'b: 'a>(x: &'a str, y: &'b str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Higher-ranked trait bounds (HRTB)
pub fn for_any<F>(f: F) -> bool
where
    F: for<'a> Fn(&'a str) -> bool,
{
    f("test")
}

// Closure traits
pub fn apply<F, T, U>(value: T, f: F) -> U
where
    F: FnOnce(T) -> U,
{
    f(value)
}

pub fn apply_mut<F, T>(value: &mut T, f: F)
where
    F: FnOnce(&mut T),
{
    f(value);
}

// Async function and trait bounds
pub async fn fetch_all<T, I>(urls: I) -> Vec<Result<String, reqwest::Error>>
where
    I: IntoIterator<Item = String>,
    I::IntoIter: Send,
{
    let client = reqwest::Client::new();
    let futures: Vec<_> = urls
        .into_iter()
        .map(|url| client.get(&url).send())
        .collect();

    futures::future::join_all(futures)
        .await
        .into_iter()
        .map(|r| r?.text().await)
        .collect()
}

// Macro_rules!
#[macro_export]
macro_rules! map {
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut m = HashMap::new();
            $(
                m.insert($key, $value);
            )*
            m
        }
    };
}

// Declarative macro with repetition
#[macro_export]
macro_rules! impl_from {
    ($($from:ty => $to:ty),* $(,)?) => {
        $(
            impl From<$from> for $to {
                fn from(value: $from) -> Self {
                    value as $to
                }
            }
        )*
    };
}

// Procedural macro attribute (declaration only)
#[cfg(feature = "derive")]
#[proc_macro_attribute]
pub fn validate(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

// Unsafe block with raw pointer
pub unsafe fn swap<T>(a: *mut T, b: *mut T) {
    let temp = std::ptr::read(a);
    std::ptr::write(a, std::ptr::read(b));
    std::ptr::write(b, temp);
}

// Unsafe impl of Send/Sync
pub struct RawBox<T>(*mut T);

unsafe impl<T: Send> Send for RawBox<T> {}
unsafe impl<T: Sync> Sync for RawBox<T> {}

// Interior mutability with RefCell pattern
pub struct Cell<T> {
    value: std::cell::UnsafeCell<T>,
}

impl<T> Cell<T> {
    pub fn new(value: T) -> Self {
        Self {
            value: std::cell::UnsafeCell::new(value),
        }
    }

    pub fn get(&self) -> T
    where
        T: Copy,
    {
        unsafe { *self.value.get() }
    }

    pub fn set(&self, value: T) {
        unsafe {
            *self.value.get() = value;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_value_display() {
        let v = Value::Int(42);
        assert_eq!(format!("{}", v), "42");
    }

    #[tokio::test]
    async fn test_async() {
        let result = async { 42 }.await;
        assert_eq!(result, 42);
    }
}
