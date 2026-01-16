<template>
  <div
    class="content-panel"
    :style="{
      'broder-top': showTop ? '1px solid #ddd' : 'none'
    }"
  >
    <div class="content-inner">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  closeType: {
    type: Boolean,
    default: false
  }
})
</script>

<style key lang="scss" scoped>
.content-panel {
  overflow: auto;
  height: calc(100vh - 62px);
  .content-inner {
    margin: 0px auto;
    width: 400px;
  }
}
</style>