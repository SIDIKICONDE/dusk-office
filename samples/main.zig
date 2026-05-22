// Advanced Zig: comptime, error unions, tagged unions, generics.

const std = @import("std");

const Status = enum { pending, paid, shipped, cancelled };

const Order = struct {
    id: []const u8,
    customer: []const u8,
    total: f64,
    status: Status,

    fn isActive(self: Order) bool {
        return self.status != .cancelled;
    }
};

const OrderError = error{
    EmptyLines,
    InvalidTotal,
};

fn validate(order: Order) OrderError!void {
    if (order.total <= 0) return OrderError.InvalidTotal;
}

fn sumActive(orders: []const Order) f64 {
    var total: f64 = 0;
    for (orders) |order| {
        if (order.isActive()) total += order.total;
    }
    return total;
}

fn Stack(comptime T: type) type {
    return struct {
        items: std.ArrayList(T),

        fn init(allocator: std.mem.Allocator) @This() {
            return .{ .items = std.ArrayList(T).init(allocator) };
        }

        fn push(self: *@This(), value: T) !void {
            try self.items.append(value);
        }
    };
}

pub fn main() !void {
    const orders = [_]Order{
        .{ .id = "o-1", .customer = "Acme", .total = 120.0, .status = .paid },
        .{ .id = "o-2", .customer = "Beta", .total = 45.5, .status = .pending },
    };

    try validate(orders[0]);
    std.debug.print("sumActive={d}\n", .{sumActive(&orders)});
}
