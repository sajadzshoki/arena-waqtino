<script setup lang="ts">
import { fa_ir } from '@nuxt/ui/locale'
</script>

<template>
  <UApp
    :locale="fa_ir"
    :toaster="{ position: 'bottom-center', duration: 3200 }"
  >
    <NuxtLoadingIndicator color="var(--ui-primary)" :height="3" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
