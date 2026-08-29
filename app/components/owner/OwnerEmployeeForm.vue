<script setup lang="ts">
/**
 * فیلدهای مشترک «افزودن پرسنل» و «ویرایش پرسنل».
 *
 * کامپوننت احمق است: به سرویس‌ها یا mock دست نمی‌زند، هیچ قاعدهٔ اعتبارسنجی در
 * آن تکرار نمی‌شود و فقط مقدار/پیام خطا را از صفحه می‌گیرد — پس همان قواعد را
 * صفحهٔ ساخت، صفحهٔ ویرایش و لایهٔ سرویس استفاده می‌کنند.
 *
 * سه نکتهٔ عمدی:
 *   • نام در دو قلم جداست و *نام نمایشی* پیش‌نمایش ساخته می‌شود (فیلد سوم
 *     ذخیره نمی‌شود).
 *   • موبایل اختیاری است و با `WqPhoneInput` (inputmode=tel، dir=ltr، ارقام
 *     فارسی نرمال می‌شود) گرفته می‌شود — و هیچ‌وقت معنی «حساب کاربری» نمی‌دهد.
 *   • آواتار از همان استراتژی فاز ۷ می‌آید (پیش‌نمایش mock، بدون ادعای آپلود)
 *     و نداشتنش ساخت پرسنل را بلاک نمی‌کند.
 */
import type { EmployeeFormErrors, EmployeeFormInput } from '~/utils/validation'
import type { AssignmentRow } from '~/composables/useEmployeeAssignment'
import type { EmployeeStatus } from '~/types/employee'
import { EMPLOYEE_TITLE_MAX, PROFILE_NAME_MAX } from '~/utils/validation'

const statusOptions = employeeStatusOptions()

withDefaults(
  defineProps<{
    firstName: string
    lastName: string
    title: string
    phone: string
    avatarUrl: string | null
    status: EmployeeStatus
    rows: AssignmentRow[]
    selectedCount: number
    danglingCount?: number
    /** پیام خطای هر قلم (یا `undefined`) — تصمیم «کِی» با `useEmployeeForm` است */
    errorFor: (field: keyof EmployeeFormErrors) => string | undefined
    /** پیش‌نمایش نام نمایشی (مشتق‌شده از دو قلم نام) */
    displayName: string
    /** پیش‌نمایش شماره با جداکنندهٔ فارسی — نمایش است، مقدار نه */
    phonePreview: string | null
    disabled?: boolean
  }>(),
  { danglingCount: 0, disabled: false }
)

const emit = defineEmits<{
  'update:firstName': [value: string]
  'update:lastName': [value: string]
  'update:title': [value: string]
  'update:phone': [value: string]
  'update:avatarUrl': [value: string | null]
  'update:status': [value: EmployeeStatus]
  'touch': [field: keyof EmployeeFormInput]
  'commit-phone': []
  'toggle-service': [serviceId: string]
}>()
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- هویت: دو قلم کنار هم روی تابلو/دسکتاپ، روی موبایل زیر هم (نه فشرده) -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <WqInput
        label="نام"
        :model-value="firstName"
        required
        :maxlength="PROFILE_NAME_MAX"
        placeholder="مثلاً مینا"
        :hint="`تا ${toFaDigits(PROFILE_NAME_MAX)} حرف.`"
        :error="errorFor('firstName')"
        :disabled="disabled"
        @update:model-value="emit('update:firstName', $event)"
        @blur="emit('touch', 'firstName')"
      />
      <WqInput
        label="نام خانوادگی"
        :model-value="lastName"
        required
        :maxlength="PROFILE_NAME_MAX"
        placeholder="مثلاً رحیمی"
        :error="errorFor('lastName')"
        :disabled="disabled"
        @update:model-value="emit('update:lastName', $event)"
        @blur="emit('touch', 'lastName')"
      />
    </div>

    <p v-if="displayName" class="-mt-3 t-caption text-foreground-muted">
      در فهرست و در رزرو این‌طور دیده می‌شود:
      <span class="font-semibold text-foreground-secondary">{{ displayName }}</span>
    </p>

    <WqInput
      label="عنوان شغلی"
      :model-value="title"
      :maxlength="EMPLOYEE_TITLE_MAX"
      placeholder="مثلاً آرایشگر مو و رنگ"
      hint="اختیاری — همان چیزی که مشتری زیر نامش در کارت پرسنل می‌بیند."
      :error="errorFor('title')"
      :disabled="disabled"
      @update:model-value="emit('update:title', $event)"
      @blur="emit('touch', 'title')"
    />

    <div>
      <WqPhoneInput
        label="شمارهٔ موبایل"
        :model-value="phone"
        hint="اختیاری — برای هماهنگی است، نه ساخت حساب کاربری."
        :error="errorFor('phone')"
        :disabled="disabled"
        @update:model-value="emit('update:phone', $event)"
        @blur="emit('touch', 'phone'); emit('commit-phone')"
      />
      <p v-if="phonePreview" class="t-caption mt-1.5 text-foreground-muted">
        نمایش در پروندهٔ کسب‌وکار: <span class="t-num">{{ phonePreview }}</span>
      </p>
    </div>

    <!-- آواتار: همان استراتژی فاز ۷ (پیش‌نمایش mock، بدون ادعای آپلود) -->
    <div>
      <span class="t-label mb-2 block text-foreground">تصویر پروفایل</span>
      <ProfileAvatarEditor
        :model-value="avatarUrl"
        :name="displayName || 'پرسنل'"
        :disabled="disabled"
        @update:model-value="emit('update:avatarUrl', $event)"
      />
    </div>

    <!-- وضعیت: انتخاب آگاهانه، با پیامدش — نه یک سوئیچ بی‌متن -->
    <div>
      <span id="employee-status-label" class="t-label mb-2 block text-foreground">وضعیت پرسنل</span>
      <div class="flex flex-col gap-2" role="radiogroup" aria-labelledby="employee-status-label">
        <WqSelectCard
          v-for="option in statusOptions"
          :key="option.value"
          :icon="option.icon"
          :title="option.label"
          :description="option.hint"
          :selected="status === option.value"
          :disabled="disabled"
          @select="emit('update:status', option.value)"
        />
      </div>
    </div>

    <!-- اختصاص سرویس‌ها: بخشی از همین فرم (ساخت و ویرایش یکی بمانند) -->
    <div>
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <span class="t-label text-foreground">سرویس‌هایی که انجام می‌دهد</span>
        <span class="t-caption t-num text-foreground-secondary">
          {{ toFaDigits(selectedCount) }} انتخاب
        </span>
      </div>
      <OwnerEmployeeServicePicker
        :rows="rows"
        :selected-count="selectedCount"
        :dangling-count="danglingCount"
        :disabled="disabled"
        hint="اختیار این نفر را تعیین می‌کند که مشتری در گام «انتخاب پرسنل» او را ببیند یا نه."
        @toggle="emit('toggle-service', $event)"
      />
    </div>
  </div>
</template>
