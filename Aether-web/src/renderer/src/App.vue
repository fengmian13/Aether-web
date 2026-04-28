

<template>
  <el-config-provider :locale="locale" :message="config">
    <router-view></router-view>
    <IncomingCallDialog></IncomingCallDialog>
    <CallDialog></CallDialog>
  </el-config-provider>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import IncomingCallDialog from '@/components/call/IncomingCallDialog.vue'
import CallDialog from '@/components/call/CallDialog.vue'
import { initCallService } from '@/services/call/callService'

const locale = zhCn

const config = reactive({
  max: 1
})

onMounted(() => {
  initCallService()
})
</script>

<style lang="less">
</style>
