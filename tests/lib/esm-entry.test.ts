/**
 * The ES module entry point of the built package must share the plugin instance with `require()`.
 * https://github.com/vuejs/eslint-plugin-vue/issues/3255
 */
import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')

/**
 * Runs the given ES module code from the package root, where `eslint-plugin-vue`
 * resolves to the package itself through `package.json#exports`.
 */
function runModule(code: string): string {
  return execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `import { createRequire } from 'node:module'
      const require = createRequire(import.meta.url)
      ${code}`
    ],
    { cwd: ROOT, encoding: 'utf8' }
  ).trim()
}

describe('ES module entry point', () => {
  it('should be used for `import`', () => {
    const output = runModule(
      `const namespace = await import('eslint-plugin-vue')
      console.log(Object.keys(namespace).sort().join())`
    )

    assert.strictEqual(output, 'default')
  })

  it('should export the same plugin object as `require()`', () => {
    const output = runModule(
      `import plugin from 'eslint-plugin-vue'
      console.log(
        plugin === require('eslint-plugin-vue'),
        plugin.configs['flat/base'][0].plugins.vue === plugin
      )`
    )

    assert.strictEqual(output, 'true true')
  })

  it('should share `eslint-plugin-vue/dist/utils` with `require()`', () => {
    const output = runModule(
      `import utils from 'eslint-plugin-vue/dist/utils'
      console.log(
        utils === require('eslint-plugin-vue/dist/utils'),
        typeof utils.defineTemplateBodyVisitor
      )`
    )

    assert.strictEqual(output, 'true function')
  })

  it('should allow a flat config to mix `import` and `require()` of the plugin', () => {
    const output = runModule(
      `import { Linter } from 'eslint'
      import plugin from 'eslint-plugin-vue'

      function lint(vue) {
        try {
          return new Linter({ configType: 'flat' })
            .verify(
              '<template><div id="a" id="b"></div></template>',
              [
                ...plugin.configs['flat/base'],
                { plugins: { vue }, rules: { 'vue/no-duplicate-attributes': 'error' } }
              ],
              'a.vue'
            )
            .map((message) => message.ruleId)
            .join()
        } catch (error) {
          return error.message
        }
      }

      console.log(lint(require('eslint-plugin-vue')))
      // A second copy of the plugin, as a separate ES module build would create
      console.log(lint({ ...plugin }))`
    )

    const [withRequire, withCopy] = output.split('\n', 2)
    assert.strictEqual(withRequire, 'vue/no-duplicate-attributes')
    assert.match(withCopy, /Cannot redefine plugin "vue"/)
  })
})
