// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Domain packages under app/services use classes; keep Vue rules over app/**.
    'vue/multi-word-component-names': [
      'error',
      { ignores: ['default', 'index', 'design', '[id]'] }
    ]
  }
})
