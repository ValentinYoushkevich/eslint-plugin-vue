// The ES module entry point re-exports the CommonJS build instead of being a second build:
// `import` and `require()` then share the same plugin object, because ESLint throws
// "Cannot redefine plugin" when a config mixes two different `vue` plugin objects.
// https://github.com/vuejs/eslint-plugin-vue/issues/3255
export { default } from './index.js'
