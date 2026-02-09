<template>
  <div>
    <Dialog
      :show="dialogConfig.show"
      :title="dialogConfig.title"
      :buttons="dialogConfig.buttons"
      width="400px"
      :showCancel="false"
      @close="dialogConfig.show = false"
    >
      <el-form :model="formData" :rules="rules" ref="formDataRef" @submit.prevent>
        <!-- input 输入 -->
        <el-form-item label="" prop="">
          <el-input
            type="textarea"
            :rows="5"
            clearable
            placeholder="输入申请信息，更容易被通过"
            v-model.trim="formData.applyInfo"
            resize="none"
            show-word-limit
            maxlength="100"
          ></el-input>
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()
const { proxy } = getCurrentInstance()
import { userContactStateStore } from '@/stores/ContactStateStore'
const contactStateStore = userContactStateStore()

const dialogConfig = reactive({
  show: false,
  title: '提交申请',
  buttons: [
    {
      type: 'primary',
      text: '确定',
      click: (e) => {
        submitApply()
      }
    }
  ]
})

const formData = ref({})
const formDataRef = ref()
const rules = {
  title: [{ required: true, message: '请输入内容' }]
}
const emit = defineEmits(['reload'])
const submitApply = async () => {
  const { contactId, contactType, applyInfo } = formData.value
  let result = await proxy.Request({
    url: proxy.Api.apply,
    params: {
      receiveUserId: contactId,
      applyInfo: applyInfo,
      contactType: contactType
    }
  })
  if (!result) {
    return
  }
  if (result.code == 0) {
    proxy.Message.success('加入成功')
  } else {
    proxy.Message.success('申请成功，等待对方同意')
  }
  nextTick(() => {
    dialogConfig.show = false
  })
  emit('reload')
  if (result.data == 0) {
    contactStateStore.setContactRelaod(contactType)
  }
}
const show = (data) => {
  console.log(data)
  dialogConfig.show = true
  nextTick(() => {
    formDataRef.value.resetFields()
    formData.value = Object.assign({}, data)
    formData.value.applyInfo = '我是' + userInfoStore.getUserInfo().nickName
  })
}

defineExpose({
  show
})
</script>

<style lang="scss" scoped></style>