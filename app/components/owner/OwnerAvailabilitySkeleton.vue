<script setup lang="ts">
/**
 * اسکلت صفحهٔ ساعات کاری — به‌جای spinner تمام‌صفحه (قاعدهٔ پروژه).
 * `rows` تعداد کارت‌های پرسنل است تا ارتفاع صفحه نزدیک حالت واقعی بماند.
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="flex flex-col gap-3">
    <USkeleton class="h-36 w-full rounded-xl" />
    <USkeleton class="h-12 w-full rounded-xl" />
    <ul class="flex flex-col gap-2">
      <li v-for="row in rows" :key="row">
        <USkeleton class="h-20 w-full rounded-xl" />
      </li>
    </ul>
  </div>
</template>
