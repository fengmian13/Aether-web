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
  </el-form>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
const { proxy } = getCurrentInstance()

const formData = reactive({})
const formDataRef = ref()

const rules = {
  title: [{ required: true, message: '请输入群组名称' }]
}
</script>

<style>
</style>