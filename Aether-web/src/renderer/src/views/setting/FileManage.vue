<template>
  <ContentPanel v-loading="copying" element-loading-text="正在处理文件目录">
    <el-form :model="formData" label-width="80px" @submit.prevent>
      <el-form-item label="文件管理" class="file-manage">
        <div class="file-input" :title="formData.sysSetting">{{ formData.sysSetting }}</div>
        <div class="tips">文件的默认保存位置</div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="changeFolder">更改</el-button>
        <el-button type="primary" @click="openLocalFolder">打开文件</el-button>
      </el-form-item>
    </el-form>
  </ContentPanel>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Message from '@/utils/Message'

const copying = ref(false)

const formData = ref({
  sysSetting: ''
})

const getFileManageInfoCallback = (e, data) => {
  formData.value.sysSetting = data?.currentFolder || ''
}

const changeLocalFolderCallback = (e, data) => {
  copying.value = false
  if (data?.canceled) {
    return
  }
  formData.value.sysSetting = data?.currentFolder || ''
  Message.success('文件保存目录已更新')
}

const openLocalFolderCallback = (e, data) => {
  copying.value = false
  if (!data?.success) {
    Message.warning(data?.errorMessage || '打开文件夹失败')
  }
}

const loadFileManageInfo = () => {
  window.ipcRenderer.send('getFileManageInfo')
}

const changeFolder = () => {
  copying.value = true
  window.ipcRenderer.send('changeLocalFolder')
}

const openLocalFolder = () => {
  if (!formData.value.sysSetting) {
    Message.warning('当前没有可打开的文件目录')
    return
  }
  copying.value = true
  window.ipcRenderer.send('openLocalFolder')
}

onMounted(() => {
  loadFileManageInfo()
  window.ipcRenderer.on('getFileManageInfoCallback', getFileManageInfoCallback)
  window.ipcRenderer.on('changeLocalFolderCallback', changeLocalFolderCallback)
  window.ipcRenderer.on('openLocalFolderCallback', openLocalFolderCallback)
})

onUnmounted(() => {
  window.ipcRenderer.removeListener('getFileManageInfoCallback', getFileManageInfoCallback)
  window.ipcRenderer.removeListener('changeLocalFolderCallback', changeLocalFolderCallback)
  window.ipcRenderer.removeListener('openLocalFolderCallback', openLocalFolderCallback)
})
</script>

<style lang="scss" scoped>
.file-manage {
  :deep(.el-form-item__content) {
    display: block;
  }

  .file-input {
    background: #fff;
    padding: 0px 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 16px;
  }

  .tips {
    color: #888888;
    font-size: 13px;
  }
}
</style>
