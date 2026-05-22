<script setup lang="ts">
import { computed, ref } from "vue";

type Status = "pending" | "paid" | "shipped" | "cancelled";

interface Order {
  id: string;
  customer: string;
  total: number;
  status: Status;
}

const orders = ref<Order[]>([
  { id: "o-1", customer: "Acme", total: 249.5, status: "paid" },
  { id: "o-2", customer: "Beta", total: 19.0, status: "pending" },
]);

const paidRevenue = computed(() =>
  orders.value
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total, 0),
);

function describe(order: Order): string {
  if (order.status === "paid" && order.total > 100) {
    return `large paid order ${order.id}`;
  }
  return `order ${order.id} (${order.status})`;
}
</script>

<template>
  <section class="panel">
    <h1>Dusk Office Vue sample</h1>
    <p>Paid revenue: {{ paidRevenue.toFixed(2) }}</p>
    <ul>
      <li v-for="order in orders" :key="order.id">
        {{ describe(order) }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  padding: 1rem;
}
</style>
