<script lang="ts">
  type Status = "pending" | "paid" | "shipped" | "cancelled";

  interface Order {
    id: string;
    customer: string;
    total: number;
    status: Status;
  }

  const orders: Order[] = [
    { id: "o-1", customer: "Acme", total: 249.5, status: "paid" },
    { id: "o-2", customer: "Beta", total: 19.0, status: "pending" },
  ];

  function describe(order: Order): string {
    if (order.status === "paid" && order.total > 100) {
      return `large paid order ${order.id}`;
    }
    return `order ${order.id} (${order.status})`;
  }

  $: paidRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0);
</script>

<section class="panel">
  <h1>Dusk Office Svelte sample</h1>
  <p>Paid revenue: {paidRevenue.toFixed(2)}</p>
  <ul>
    {#each orders as order (order.id)}
      <li>{describe(order)}</li>
    {/each}
  </ul>
</section>

<style>
  .panel {
    padding: 1rem;
  }
</style>
