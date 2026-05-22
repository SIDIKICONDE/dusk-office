// Advanced Java: records, sealed types, pattern matching, virtual threads.

package com.example.advanced;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

public final class Sample {
    public sealed interface Result<T> permits Result.Ok, Result.Err {
        record Ok<T>(T value) implements Result<T> {}
        record Err<T>(String message, Throwable cause) implements Result<T> {}

        static <T> Result<T> ok(T value) {
            return new Ok<>(value);
        }

        static <T> Result<T> err(String message) {
            return new Err<>(message, null);
        }
    }

    public enum OrderStatus {
        PENDING, PAID, SHIPPED, CANCELLED
    }

    public record Order(
        String id,
        String customer,
        List<String> lines,
        OrderStatus status,
        Instant createdAt
    ) {
        public boolean isActive() {
            return status != OrderStatus.CANCELLED;
        }
    }

    public static final class OrderService {
        private final Map<String, Order> store;

        public OrderService(Map<String, Order> store) {
            this.store = Map.copyOf(store);
        }

        public Optional<Order> findById(String id) {
            return Optional.ofNullable(store.get(id));
        }

        public Result<Order> validate(Order order) {
            if (order.lines().isEmpty()) {
                return Result.err("Order must contain at least one line");
            }
            return Result.ok(order);
        }

        public CompletableFuture<List<Order>> listActiveAsync() {
            return CompletableFuture.supplyAsync(() ->
                store.values().stream()
                    .filter(Order::isActive)
                    .collect(Collectors.toList())
            );
        }

        public String describe(Object value) {
            return switch (value) {
                case Order o when o.status() == OrderStatus.PAID -> "paid:" + o.id();
                case Order o -> "order:" + o.id();
                case String s -> "text:" + s;
                case null -> "null";
                default -> value.getClass().getSimpleName();
            };
        }
    }
}
