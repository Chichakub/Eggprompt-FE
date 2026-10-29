<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
  <main class="register-page min-h-dvh border-4 border-[#f6d494] bg-[#f7f2e7] text-[#23311e] lg:grid lg:grid-cols-[3fr_2fr]">
    <section class="brand-panel relative isolate overflow-hidden bg-[#344824] px-7 py-8 text-white sm:px-14 lg:min-h-[calc(100dvh-8px)] lg:py-14" aria-label="เกี่ยวกับ EggPrompt">
      <div class="relative z-10 flex items-center gap-3 text-lg font-bold">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[13px] bg-[#ffb51b]" aria-hidden="true">
          <span class="egg-mark block h-4 w-2.5 bg-white"></span>
        </span>
        <span>ไข่พร้อม · EggPrompt System</span>
      </div>

      <div class="brand-copy relative z-10 max-w-[500px] py-14 lg:pt-0">
        <span class="inline-block rounded-full border border-white/15 bg-[#566a43] px-3 py-1 text-[10px] tracking-wide text-[#eef1df]">
          Enterprise Egg Farm Management Platform
        </span>
        <h1 class="mt-6 text-[32px] font-bold leading-[1.35] tracking-tight sm:text-[36px]">
          บริหารทุกโรงเรือน<br />ง่ายขึ้นในระบบเดียว
        </h1>
        <p class="mt-5 max-w-[470px] text-[13px] leading-relaxed text-[#d4dcc7]">
          รวมข้อมูลการเลี้ยงและการผลิตของแต่ละโรงเรือน พร้อมกำหนดสิทธิ์การเข้าถึงข้อมูล
          และ AI ช่วยคาดการณ์ผลผลิตล่วงหน้า 7–30 วัน
        </p>
      </div>
      <div class="fried-egg pointer-events-none absolute -bottom-12 -right-24 hidden h-[400px] w-[400px] rounded-full bg-[#f7f2e7] lg:block" aria-hidden="true">
        <div class="yolk absolute left-[100px] top-[102px] h-[182px] w-[182px] rounded-full"></div>
      </div>
    </section>
    <section class="flex items-center justify-center px-5 py-12 sm:px-10 lg:py-16">
      <RouterView />
    </section>
  </main>
</template>

<style scoped>
.egg-mark { border-radius: 55% 55% 48% 48%; }
.yolk { background: radial-gradient(circle at 37% 37%, #ffcb5c 0 12%, transparent 15%), radial-gradient(circle at 40% 35%, #ffb323, #eda014 76%); box-shadow: inset 0 3px 8px #ffdb8a, 0 9px 16px rgb(176 123 26 / 24%); }
@media (min-width: 1024px) { .brand-copy { position: absolute; top: 36%; left: 56px; right: 40px; } }
</style>
