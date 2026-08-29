<script setup lang="ts">
/**
 * SettingsSection — گروه‌بندی معنایی ردیف‌های تنظیمات/پروفایل.
 *
 * قانون چیدمان: هر گروه = یک عنوان + (توضیح کوتاه) + یک ظرف مشترک با ردیف‌های
 * جداشده با خط. کارت‌های تودرتو و عنوان‌های توخالی ممنوع — صفحه باید ساختاری
 * داشته باشد نه شلوغ.
 */
withDefaults(
  defineProps<{
    title?: string
    description?: string
    /** danger → تیتر و ظرف برای عملیات حساس (خروج از حساب) */
    tone?: 'default' | 'danger'
  }>(),
  { title: undefined, description: undefined, tone: 'default' }
)

const titleId = useId()
</script>

<template>
  <section class="mt-7 first:mt-0" :aria-labelledby="title ? titleId : undefined">
    <header v-if="title" class="mb-2 px-1">
      <h2
        :id="titleId"
        class="t-section"
        :class="tone === 'danger' ? 'text-error' : 'text-foreground-strong'"
      >
        {{ title }}
      </h2>
      <p v-if="description" class="t-caption mt-0.5">{{ description }}</p>
    </header>

    <div
      class="overflow-hidden rounded-xl border bg-surface px-4"
      :class="tone === 'danger' ? 'border-error-border' : 'border-line'"
    >
      <div class="divide-y divide-line-subtle">
        <slot />
      </div>
    </div>

    <p v-if="$slots.footer" class="t-caption mt-2 px-1">
      <slot name="footer" />
    </p>
  </section>
</template>
