<template>
  <div class="top drag"></div>
  <div class="iconfont icon-chat"></div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.top {
  height: 60px;
}
.iconfont {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
  /* 修改颜色为灰色，防止背景为白色时看不见 */
  color: #9e9b9b;
  height: calc(100vh - 122px);
}
</style>