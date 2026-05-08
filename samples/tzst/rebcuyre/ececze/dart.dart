/// Advanced Dart: async, isolates, extensions, generics, Flutter widgets.

import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate' show ReceivePort, Isolate, SendPort;
import 'dart:math' as math;
import 'dart:typed_data';

// Generic class with bounds
class Result<T extends Object> {
  final T? value;
  final String? error;

  const Result.ok(this.value) : error = null;
  const Result.err(this.error) : value = null;

  bool get isOk => value != null;
  bool get isErr => error != null;

  R when<R>({
    required R Function(T value) ok,
    required R Function(String error) err,
  }) {
    if (isOk) return ok(value as T);
    return err(error!);
  }

  Result<R> map<R extends Object>(R Function(T) fn) {
    if (isOk) return Result.ok(fn(value as T));
    return Result.err(error!);
  }
}

// Extension methods
extension StringExtensions on String {
  String capitalize() =>
      isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';

  String reverse() => split('').reversed.join();

  bool get isEmail => RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(this);

  Iterable<String> chunks(int size) sync* {
    for (var i = 0; i < length; i += size) {
      yield substring(i, math.min(i + size, length));
    }
  }
}

extension IterableExtensions<T> on Iterable<T> {
  Iterable<R> mapIndexed<R>(R Function(int index, T element) fn) sync* {
    var i = 0;
    for (final e in this) {
      yield fn(i++, e);
    }
  }

  T? firstWhereOrNull(bool Function(T) test) {
    for (final e in this) {
      if (test(e)) return e;
    }
    return null;
  }

  Iterable<T> separated(T separator) sync* {
    final iter = iterator;
    if (!iter.moveNext()) return;
    yield iter.current;
    while (iter.moveNext()) {
      yield separator;
      yield iter.current;
    }
  }
}

// Mixin with constraints
mixin Debuggable {
  String get debugName;

  void debugPrint() {
    print('[$debugName] ${toString()}');
  }
}

mixin Validatable {
  bool validate();

  void assertValid() {
    if (!validate()) {
      throw StateError('$runtimeType validation failed');
    }
  }
}

// Abstract class with factory constructor
abstract class DataSource {
  Future<Map<String, dynamic>> fetch(String id);

  factory DataSource.local() => LocalDataSource();
  factory DataSource.remote(String baseUrl) => RemoteDataSource(baseUrl);
  factory DataSource.cached(DataSource source) => CachedDataSource(source);
}

class LocalDataSource implements DataSource {
  final Map<String, Map<String, dynamic>> _cache = {};

  @override
  Future<Map<String, dynamic>> fetch(String id) async {
    await Future.delayed(const Duration(milliseconds: 10));
    return _cache[id] ?? (throw StateError('Not found: $id'));
  }
}

class RemoteDataSource implements DataSource {
  final String baseUrl;
  final HttpClient _client = HttpClient();

  RemoteDataSource(this.baseUrl);

  @override
  Future<Map<String, dynamic>> fetch(String id) async {
    final request = await _client.getUrl(Uri.parse('$baseUrl/data/$id'));
    final response = await request.close();
    final body = await response.transform(utf8.decoder).join();
    return json.decode(body) as Map<String, dynamic>;
  }
}

class CachedDataSource implements DataSource {
  final DataSource _source;
  final Map<String, Map<String, dynamic>> _cache = {};

  CachedDataSource(this._source);

  @override
  Future<Map<String, dynamic>> fetch(String id) async {
    if (_cache.containsKey(id)) return _cache[id]!;
    final data = await _source.fetch(id);
    _cache[id] = data;
    return data;
  }
}

// Isolate for parallel processing
Future<List<R>> computeParallel<T, R>(
  List<T> items,
  Future<R> Function(T) compute,
) async {
  final receivePort = ReceivePort();

  await Isolate.spawn(
    (SendPort sendPort) {
      final receivePort = ReceivePort();
      sendPort.send(receivePort.sendPort);

      receivePort.listen((message) {
        if (message is _ComputeRequest<T, R>) {
          compute(message.input).then((result) {
            message.responsePort.send(result);
          });
        }
      });
      }, receivePort.sendPort,
  );

  final completer = Completer<List<R>>();
  final results = <R>[];
  var completed = 0;

  final sendPort = await receivePort.first as SendPort;

  for (final item in items) {
    final responsePort = ReceivePort();
    sendPort.send(_ComputeRequest(item, responsePort.sendPort));

    responsePort.first.then((result) {
      results.add(result as R);
      completed++;
      if (completed == items.length) {
        completer.complete(results);
      }
    });
  }

  return completer.future;
}

