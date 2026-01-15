<template>
  <div class="login-pannel">
    <div class="title drag">Anther</div>
    <div v-if="showLoading" class="loading-panel">
      <img src="../assets/img/loading.gif" />
    </div>
    <div class="login-form" v-else>
      <div class="error-msg">{{ errorMsg }}</div>
      <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="0px" @submit.prevent>
        <!--input输入-->
        <el-form-item prop="email">
          <el-input
            size="large"
            clearable
            placeholder="请输入邮箱"
            max-length="30"
            v-model.trim="formData.email"
            @focus="cleanVerify()"
          >
            <template #prefix>
              <span class="iconfont icon-email"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="nickName" v-if="!isLogin">
          <el-input
            size="large"
            show-password
            clearable
            placeholder="请输入昵称"
            v-model.trim="formData.nickName"
            @focus="cleanVerify()"
          >
            <template #prefix>
              <span class="iconfont icon-user-nick"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="sex" v-if="!isLogin" label="性别">
          <el-select v-model="formData.sex" placeholder="请选择性别" style="width: 100%">
            <el-option :value="1" label="男" />
            <el-option :value="2" label="女" />
            <el-option :value="0" label="保密" />
          </el-select>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            size="large"
            show-password
            clearable
            placeholder="请输入密码"
            v-model.trim="formData.password"
            @focus="cleanVerify()"
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="rePassword" v-if="!isLogin">
          <el-input
            size="large"
            show-password
            clearable
            placeholder="请再次输入密码"
            v-model.trim="formData.rePassword"
            @focus="cleanVerify()"
          >
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="checkcode">
          <div class="check-code-panel">
            <el-input
              size="large"
              clearable
              placeholder="请输入验证码"
              v-model.trim="formData.checkcode"
              @focus="cleanVerify()"
            >
              <template #prefix>
                <span class="iconfont icon-checkcode"></span>
              </template>
            </el-input>
            <img :src="checkCodeUrl" class="check-code" @click="changeCheckCode" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="submit">{{
            isLogin ? '登录' : '注册'
          }}</el-button>
        </el-form-item>
        <div class="bottom-link">
          <span class="a-link" @click="changeOpType">{{
            isLogin ? '没有账号？' : '已有账号？'
          }}</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import md5 from 'md5'
import { useUserInfoStore } from '@/stores/UserInfoStore'
const userInfoStore = useUserInfoStore()

import { useRouter } from 'vue-router'
const router = useRouter()

const { proxy } = getCurrentInstance()
const checkCodeUrl = ref('')

const formData = ref({})
const formDataRef = ref()
const rules = {
  title: [{ required: true, message: '请输入内容' }]
}

const isLogin = ref(true)
const changeOpType = () => {
  isLogin.value = !isLogin.value
  window.ipcRenderer.send('loginOrRegister', isLogin.value)
  nextTick(() => {
    formDataRef.value.resetFields()
    formData.value = {}
    cleanVerify()
    changeCheckCode()
  })
}

//请求方法
//获取验证码
const changeCheckCode = async () => {
  let result = await proxy.Request({
    url: proxy.Api.checkCode,
    method: 'post'
  })
  console.log('验证码响应:', result)
  if (!result) {
    return
  }
  checkCodeUrl.value = result.data.checkCode
  localStorage.setItem('checkCodeKey', result.data.checkCodeKey)
}
changeCheckCode()

const errorMsg = ref(null)
const checkValue = (type, value, msg) => {
  if (proxy.Utils.isEmpty(value)) {
    errorMsg.value = msg
    return false
  }
  // 判断正则
  if (type && !proxy.Verify[type](value)) {
    errorMsg.value = msg
    return false
  }

  return true
}

// 清空验证
const cleanVerify = () => {
  errorMsg.value = null
}
const showLoading = ref(false)
const submit = async () => {
  cleanVerify() //清空验证
  if (!checkValue('checkEmail', formData.value.email, '请输入正确的邮箱')) {
    return
  }
  if (!isLogin.value && !checkValue(null, formData.value.nickName, '请输入正确的昵称')) {
    return
  }
  if (
    !checkValue('checkPassword', formData.value.password, '密码只能是数字、字母、特殊字符8~18位')
  ) {
    return
  }
  if (!isLogin.value && formData.value.password != formData.value.rePassword) {
    errorMsg.value = '两次密码不一致'
    return
  }
  if (!checkValue(null, formData.value.checkcode, '请输入正确的验证码')) {
    return
  }
  if (isLogin.value) {
    showLoading.value = true
  }
  let result = await proxy.Request({
    url: isLogin.value ? proxy.Api.login : proxy.Api.register,
    showLoading: isLogin.value ? false : true,
    showError: false,
    params: {
      email: formData.value.email,
      password: isLogin.value ? md5(formData.value.password) : formData.value.password,
      nickName: formData.value.nickName,
      sex: formData.value.sex,
      checkCode: formData.value.checkcode,
      checkCodeKey: localStorage.getItem('checkCodeKey')
    },
    errorCallback: (response) => {
      showLoading.value = false
      changeCheckCode()
      errorMsg.value = response.info
    }
  })
  if (!result) {
    return
  }
  if (isLogin.value) {
    userInfoStore.setUserInfo(result.data)
    localStorage.setItem('token', result.data.token)
    router.push('/main')

    // 获取屏幕大小
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    // 打开聊天窗口
    window.ipcRenderer.send('openChat', {
      email: formData.value.email,
      token: result.data.token,
      nickName: result.data.nickName,
      userId: result.data.userId,
      amdin: result.data.admin,
      screenWidth: screenWidth,
      screenHeight: screenHeight
    })
  } else {
    proxy.Message.success('注册成功')
    changeOpType()
  }
}
</script>

<style lang="scss" scoped>
.login-pannel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #edecee 0%, #1e61d4 100%);
  padding: 20px;
  box-sizing: border-box;
}

// 标题居中
.title {
  font-size: 28px; // 字体大小
  font-weight: 700;
  color: rgb(88, 150, 146);
  margin-bottom: 15px; // 底部间距
  letter-spacing: 1.5px; // 字母间距
  user-select: none;
  &.drag {
    cursor: move;
  }
}
//登录按钮居中
.login-form {
  .error-msg {
    height: 10px; // 固定高度防止抖动
    line-height: 15px;
    color: #f56c6c; // 红色警告字体
    font-size: 14px;
    margin-bottom: 5px;
    text-align: left;
  }

  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
  }

  .check-code-panel {
    display: flex;
    align-items: center;
    width: 100%;

    :deep(.el-input) {
      flex: 1; // 输入框自动占满剩余空间
    }

    .check-code {
      width: 120px;
      height: 40px;
      // margin-left: 0px; // 与输入框的间距
      cursor: pointer;
      // border-radius: 4px;
      flex-shrink: 0; // 防止图片压缩
    }
  }
}
//提示靠右
.bottom-link {
  text-align: right;
  font-size: 12px;
  margin-bottom: 6px;

  .a-link {
    color: #333; // 黑色字体
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: #1e61d4; // 悬停变色
    }
  }
}
</style>
