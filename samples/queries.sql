-- Advanced SQL: CTEs, window functions, JSON operators, upsert patterns.

WITH monthly_sales AS (
    SELECT
        date_trunc('month', o.created_at) AS month,
        c.region,
        SUM(oi.quantity * oi.unit_price) AS revenue,
        COUNT(DISTINCT o.id) AS order_count
    FROM orders AS o
    INNER JOIN customers AS c ON c.id = o.customer_id
    INNER JOIN order_items AS oi ON oi.order_id = o.id
    WHERE o.status IN ('paid', 'shipped')
    GROUP BY 1, 2
),
ranked AS (
    SELECT
        month,
        region,
        revenue,
        order_count,
        RANK() OVER (PARTITION BY month ORDER BY revenue DESC) AS rank_in_month,
        LAG(revenue) OVER (PARTITION BY region ORDER BY month) AS prev_revenue
    FROM monthly_sales
)
SELECT
    month,
    region,
    revenue,
    order_count,
    rank_in_month,
    ROUND(
        CASE
            WHEN prev_revenue IS NULL OR prev_revenue = 0 THEN NULL
            ELSE (revenue - prev_revenue) / prev_revenue * 100
        END,
        2
    ) AS growth_pct
FROM ranked
WHERE rank_in_month <= 3
ORDER BY month DESC, revenue DESC;

INSERT INTO audit_log (entity, payload, created_at)
VALUES (
    'orders',
    jsonb_build_object('action', 'export', 'user', 'ops', 'count', 128),
    NOW()
)
ON CONFLICT (entity, (payload->>'action'))
DO UPDATE SET created_at = EXCLUDED.created_at;

CREATE INDEX IF NOT EXISTS idx_orders_customer_status
    ON orders (customer_id, status)
    WHERE deleted_at IS NULL;
