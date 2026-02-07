<template>
  <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="80px" @submit.prevent>
    <el-form-item label="群组名称" prop="groupName">
      <el-input
        maxlength="150"
        clearable
        placeholder="请输入群组名称"
        v-model.trim="formData.groupName"
      ></el-input>
    </el-form-item>
    <el-form-item label="封面" prop="avatarFile">
      <AvatarUpload
        v-model="formData.avatarFile"
        ref="avatarUploadRef"
        @coverFile="saveCover"
      ></AvatarUpload>
    </el-form-item>
    <el-form-item label="加入权限" prop="joinType">
      <el-radio-group v-model="formData.joinType">
        <el-radio :label="0">管理员同意加入</el-radio>
        <el-radio :label="1">直接加入</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="公告" prop="groupIntroducte">
      <el-input
        clearable
        placeholder="请输入群组公告"
        v-model.trim="formData.groupIntroducte"
        type="textarea"
        :rows="5"
        maxlength="300"
        :show-word-limit="true"
        resize="none"
      ></el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">{{ formData.groupId ? '修改' : '创建' }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
const { proxy } = getCurrentInstance()
import { userContactStateStore } from '@/stores/ContactStateStore'
const contactStateStore = userContactStateStore()

const formData = ref({})
const formDataRef = ref()

const rules = {
  groupName: [{ required: true, message: '请输入群组名称' }],
  joinType: [{ required: true, message: '请选择加入权限' }]
  // avatarFile: [{ required: true, message: '请上传群组封面' }]
}

const emit = defineEmits(['editBack'])
const saveCover = (file) => {
  let fd = new FormData()
  fd.append('file', file)
  fd.append('type', '0') // 0 for avatar, assumes backend convention
  proxy
    .Request({
      url: proxy.Api.uploadImage,
      params: fd,
      dataType: 'file'
    })
    .then((result) => {
      if (!result) {
        return
      }
      formData.avatarFile = result.fileId // Assumes backend returns { fileId: ... }
      formData.avatarCover = result.fileName || '' // Optional, if needed
    })
}

const submit = async () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    let params = {}
    // TODO：重新加载头像
    Object.assign(params, formData.value)
    let result = await proxy.Request({
      url: proxy.Api.saveGroup,
      params
    })
    if (!result) {
      return
    }
    if (params.groupId) {
      proxy.Message.success('修改成功')
      emit('editBack')
    } else {
      proxy.Message.success('创建成功')
    }
    formDataRef.value.resetFields()
    contactStateStore.setContactReload('MY')
    //TODO 重新加载头像
  })
}

const show = (data) => {
  formDataRef.value.resetFields()
  formData.value = Object.assign({}, data)
  formData.value.avatarFile = data.groupId
}

defineExpose({
  show
})
</script>

<style>
</style>