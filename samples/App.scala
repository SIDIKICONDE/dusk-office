// Advanced Scala 3: enums, given instances, extension methods, opaque types.

package com.example.advanced

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success, Try}

enum Status:
  case Pending, Paid, Shipped, Cancelled

opaque type OrderId = String
object OrderId:
  def apply(value: String): OrderId =
    require(value.nonEmpty, "id required")
    value

case class Order(id: OrderId, customer: String, total: BigDecimal, status: Status)

given ec: ExecutionContext = ExecutionContext.global

extension (order: Order)
  def isActive: Boolean = order.status != Status.Cancelled
  def label: String = s"${order.id} (${order.status})"

object OrderService:
  def validate(order: Order): Try[Order] =
    if order.total <= 0 then Failure(IllegalArgumentException("total must be positive"))
    else Success(order)

  def listActive(orders: List[Order]): List[Order] =
    orders.filter(_.isActive)

  def loadAsync(ids: List[OrderId]): Future[List[Order]] =
    Future:
      ids.map(id => Order(id, "Acme", BigDecimal(99.0), Status.Paid))

def main(args: Array[String]): Unit =
  val sample = Order(OrderId("o-1"), "Acme", BigDecimal(249.5), Status.Paid)
  println(sample.label)
