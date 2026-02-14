<template>
  <ContentPanel>
    <el-form ref="formDataRef" label-width="80px" @submit.prevent></el-form>
    <el-form-item label="版本信息">
      <div class="version-info">
        <div>Anther {{ config.version }}</div>
        <div>
          <el-button type="primary" @click="checkUpdate">检查更新</el-button>
        </div>
    </el-form-item>
  </ContentPanel>
</template>

<script setup>
import config from '../../../../../package.json'
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
const { proxy } = getCurrentInstance()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

// 检查更新
const checkUpdate = () => {}
</script>

<style lang="scss" scoped>
.about {
  padding: 20px;
  .title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
  }
}
</style>