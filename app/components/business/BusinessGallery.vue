<script setup lang="ts">
/**
 * گالری کسب‌وکار — تصویر اصلی + تصاویر کوچک.
 */
const props = defineProps<{
  coverImageUrl?: string | null
  gallery?: string[]
  businessName: string
}>()

const images = computed(() => {
  const imgs: string[] = []
  if (props.coverImageUrl) imgs.push(props.coverImageUrl)
  if (props.gallery) imgs.push(...props.gallery)
  return imgs
})

const selectedIndex = ref(0)
const selectedImage = computed(() => images.value[selectedIndex.value] ?? null)

function selectImage(index: number) {
  selectedIndex.value = index
}

const imgError = ref(false)
watch(selectedIndex, () => {
  imgError.value = false
})
</script>

<template>
  <div>
    <!-- تصویر اصلی -->
    <div class="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-surface-muted">
      <!-- Fallback -->
      <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-soft to-surface-muted">
        <UIcon name="i-lucide-image" class="size-16 text-primary/30" />
      </div>
      <!-- تصویر -->
      <img
        v-if="selectedImage && !imgError"
        :src="selectedImage"
        :alt="`تصویر ${businessName}`"
        class="absolute inset-0 size-full object-cover"
        loading="lazy"
        @error="imgError = true"
      >
      <!-- Counter -->
      <span
        v-if="images.length > 1"
        class="absolute end-2 top-2 rounded-full bg-surface/90 px-2.5 py-1 t-caption font-medium text-foreground backdrop-blur-sm"
      >
        {{ toFaDigits(selectedIndex + 1) }} / {{ toFaDigits(images.length) }}
      </span>
    </div>

    <!-- تصاویر کوچک -->
    <div v-if="images.length > 1" class="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
      <button
        v-for="(img, idx) in images"
        :key="idx"
        type="button"
        class="pressable relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-surface-muted"
        :class="selectedIndex === idx ? 'border-primary' : 'border-transparent'"
        :aria-label="`تصویر ${toFaDigits(idx + 1)}`"
        @click="selectImage(idx)"
      >
        <img
          :src="img"
          :alt="`تصویر کوچک ${toFaDigits(idx + 1)}`"
          class="size-full object-cover"
          loading="lazy"
        >
      </button>
    </div>
  </div>
</template>
