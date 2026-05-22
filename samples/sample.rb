# Advanced Ruby: pattern matching, refinements, modules, blocks.

module Logging
  refine String do
    def tag(level)
      "[#{level.upcase}] #{self}"
    end
  end
end

using Logging

Order = Data.define(:id, :customer, :total, :status)

class OrderRepository
  STATUSES = %i[pending paid shipped cancelled].freeze

  def initialize
    @orders = {}
  end

  def save(order)
    raise ArgumentError, "invalid status" unless STATUSES.include?(order.status)
    @orders[order.id] = order
    order
  end

  def find(id)
    @orders[id]
  end

  def each_paid
    return enum_for(:each_paid) unless block_given?

    @orders.each_value do |order|
      yield order if order.status == :paid
    end
  end
end

def describe(value)
  case value
  in Order[id:, status: :paid, total: total] if total > 100
    "large paid order #{id}"
  in Order[id:, status:]
    "order #{id} (#{status})"
  in String
    value.tag(:info)
  in nil
    "empty"
  else
    value.class.name
  end
end

repo = OrderRepository.new
repo.save(Order.new("o-1", "Acme", 249.5, :paid))
repo.save(Order.new("o-2", "Beta", 19.0, :pending))

repo.each_paid { |o| puts describe(o) }
