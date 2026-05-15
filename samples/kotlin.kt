// Advanced Kotlin: coroutines, flows, sealed classes, delegation.

package com.example.advanced

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.channels.*
import kotlin.reflect.KProperty

// Sealed classes for state management
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String, val cause: Throwable? = null) : UiState<Nothing>()
    
    inline fun <R> map(transform: (T) -> R): UiState<R> = when (this) {
        is Loading -> Loading
        is Success -> Success(transform(data))
        is Error -> Error(message, cause)
    }
    
    inline fun onSuccess(action: (T) -> Unit): UiState<T> {
        if (this is Success) action(data)
        return this
    }
    
    inline fun onError(action: (String) -> Unit): UiState<T> {
        if (this is Error) action(message)
        return this
    }
}

// Value classes for type safety
@JvmInline
value class UserId(val value: String)

@JvmInline
value class Email(val value: String) {
    init {
        require(value.contains("@")) { "Invalid email format" }
    }
}

@JvmInline
value class Password(val value: String) {
    init {
        require(value.length >= 8) { "Password must be at least 8 characters" }
    }
}

// Data class with default values and copy
data class User(
    val id: UserId,
    val email: Email,
    val name: String,
    val roles: Set<Role> = emptySet(),
    val metadata: Map<String, Any> = emptyMap(),
) {
    fun hasRole(role: Role): Boolean = role in roles
    
    fun withRole(vararg roles: Role): User = copy(roles = this.roles + roles.toSet())
}

enum class Role {
    ADMIN, EDITOR, VIEWER, GUEST
}

// Generic repository with coroutines
interface Repository<T, ID> {
    suspend fun findById(id: ID): T?
    suspend fun findAll(): List<T>
    suspend fun save(entity: T): T
    suspend fun delete(id: ID): Boolean
    
    fun observeAll(): Flow<List<T>>
}

// Implementation with caching
class CachedRepository<T : Any, ID : Any>(
    private val source: Repository<T, ID>,
    private val cache: MutableMap<ID, T> = mutableMapOf(),
) : Repository<T, ID> by source {
    
    override suspend fun findById(id: ID): T? {
        return cache[id] ?: source.findById(id)?.also { cache[id] = it }
    }
    
    override suspend fun save(entity: T): T {
        return source.save(entity).also { saved ->
            @Suppress("UNCHECKED_CAST")
            cache[(saved as Identifiable<ID>).id] = saved
        }
    }
    
    fun clearCache() = cache.clear()
}

interface Identifiable<ID> {
    val id: ID
}

// Flow operators
fun <T> Flow<T>.throttleFirst(duration: Duration): Flow<T> = flow {
    var lastEmitTime = 0L
    collect { value ->
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastEmitTime >= duration.inWholeMilliseconds) {
            lastEmitTime = currentTime
            emit(value)
        }
    }
}

fun <T> Flow<T>.debounce(timeout: Duration): Flow<T> = flow {
    var job: Job? = null
    val scope = CoroutineScope(Dispatchers.Default)
    
    collect { value ->
        job?.cancel()
        job = scope.launch {
            delay(timeout)
            emit(value)
        }
    }
}

fun <T, R> Flow<T>.flatMapLatest(transform: suspend (T) -> Flow<R>): Flow<R> = 
    channelFlow {
        var latestJob: Job? = null
        collect { value ->
            latestJob?.cancel()
            latestJob = launch {
                transform(value).collect { send(it) }
            }
        }
    }

// Channels for actor pattern
sealed interface CounterMessage {
    data class Increment(val amount: Int = 1) : CounterMessage
    data class Decrement(val amount: Int = 1) : CounterMessage
    data class GetValue(val reply: CompletableDeferred<Int>) : CounterMessage
}

fun CoroutineScope.counterActor(): SendChannel<CounterMessage> {
    return actor {
        var counter = 0
        for (msg in channel) {
            when (msg) {
                is CounterMessage.Increment -> counter += msg.amount
                is CounterMessage.Decrement -> counter -= msg.amount
                is CounterMessage.GetValue -> msg.reply.complete(counter)
            }
        }
    }
}

