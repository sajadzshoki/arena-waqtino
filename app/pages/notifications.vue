<script setup lang="ts">
/**
 * اعلان‌ها — نقطهٔ ورود صادقانه، نه فیچر نیمه‌کاره.
 *
 * جعبهٔ اعلان‌ها، پوش‌نوتیفیکیشن، مجوزها و تنظیمات اعلان عمداً در این فاز
 * ساخته نشده‌اند (فاز مخصوص خودش را دارد). این مسیر فقط وضعیت «فعال نشده» را
 * توضیح می‌دهد و کاربر را به جایی می‌برد که امروز کارش راه می‌افتد
 * (نوبت‌ها) — هیچ فهرست جعلی یا شمارندهٔ ساختگی نمایش داده نمی‌شود.
 */
definePageMeta({ access: 'auth', tabbar: false })
useHead({ title: 'اعلان‌ها' })
</script>

<template>
  <div class="pb-6">
    <AppBackHeader title="اعلان‌ها" to="/settings" />

    <section class="rounded-xl border border-dashed border-line-strong bg-surface-muted p-6 text-center">
      <span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface">
        <UIcon name="i-lucide-bell-off" class="size-6 text-foreground-muted" aria-hidden="true" />
      </span>
      <h2 class="t-h3 mt-3 text-foreground-strong">اعلان‌ها هنوز فعال نشده است</h2>
      <p class="t-body-sm mx-auto mt-1 max-w-80 text-foreground-secondary">
        جعبهٔ اعلان، یادآوری نوبت و اعلان‌های پوش‌در این نسخه ساخته نشده‌اند.
        به‌محض فعال‌شدن، همین‌جا با شمارش خوانده‌نشده‌ها باز می‌شود.
      </p>
      <UBadge color="neutral" variant="soft" size="sm" class="mt-3">
        فاز بعدی
      </UBadge>
    </section>

    <SettingsSection title="امروز کجا نگاه کنید؟" class="mt-6">
      <SettingsRow
        to="/bookings"
        icon="i-lucide-calendar-check-2"
        title="نوبت‌های من"
        subtitle="زمان، وضعیت و تغییر نوبت"
      />
      <SettingsRow
        to="/saved"
        icon="i-lucide-bookmark"
        title="کسب‌وکارهای نشان‌شده"
        subtitle="هرچه برای بعد نگه داشته‌اید"
      />
    </SettingsSection>

    <NuxtLink
      to="/settings"
      class="pressable mt-5 inline-flex items-center gap-1 rounded-lg px-1 text-sm font-medium text-primary"
    >
      <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
      بازگشت به تنظیمات
    </NuxtLink>
  </div>
</template>
