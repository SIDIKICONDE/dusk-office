<?php

/**
 * Advanced PHP: attributes, enums, fibers, generators, match expressions.
 */

declare(strict_types=1);

namespace App\Advanced;

use Attribute;
use Fiber;
use Generator;
use InvalidArgumentException;
use ReflectionClass;
use ReflectionProperty;

// Attributes (PHP 8+)
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class Route
{
    public function __construct(
        public string $path,
        public string $method = 'GET',
        public array $middleware = [],
    ) {}
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class Validate
{
    public function __construct(
        public ?int $minLength = null,
        public ?int $maxLength = null,
        public ?string $pattern = null,
        public bool $required = true,
    ) {}
}

#[Attribute(Attribute::TARGET_CLASS)]
class Entity
{
    public function __construct(
        public string $table,
        public ?string $connection = null,
    ) {}
}

// Enums (PHP 8.1+)
enum Status: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';

    public function isTerminal(): bool
    {
        return match ($this) {
            self::COMPLETED, self::FAILED => true,
            default => false,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::PROCESSING => 'Processing',
            self::COMPLETED => 'Completed',
            self::FAILED => 'Failed',
        };
    }
}

enum UserRole: int
{
    case GUEST = 0;
    case VIEWER = 1;
    case EDITOR = 2;
    case ADMIN = 3;

    public function hasPermission(string $action): bool
    {
        return match ([$this, $action]) {
            [self::ADMIN, _] => true,
            [self::EDITOR, 'edit'] => true,
            [self::EDITOR, 'create'] => true,
            [self::VIEWER, 'view'] => true,
            [self::GUEST, 'view'] => true,
            default => false,
        };
    }
}

// Backed enum with interface
interface ColorInterface
{
    public function hex(): string;
}

enum Color: string implements ColorInterface
{
    case RED = '#FF0000';
    case GREEN = '#00FF00';
    case BLUE = '#0000FF';

    public function hex(): string
    {
        return $this->value;
    }
}

// First-class callables
class Calculator
{
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }

    public function multiply(int $a, int $b): int
    {
        return $a * $b;
    }

    public function getOperations(): array
    {
        return [
            'add' => $this->add(...),
            'multiply' => $this->multiply(...),
        ];
    }
}

// Fibers for cooperative multitasking
class AsyncTask
{
    private Fiber $fiber;
    private mixed $result;
    private ?\Throwable $error = null;

    public function __construct(callable $callback)
    {
        $this->fiber = new Fiber(function () use ($callback): mixed {
            return $callback();
        });
    }

    public function start(): mixed
    {
        $this->fiber->start();
        return $this->poll();
    }

    public function resume(mixed $value = null): mixed
    {
        $this->fiber->resume($value);
        return $this->poll();
    }

    public function throw(\Throwable $exception): mixed
    {
        $this->fiber->throw($exception);
        return $this->poll();
    }

    private function poll(): mixed
    {
        if ($this->fiber->isTerminated()) {
            return $this->fiber->getReturn();
        }
        return null;
    }

    public function isRunning(): bool
    {
        return !$this->fiber->isTerminated();
    }
}

function asyncSleep(int $ms): void
{
    $start = hrtime(true);
    while ((hrtime(true) - $start) < $ms * 1_000_000) {
        Fiber::suspend();
    }
}

// Generators with return values
function rangeGenerator(int $start, int $end): Generator
{
    for ($i = $start; $i <= $end; $i++) {
        yield $i;
    }

    return "Generated " . ($end - $start + 1) . " numbers";
}

function chunkGenerator(Generator $generator, int $size): Generator
{
    $chunk = [];
    foreach ($generator as $value) {
        $chunk[] = $value;
        if (count($chunk) >= $size) {
            yield $chunk;
            $chunk = [];
        }
    }
    if (!empty($chunk)) {
        yield $chunk;
    }
}

function mapGenerator(Generator $generator, callable $fn): Generator
{
    foreach ($generator as $key => $value) {
        yield $key => $fn($value);
    }
}

