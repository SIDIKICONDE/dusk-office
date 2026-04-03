// Advanced Swift: async/await, actors, property wrappers, result builders.

import Foundation
import SwiftUI
import Combine
import AsyncAlgorithms

// MARK: - Property Wrappers

@propertyWrapper
struct Cached<T: Codable> {
    private let key: String
    private let storage: UserDefaults
    private var cachedValue: T?
    
    var wrappedValue: T? {
        get {
            if let cached = cachedValue { return cached }
            guard let data = storage.data(forKey: key),
                  let decoded = try? JSONDecoder().decode(T.self, from: data) else {
                return nil
            }
            cachedValue = decoded
            return decoded
        }
        set {
            cachedValue = newValue
            guard let value = newValue,
                  let data = try? JSONEncoder().encode(value) else {
                storage.removeObject(forKey: key)
                return
            }
            storage.set(data, forKey: key)
        }
    }
    
    var projectedValue: Binding<T?> {
        Binding(
            get: { wrappedValue },
            set: { wrappedValue = $0 }
        )
    }
    
    init(wrappedValue: T? = nil, key: String, storage: UserDefaults = .standard) {
        self.key = key
        self.storage = storage
        self.cachedValue = wrappedValue
    }
}

@propertyWrapper
struct MainActorBound<T> {
    private var value: T
    
    @MainActor
    var wrappedValue: T {
        get { value }
        set { value = newValue }
    }
    
    init(wrappedValue: T) {
        self.value = wrappedValue
    }
}

// MARK: - Result Builders

@resultBuilder
enum StringBuilder {
    static func buildBlock(_ components: String...) -> String {
        components.joined()
    }
    
    static func buildOptional(_ component: String?) -> String {
        component ?? ""
    }
    
    static func buildEither(first component: String) -> String {
        component
    }
    
    static func buildEither(second component: String) -> String {
        component
    }
    
    static func buildArray(_ components: [String]) -> String {
        components.joined()
    }
    
    static func buildExpression(_ expression: String) -> String {
        expression
    }
    
    static func buildExpression(_ expression: Int) -> String {
        String(expression)
    }
}

func buildString(@StringBuilder builder: () -> String) -> String {
    builder()
}

// MARK: - Actors

actor DataCache<Key: Hashable, Value> {
    private var storage: [Key: Value] = [:]
    private var accessTimes: [Key: Date] = [:]
    private let maxItems: Int
    
    init(maxItems: Int = 100) {
        self.maxItems = maxItems
    }
    
    func get(_ key: Key) -> Value? {
        accessTimes[key] = Date()
        return storage[key]
    }
    
    func set(_ key: Key, value: Value) {
        if storage.count >= maxItems, storage[key] == nil {
            evictOldest()
        }
        storage[key] = value
        accessTimes[key] = Date()
    }
    
    func remove(_ key: Key) {
        storage.removeValue(forKey: key)
        accessTimes.removeValue(forKey: key)
    }
    
    private func evictOldest() {
        guard let oldest = accessTimes.min(by: { $0.value < $1.value }) else { return }
        storage.removeValue(forKey: oldest.key)
        accessTimes.removeValue(forKey: oldest.key)
    }
}

actor NetworkClient {
    private var activeRequests: [URL: Task<Data, Error>] = [:]
    
    func data(from url: URL) async throws -> Data {
        if let existing = activeRequests[url] {
            return try await existing.value
        }
        
        let task = Task<Data, Error> {
            let (data, _) = try await URLSession.shared.data(from: url)
            return data
        }
        
        activeRequests[url] = task
        defer { activeRequests.removeValue(forKey: url) }
        
        return try await task.value
    }
    
    func cancelAll() {
        activeRequests.values.forEach { $0.cancel() }
        activeRequests.removeAll()
    }
}

// MARK: - Async Sequences

struct ChunkedAsyncSequence<Base: AsyncSequence, Element>: AsyncSequence 
where Base.Element == Element {
    typealias AsyncIterator = Iterator
    typealias Element = [Element]
    
    let base: Base
    let count: Int
    
    struct Iterator: AsyncIteratorProtocol {
        var base: Base.AsyncIterator
        let count: Int
        
        mutating func next() async throws -> [Element]? {
            var chunk: [Element] = []
            while chunk.count < count {
                guard let element = try await base.next() else {
                    return chunk.isEmpty ? nil : chunk
                }
                chunk.append(element)
            }
            return chunk
        }
    }
    
    func makeAsyncIterator() -> Iterator {
        Iterator(base: base.makeAsyncIterator(), count: count)
    }
}

