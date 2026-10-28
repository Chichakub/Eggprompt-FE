<!--
  src/views/PlaceholderView.vue
  หน้าชั่วคราวสำหรับเมนูที่ยังไม่ได้ทำ จะได้กดเมนูแล้วไม่ error
  ทำหน้าจริงเสร็จเมื่อไหร่ ค่อยไปแก้ component ใน router แทน
-->
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