// Delegation patterns
interface Logger {
    fun log(message: String)
}

class ConsoleLogger : Logger {
    override fun log(message: String) = println("[LOG] $message")
}

class FileLogger(private val path: String) : Logger {
    override fun log(message: String) {
        // Write to file
        println("[FILE:$path] $message")
    }
}

class LoggingRepository<T : Any, ID : Any>(
    private val repository: Repository<T, ID>,
    private val logger: Logger,
) : Repository<T, ID> by repository {
    
    override suspend fun findById(id: ID): T? {
        logger.log("Finding by id: $id")
        return repository.findById(id)
    }
    
    override suspend fun save(entity: T): T {
        logger.log("Saving entity")
        return repository.save(entity)
    }
}

// Property delegation
class ObservableProperty<T>(
    initialValue: T,
    private val onChange: (T) -> Unit = {},
) {
    var value: T = initialValue
        set(newValue) {
            if (field != newValue) {
                field = newValue
                onChange(newValue)
            }
        }
    
    operator fun getValue(thisRef: Any?, property: KProperty<*>): T = value
    
    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        this.value = value
    }
}

class MapBinding(private val map: MutableMap<String, Any?>) {
    operator fun <T> getValue(thisRef: Any?, property: KProperty<*>): T {
        @Suppress("UNCHECKED_CAST")
        return map[property.name] as T
    }
    
    operator fun <T> setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        map[property.name] = value
    }
}

// DSL builder
@DslMarker
annotation class ConfigDsl

@ConfigDsl
class ServerConfigBuilder {
    var host: String = "localhost"
    var port: Int = 8080
    var ssl: Boolean = false
    
    private val features = mutableListOf<String>()
    
    fun feature(name: String) {
        features.add(name)
    }
    
    fun build(): ServerConfig = ServerConfig(host, port, ssl, features.toList())
}

data class ServerConfig(
    val host: String,
    val port: Int,
    val ssl: Boolean,
    val features: List<String>,
)

fun server(block: ServerConfigBuilder.() -> Unit): ServerConfig {
    return ServerConfigBuilder().apply(block).build()
}

// Context receivers (Kotlin 1.6.20+)
context(Logger)
fun <T : Any, ID : Any> Repository<T, ID>.loggedFindById(id: ID): T? {
    log("Finding by id: $id")
    return findById(id)
}

// Inline classes with reified generics
inline fun <reified T : Any> Any.castOrNull(): T? = this as? T

inline fun <reified T : Any> List<*>.filterIsInstanceOrNull(): List<T>? {
    val result = filterIsInstance<T>()
    return if (result.isNotEmpty()) result else null
}

// Coroutines with structured concurrency
class DataSync(
    private val scope: CoroutineScope,
    private val repository: Repository<User, UserId>,
) {
    private var syncJob: Job? = null
    
    fun startSync(interval: Duration) {
        syncJob?.cancel()
        syncJob = scope.launch {
            while (isActive) {
                try {
                    sync()
                } catch (e: Exception) {
                    // Handle error
                }
                delay(interval)
            }
        }
    }
    
    fun stopSync() {
        syncJob?.cancel()
        syncJob = null
    }
    
    private suspend fun sync() {
        repository.findAll()
        // Sync logic
    }
}

// Pattern matching with when
fun describe(value: Any): String = when (value) {
    is String -> "String of length ${value.length}"
    is Int -> "Integer: $value"
    is List<*> -> "List with ${value.size} elements"
    is Map<*, *> -> "Map with ${value.size} entries"
    in 0..10 -> "Small number"
    is User -> "User: ${value.name}"
    else -> "Unknown type: ${value::class.simpleName}"
}

// Main function
suspend fun main() = coroutineScope {
    val config = server {
        host = "api.example.com"
        port = 443
        ssl = true
        feature("compression")
        feature("caching")
    }
    
    println("Server config: $config")
    
    val counter = counterActor()
    counter.send(CounterMessage.Increment(5))
    counter.send(CounterMessage.Decrement(2))
    
    val result = CompletableDeferred<Int>()
    counter.send(CounterMessage.GetValue(result))
    println("Counter: ${result.await()}")
    
    counter.close()
}