class _ComputeRequest<T, R> {
  final T input;
  final SendPort responsePort;

  _ComputeRequest(this.input, this.responsePort);
}

// Stream transformers
class ThrottleTransformer<T> extends StreamTransformerBase<T, T> {
  final Duration duration;

  ThrottleTransformer(this.duration);

  @override
  Stream<T> bind(Stream<T> stream) {
    Timer? timer;
    T? lastValue;

    return stream.where((event) {
      if (timer?.isActive ?? false) {
        lastValue = event;
        return false;
      }
      timer = Timer(duration, () {
        timer = null;
      });
      return true;
    });
  }
}

class DebounceTransformer<T> extends StreamTransformerBase<T, T> {
  final Duration duration;

  DebounceTransformer(this.duration);

  @override
  Stream<T> bind(Stream<T> stream) {
    Timer? timer;
    final controller = StreamController<T>();

    stream.listen(
      (event) {
        timer?.cancel();
        timer = Timer(duration, () => controller.add(event));
      },
      onDone: () {
        timer?.cancel();
        controller.close();
      },
      onError: controller.addError,
    );

    return controller.stream;
  }
}

extension StreamExtensions<T> on Stream<T> {
  Stream<T> throttle(Duration duration) => transform(ThrottleTransformer(duration));
  Stream<T> debounce(Duration duration) => transform(DebounceTransformer(duration));
}

// Custom collection
class OrderedSet<T> extends IterableBase<T> {
  final Map<T, int> _indices = {};
  final List<T> _items = [];

  bool add(T value) {
    if (_indices.containsKey(value)) return false;
    _indices[value] = _items.length;
    _items.add(value);
    return true;
  }

  bool remove(T value) {
    final index = _indices.remove(value);
    if (index == null) return false;
    _items.removeAt(index);
    for (var i = index; i < _items.length; i++) {
      _indices[_items[i]] = i;
    }
    return true;
  }

  @override
  Iterator<T> get iterator => _items.iterator;

  @override
  int get length => _items.length;
}

// Pattern matching with sealed classes
sealed class AppState {}

class AppInitial extends AppState {}

class AppLoading extends AppState {
  final double? progress;
  AppLoading({this.progress});
}

class AppLoaded<T> extends AppState {
  final T data;
  AppLoaded(this.data);
}

class AppError extends AppState {
  final String message;
  final StackTrace stackTrace;

  AppError(this.message, [StackTrace? stackTrace])
      : stackTrace = stackTrace ?? StackTrace.current;
}

String describeState(AppState state) => switch (state) {
      AppInitial() => 'Initial',
      AppLoading(:final progress) => 'Loading ${progress ?? 0}%',
      AppLoaded(:final data) => 'Loaded: $data',
      AppError(:final message) => 'Error: $message',
    };

// Records and patterns (Dart 3)
typedef Point3D = ({double x, double y, double z});

Point3D createPoint(double x, double y, double z) => (x: x, y: y, z: z);

double distance(Point3D a, Point3D b) {
  final dx = a.x - b.x;
  final dy = a.y - b.y;
  final dz = a.z - b.z;
  return math.sqrt(dx * dx + dy * dy + dz * dz);
}

(String, int) parseUser(Map<String, dynamic> json) {
  final name = json['name'] as String;
  final age = json['age'] as int;
  return (name, age);
}

void printUser((String, int) user) {
  final (name, age) = user;
  print('$name is $age years old');
}

// Async generator
Stream<int> countDown(int from) async* {
  for (var i = from; i >= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;
  }
}

Stream<List<T>> batch<T>(Stream<T> source, int size) async* {
  var batch = <T>[];
  await for (final item in source) {
    batch.add(item);
    if (batch.length >= size) {
      yield batch;
      batch = [];
    }
  }
  if (batch.isNotEmpty) yield batch;
}

// Main
Future<void> main() async {
  // String extensions
  print('hello world'.capitalize());
  print('flutter'.reverse());
  print('test@example.com'.isEmail);

  // Result type
  final result = Result.ok(42);
  result.when(
    ok: (v) => print('Value: $v'),
    err: (e) => print('Error: $e'),
  );

  // Pattern matching
  final states = <AppState>[
    AppInitial(),
    AppLoading(progress: 0.5),
    AppLoaded('Data'),
    AppError('Failed'),
  ];

  for (final state in states) {
    print(describeState(state));
  }

  // Records
  final p1 = createPoint(0, 0, 0);
  final p2 = createPoint(3, 4, 0);
  print('Distance: ${distance(p1, p2)}');

  // Async generator
  await for (final i in countDown(3)) {
    print('Count: $i');
  }
}
