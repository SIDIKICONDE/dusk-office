# Advanced R: tibbles, pipes, modeling syntax, factors.

library(dplyr)
library(tidyr)
library(glue)

OrderStatus <- c("pending", "paid", "shipped", "cancelled")

orders <- tibble(
  id = c("o-1", "o-2", "o-3"),
  customer = c("Acme", "Beta", "Gamma"),
  total = c(249.5, 19.0, 88.2),
  status = factor(c("paid", "pending", "paid"), levels = OrderStatus)
)

summarize_revenue <- function(df) {
  df |>
    filter(status == "paid") |>
    summarize(
      orders = n(),
      revenue = sum(total, na.rm = TRUE),
      avg_ticket = mean(total, na.rm = TRUE)
    )
}

describe_order <- function(row) {
  if (row$status == "paid" && row$total > 100) {
    glue("large paid order {row$id}")
  } else {
    glue("order {row$id} ({row$status})")
  }
}

print(summarize_revenue(orders))
print(describe_order(orders[1, ]))

# Linear model sample
model <- lm(total ~ as.numeric(status), data = orders)
summary(model)
