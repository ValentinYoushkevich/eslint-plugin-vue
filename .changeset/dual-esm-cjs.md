---
'eslint-plugin-vue': minor
---

Added an ES module entry point, so `import pluginVue from 'eslint-plugin-vue'` now loads an ES module, while `require('eslint-plugin-vue')` keeps returning the plugin object as before; both share the same plugin instance
