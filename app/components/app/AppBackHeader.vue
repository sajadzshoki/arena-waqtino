<script setup lang="ts">
/**
 * AppBackHeader — هدر صفحات جزئیات/فرم‌ها: دکمهٔ بازگشت + عنوان + اکشن‌ها.
 * در RTL فلش بازگشت به راست است (نقطهٔ شروع حرکت کاربر).
 */
const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** مقصد بازگشت؛ بدون آن history.back */
    to?: string
  }>(),
  { subtitle: undefined, to: undefined }
)

const router = useRouter()

function back() {
  if (props.to) {
    navigateTo(props.to)
    return
  }
  if (window.history.length > 1) router.back()
  else navigateTo('/')
}
</script>

<template>
  <div class="sticky top-(--wq-header-h) z-30 -mx-4 mb-4 border-b border-line bg-background px-4 py-2.5">
    <div class="flex items-center gap-2">
      <WqIconButton icon="i-lucide-arrow-right" label="بازگشت" @click="back" />
      <div class="min-w-0 flex-1">
        <h1 class="t-h2 truncate text-foreground-strong">{{ title }}</h1>
        <p v-if="subtitle" class="t-caption truncate">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
