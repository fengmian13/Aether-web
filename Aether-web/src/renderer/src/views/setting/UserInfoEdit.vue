<template>
  <div>
    <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="80px" @submit.prevent>
      <el-form-item label="头像" prop="avatarFile">
        <AvatarUpload v-model="formData.avatarFile" @coverFile="saveCover"></AvatarUpload>
      </el-form-item>

      <el-form-item label="昵称" prop="nickName">
        <el-input maxlength="150" clearable placeholder="请输入昵称" v-model.trim="formData.nickName"></el-input>
      </el-form-item>
      <el-form-item label="性别" prop="sex">
        <el-radio-group v-model="formData.sex">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="0">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="朋友权限" prop="joinType">
        <el-switch
          v-model="formData.joinType"
          :active-value="1"
          :inactive-value="0"
          active-text="需要验证"
          inactive-text="直接加入"
        />
        <div class="info">允许加我为好友时需要验证</div>
      </el-form-item>
      <el-form-item label="地区" prop="area">
        <AreaSelect v-model="formData.area"></AreaSelect>
      </el-form-item>
      <el-form-item label="个性签名" prop="personalSignature">
        <el-input
          clearable
          placeholder="请输入个性签名"
          v-model.trim="formData.personalSignature"
          type="textarea"
          rows="5"
          maxlength="30"
          :show-word-limit="true"
          resize="none"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveUserInfo">保存个人信息</el-button>
        <el-button link @click="close">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import AreaSelect from '@/components/AreaSelect.vue'
import AvatarUpload from '../../components/AvatarUpload.vue'
import { ref, getCurrentInstance, watch } from 'vue'

const { proxy } = getCurrentInstance()

import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()
import { useAvatarInfoStore } from '@/stores/AvatarUpdateStore'
const avatarInfoStore = useAvatarInfoStore()

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const formData = ref({})
const formDataRef = ref()
const rules = {
  nickName: [{ required: true, message: '请输入昵称' }]
}

const emit = defineEmits(['editBack'])

const syncFormData = (data) => {
  const safeData = data && typeof data === 'object' ? data : {}
  formData.value = {
    ...safeData,
    avatarFile: safeData.avatarFile || safeData.userId || '',
    area: {
      areaCode: safeData.areaCode ? safeData.areaCode.split(',') : [],
      areaName: safeData.areaName ? safeData.areaName.split(',') : []
    }
  }
}

watch(
  () => props.data,
  (data) => {
    syncFormData(data)
  },
  { immediate: true, deep: true }
)

const saveCover = ({ avatarFile, coverFile }) => {
  formData.value.avatarFile = avatarFile
  formData.value.avatarCover = coverFile
}

const saveAvatar2Local = async (userId, avatarFile, coverFile) => {
  if (!userId || !(avatarFile instanceof File) || !(coverFile instanceof File)) {
    return
  }
  const avatarByteArray = Array.from(new Uint8Array(await avatarFile.arrayBuffer()))
  const coverByteArray = Array.from(new Uint8Array(await coverFile.arrayBuffer()))
  window.ipcRenderer.send('saveAvatar2Local', {
    userId,
    avatarByteArray,
    coverByteArray
  })
}

const saveUserInfo = () => {
  formDataRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    const params = {}
    Object.assign(params, formData.value)
    params.areaName = ''
    params.areaCode = ''
    if (params.area) {
      params.areaName = params.area.areaName.join(' ')
      params.areaCode = params.area.areaCode.join(',')
      delete params.area
    }

    avatarInfoStore.setFoceReload(userInfoStore.getUserInfo().userId, false)

    const result = await proxy.Request({
      url: proxy.Api.saveUserInfo,
      params
    })
    if (!result) {
      return
    }

    proxy.Message.success('保存成功')
    const savedUserInfo = result.data && typeof result.data === 'object' ? result.data : params
    const pendingAvatarFile = formData.value.avatarFile
    const pendingAvatarCover = formData.value.avatarCover
    userInfoStore.setUserInfo(savedUserInfo)
    await saveAvatar2Local(savedUserInfo.userId, pendingAvatarFile, pendingAvatarCover)
    syncFormData(savedUserInfo)
    if (savedUserInfo.userId) {
      avatarInfoStore.setFoceReload(savedUserInfo.userId, Date.now())
    }
    emit('editBack')
  })
}

const close = () => {
  emit('editBack')
}
</script>

<style lang="scss" scoped>
.info {
  margin-left: 5px;
  color: #949494;
  font-size: 12px;
}
</style>
