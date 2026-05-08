// Advanced Go: generics, concurrency patterns, reflection, embedding.

package samples

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"reflect"
	"sync"
	"time"
)

// Generic types with constraints
type Result[T any] struct {
	OK    bool   `json:"ok"`
	Value T      `json:"value,omitempty"`
	Err   string `json:"error,omitempty"`
}

func Ok[T any](v T) Result[T] {
	return Result[T]{OK: true, Value: v}
}

func Err[T any](msg string) Result[T] {
	return Result[T]{OK: false, Err: msg}
}

// Type constraint with interface
type Ordered interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
		~float32 | ~float64 |
		~string
}

func Min[T Ordered](a, b T) T {
	if a < b {
		return a
	}
	return b
}

func Max[T Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

// Struct embedding and interfaces
type Entity struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
	Entity
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Order struct {
	Entity
	UserID  string  `json:"user_id"`
	Amount  float64 `json:"amount"`
	Status  string  `json:"status"`
}

// Repository pattern with generics
type Repository[T any] interface {
	Find(ctx context.Context, id string) (T, error)
	Save(ctx context.Context, entity T) error
	Delete(ctx context.Context, id string) error
}

// In-memory repository implementation
type MemoryRepo[T any] struct {
	mu   sync.RWMutex
	data map[string]T
}

func NewMemoryRepo[T any]() *MemoryRepo[T] {
	return &MemoryRepo[T]{
		data: make(map[string]T),
	}
}

func (r *MemoryRepo[T]) Find(ctx context.Context, id string) (T, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	v, ok := r.data[id]
	if !ok {
		var zero T
		return zero, fmt.Errorf("not found: %s", id)
	}
	return v, nil
}

func (r *MemoryRepo[T]) Save(ctx context.Context, entity T) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Use reflection to get ID field
	v := reflect.ValueOf(entity)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	idField := v.FieldByName("ID")
	if !idField.IsValid() {
		return errors.New("entity has no ID field")
	}

	id := idField.String()
	r.data[id] = entity
	return nil
}

func (r *MemoryRepo[T]) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.data, id)
	return nil
}

// Concurrency patterns
type Pool[T any] struct {
	tasks    chan T
	results  chan Result[T]
	workers  int
	proc     func(T) Result[T]
	wg       sync.WaitGroup
}

func NewPool[T any](workers int, buffer int, proc func(T) Result[T]) *Pool[T] {
	return &Pool[T]{
		tasks:   make(chan T, buffer),
		results: make(chan Result[T], buffer),
		workers: workers,
		proc:    proc,
	}
}

func (p *Pool[T]) Start(ctx context.Context) {
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go func() {
			defer p.wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case task, ok := <-p.tasks:
					if !ok {
						return
					}
					p.results <- p.proc(task)
				}
			}
		}()
	}
}

func (p *Pool[T]) Submit(task T) {
	p.tasks <- task
}

func (p *Pool[T]) Results() <-chan Result[T] {
	return p.results
}

func (p *Pool[T]) Close() {
	close(p.tasks)
	p.wg.Wait()
	close(p.results)
}

// Fan-out, fan-in pattern
func FanOut[T, U any](ctx context.Context, input <-chan T, workers int, fn func(T) U) <-chan U {
	output := make(chan U)

	var wg sync.WaitGroup
	wg.Add(workers)

	for i := 0; i < workers; i++ {
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case v, ok := <-input:
					if !ok {
						return
					}
					output <- fn(v)
				}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(output)
	}()

	return output
}

func FanIn[T any](ctx context.Context, channels ...<-chan T) <-chan T {
	output := make(chan T)

	var wg sync.WaitGroup
	wg.Add(len(channels))

	for _, ch := range channels {
		go func(c <-chan T) {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case v, ok := <-c:
					if !ok {
						return
					}
					output <- v
				}
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(output)
	}()

	return output
}

// Context with timeout and cancellation
func ProcessWithTimeout[T any](ctx context.Context, timeout time.Duration, work func(context.Context) (T, error)) (T, error) {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	done := make(chan Result[T])

	go func() {
		v, err := work(ctx)
		if err != nil {
			done <- Err[T](err.Error())
		} else {
			done <- Ok(v)
		}
	}()

	select {
	case <-ctx.Done():
		var zero T
		return zero, ctx.Err()
	case r := <-done:
		if !r.OK {
			var zero T
			return zero, errors.New(r.Err)
		}
		return r.Value, nil
	}
}

// Streaming JSON decoder
func StreamDecode[T any](r io.Reader, handler func(T) error) error {
	dec := json.NewDecoder(r)

	// Open bracket
	if _, err := dec.Token(); err != nil {
		return err
	}

	for dec.More() {
		var v T
		if err := dec.Decode(&v); err != nil {
			return err
		}
		if err := handler(v); err != nil {
			return err
		}
	}

	// Close bracket
	_, err := dec.Token()
	return err
}
