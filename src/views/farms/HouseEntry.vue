<script setup>
import { useAuthStore } from "@/stores/authStore";
import HouseCreateView from "./HouseCreateView.vue";
import HousesView from "@/views/houses/HousesView.vue";

const auth = useAuthStore();
</script>

<template>
  <HouseCreateView v-if="auth.isFarmAdmin && auth.isFarmSetupRequired" />
  <HousesView v-else :key="auth.effectiveFarmId" />
</template>
