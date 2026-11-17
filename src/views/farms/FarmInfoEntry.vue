<script setup>
import { useAuthStore } from "@/stores/authStore";
import FarmCreateView from "./FarmCreateView.vue";
import FarmInfoView from "./FarmInfoView.vue";
const auth = useAuthStore();
</script>

<template>
  <FarmCreateView
    v-if="auth.isFarmAdmin && auth.setupStep > 0"
    :edit-existing="auth.setupStep > 1"
  />
  <FarmInfoView v-else />
</template>
