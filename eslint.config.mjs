// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {}
  },
  // صفحات و لی‌اوت‌های Nuxt قرارداداً تک‌کلمه‌ای‌اند (index.vue, login.vue, …)
  {
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  }
)
