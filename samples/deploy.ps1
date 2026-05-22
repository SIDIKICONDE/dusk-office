# Advanced PowerShell: classes, enums, pipeline, error handling.

enum OrderStatus {
    Pending
    Paid
    Shipped
    Cancelled
}

class Order {
    [string] $Id
    [string] $Customer
    [double] $Total
    [OrderStatus] $Status

    Order([string] $id, [string] $customer, [double] $total, [OrderStatus] $status) {
        $this.Id = $id
        $this.Customer = $customer
        $this.Total = $total
        $this.Status = $status
    }

    [bool] IsActive() {
        return $this.Status -ne [OrderStatus]::Cancelled
    }

    [string] ToString() {
        return "Order($($this.Id), $($this.Status))"
    }
}

function Get-ActiveOrders {
    param([Order[]] $Orders)

    $Orders | Where-Object { $_.IsActive() }
}

function Measure-PaidRevenue {
    param([Order[]] $Orders)

    ($Orders | Where-Object { $_.Status -eq [OrderStatus]::Paid } |
        Measure-Object -Property Total -Sum).Sum
}

$orders = @(
    [Order]::new("o-1", "Acme", 249.5, [OrderStatus]::Paid),
    [Order]::new("o-2", "Beta", 19.0, [OrderStatus]::Pending)
)

Write-Host "[INFO] active=$((Get-ActiveOrders $orders).Count)"
Write-Host "[OK] revenue=$(Measure-PaidRevenue $orders)"
