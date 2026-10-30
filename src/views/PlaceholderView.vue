

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <section>
    <h1>{{ route.meta.title }}</h1>
    <p>หน้านี้ยังไม่ได้พัฒนา</p>
  </section>
</template>