// Named arguments and constructor promotion
#[Entity('users')]
class User
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
        public readonly UserRole $role = UserRole::VIEWER,
        public readonly Status $status = Status::PENDING,
        #[Validate(minLength: 8, maxLength: 255)]
        public readonly ?string $password = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            email: $data['email'],
            role: UserRole::from($data['role'] ?? 1),
            status: Status::from($data['status'] ?? 'pending'),
        );
    }

    public function withName(string $name): self
    {
        return new self(
            id: $this->id,
            name: $name,
            email: $this->email,
            role: $this->role,
            status: $this->status,
            password: $this->password,
        );
    }
}

// Readonly properties and clone with
readonly class Point
{
    public function __construct(
        public float $x,
        public float $y,
        public float $z = 0.0,
    ) {}

    public function withX(float $x): self
    {
        return new self($x, $this->y, $this->z);
    }

    public function distance(self $other): float
    {
        return sqrt(
            pow($this->x - $other->x, 2) +
            pow($this->y - $other->y, 2) +
            pow($this->z - $other->z, 2)
        );
    }
}

// Match expressions
function processStatus(Status $status): string
{
    return match ($status) {
        Status::PENDING => 'Waiting for processing',
        Status::PROCESSING => 'Currently being processed',
        Status::COMPLETED => 'Successfully completed',
        Status::FAILED => 'Processing failed',
    };
}

function classifyNumber(int $n): string
{
    return match (true) {
        $n < 0 => 'negative',
        $n === 0 => 'zero',
        $n > 0 && $n <= 10 => 'small positive',
        $n > 10 && $n <= 100 => 'medium positive',
        $n > 100 => 'large positive',
    };
}

// Union types and intersection types
interface Serializable
{
    public function serialize(): string;
}

interface Jsonable
{
    public function toJson(): string;
}

class DataObject implements Serializable, Jsonable
{
    public function __construct(
        private array $data,
    ) {}

    public function serialize(): string
    {
        return serialize($this->data);
    }

    public function toJson(): string
    {
        return json_encode($this->data, JSON_PRETTY_PRINT);
    }
}

function process(Serializable&Jsonable $object): string
{
    return $object->toJson();
}

function format(string|int|float $value): string
{
    return match (true) {
        is_string($value) => $value,
        is_int($value) => number_format($value),
        is_float($value) => number_format($value, 2),
    };
}

// Never return type
function fail(string $message): never
{
    throw new InvalidArgumentException($message);
}

function exitApp(int $code = 0): never
{
    exit($code);
}

// Nullsafe operator
class Company
{
    public function __construct(
        public ?string $name = null,
        public ?Address $address = null,
    ) {}
}

class Address
{
    public function __construct(
        public ?string $street = null,
        public ?string $city = null,
        public ?string $country = null,
    ) {}
}

function getCompanyCity(?Company $company): ?string
{
    return $company?->address?->city;
}

// Array unpacking
function mergeArrays(): array
{
    $a = [1, 2, 3];
    $b = [4, 5, 6];
    $c = [...$a, ...$b, 7, 8, 9];
    
    return [
        'numbers' => $c,
        'nested' => [
            ...['a' => 1, 'b' => 2],
            ...['c' => 3, 'd' => 4],
        ],
    ];
}

// Traits with abstract methods
trait Validatable
{
    abstract protected function rules(): array;

    public function validate(array $data): bool
    {
        foreach ($this->rules() as $field => $rule) {
            if (!$rule($data[$field] ?? null)) {
                return false;
            }
        }
        return true;
    }
}

class UserForm
{
    use Validatable;

    protected function rules(): array
    {
        return [
            'name' => fn ($v) => is_string($v) && strlen($v) >= 2,
            'email' => fn ($v) => filter_var($v, FILTER_VALIDATE_EMAIL) !== false,
            'age' => fn ($v) => is_int($v) && $v >= 18,
        ];
    }
}

// Main execution
$numbers = rangeGenerator(1, 10);
$chunks = chunkGenerator($numbers, 3);

foreach ($chunks as $chunk) {
    echo implode(', ', $chunk) . "\n";
}

echo "Return value: " . $numbers->getReturn() . "\n";

$string = buildString(
    prefix: '>>> ',
    items: ['a', 'b', 'c'],
    suffix: ' <<<',
);

echo "$string\n";

function buildString(
    string $prefix = '',
    array $items = [],
    string $suffix = '',
): string {
    return $prefix . implode(' | ', $items) . $suffix;
}
