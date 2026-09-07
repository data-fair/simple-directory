// vue-cropperjs ships no types, and @types/vue-cropperjs is written against Vue 2
// (it imports VueConstructor) — it pulls a whole vue@2 tree in for types this Vue 3
// project cannot use anyway. The component is driven through a `ref<any>` in
// load-avatar.vue, so the default export is all that has to be declared.
declare module 'vue-cropperjs' {
  import type { DefineComponent } from 'vue'
  const VueCropper: DefineComponent<Record<string, any>>
  export default VueCropper
}