extension AsyncSequence {
    func chunked(into count: Int) -> ChunkedAsyncSequence<Self, Element> {
        ChunkedAsyncSequence(base: self, count: count)
    }
    
    func collect() async throws -> [Element] {
        var result: [Element] = []
        for try await element in self {
            result.append(element)
        }
        return result
    }
}

// MARK: - Opaque Types

protocol Repository {
    associatedtype Entity
    associatedtype ID
    
    func find(id: ID) async throws -> Entity?
    func all() async throws -> some AsyncSequence<Entity, Never>
}

struct UserRepository: Repository {
    struct User: Codable {
        let id: Int
        let name: String
        let email: String
    }
    
    func find(id: Int) async throws -> User? {
        // Fetch from API
        return nil
    }
    
    func all() async throws -> some AsyncSequence<User, Never> {
        async let stream = AsyncStream<User> { continuation in
            // Fetch users
            continuation.finish()
        }
        return stream
    }
}

// MARK: - SwiftUI Integration

@MainActor
final class ViewModel: ObservableObject {
    @Published private(set) var state: State = .loading
    
    @Cached(key: "lastData")
    var cachedData: String?
    
    private let client = NetworkClient()
    private var cancellables = Set<AnyCancellable>()
    
    enum State {
        case loading
        case loaded(String)
        case error(Error)
    }
    
    func load() async {
        state = .loading
        do {
            let data = try await client.data(from: URL(string: "https://api.example.com")!)
            let string = String(data: data, encoding: .utf8) ?? ""
            cachedData = string
            state = .loaded(string)
        } catch {
            state = .error(error)
        }
    }
}

struct ContentView: View {
    @StateObject private var viewModel = ViewModel()
    
    var body: some View {
        VStack {
            switch viewModel.state {
            case .loading:
                ProgressView()
            case .loaded(let data):
                Text(data)
            case .error(let error):
                Text("Error: \(error.localizedDescription)")
            }
        }
        .task {
            await viewModel.load()
        }
    }
}

// MARK: - Protocols with Associated Types

protocol Database {
    associatedtype Connection
    associatedtype Query
    
    func connect() async throws -> Connection
    func execute(_ query: Query, on connection: Connection) async throws -> some AsyncSequence<Row, Error>
}

protocol Row {
    subscript(column: String) -> String? { get }
}

// MARK: - Generics with Constraints

struct Validator<T> {
    let rules: [(T) -> Bool]
    
    func validate(_ value: T) -> ValidationResult {
        for rule in rules {
            if !rule(value) {
                return .invalid("Validation failed")
            }
        }
        return .valid
    }
}

enum ValidationResult {
    case valid
    case invalid(String)
    
    var isValid: Bool {
        if case .valid = self { return true }
        return false
    }
}

extension Validator where T: Collection {
    static func notEmpty() -> Self {
        Validator(rules: [ { !$0.isEmpty } ])
    }
    
    static func minCount(_ count: Int) -> Self {
        Validator(rules: [ { $0.count >= count } ])
    }
}

extension Validator where T: Comparable {
    static func range(_ range: ClosedRange<T>) -> Self {
        Validator(rules: [ { range.contains($0) } ])
    }
}

// MARK: - Pattern Matching

enum NetworkResponse {
    case success(Data)
    case redirect(URL)
    case clientError(Int, String)
    case serverError(Int)
    case timeout
}

func handle(response: NetworkResponse) async throws -> Data {
    switch response {
    case .success(let data):
        return data
    case .redirect(let url):
        return try await fetch(from: url)
    case .clientError(let code, _) where code == 401:
        throw NetworkError.unauthorized
    case .clientError(let code, let message):
        throw NetworkError.clientError(code: code, message: message)
    case .serverError(let code) where code >= 500 && code < 600:
        throw NetworkError.serverError(code: code)
    case .serverError:
        throw NetworkError.unknown
    case .timeout:
        throw NetworkError.timeout
    }
}

enum NetworkError: Error {
    case unauthorized
    case clientError(code: Int, message: String)
    case serverError(code: Int)
    case timeout
    case unknown
}

func fetch(from url: URL) async throws -> Data {
    let (data, _) = try await URLSession.shared.data(from: url)
    return data
}

// MARK: - Main

@main
struct App {
    static func main() async throws {
        let string = buildString {
            "Hello"
            " "
            "World"
            42
        }
        print(string)
        
        let cache = DataCache<String, Int>()
        await cache.set("key", value: 42)
        let value = await cache.get("key")
        print("Cached: \(value ?? 0)")
    }
}
