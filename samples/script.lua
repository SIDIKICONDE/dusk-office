-- Advanced Lua: metatables, coroutines, closures, pattern matching (5.4+).

local M = {}

local function tag(level, msg)
    return string.format("[%s] %s", level:upper(), msg)
end

local Order = {}
Order.__index = Order

function Order.new(id, customer, total, status)
    return setmetatable({
        id = id,
        customer = customer,
        total = total,
        status = status or "pending",
    }, Order)
end

function Order:is_paid()
    return self.status == "paid"
end

function Order:__tostring()
    return string.format("Order(%s, %s)", self.id, self.status)
end

local function sum_orders(orders)
    local total = 0
    for _, order in ipairs(orders) do
        total = total + order.total
    end
    return total
end

local function pipeline(source)
    return coroutine.create(function()
        for item in source do
            coroutine.yield(item)
        end
    end)
end

local orders = {
    Order.new("o-1", "Acme", 120.0, "paid"),
    Order.new("o-2", "Beta", 45.5, "pending"),
}

print(tag("info", tostring(orders[1])))
print(tag("debug", string.format("sum=%.2f", sum_orders(orders))))

return M
