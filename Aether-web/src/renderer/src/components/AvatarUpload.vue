<template>
  <div class="avatar-upload">
    <div class="avatar-show">
      <template v-if="modelValue">
        <el-image v-if="preview" :src="localFile" fit="scale-down"></el-image>
        <ShowLocalImage :fileId="modelValue" partType="avatar" :width="40" v-else></ShowLocalImage>
      </template>
      <template v-else>
        <el-upload name="file" :show-file-list="false" accept=".png,.PNG,.jpg,.JPG,.jpeg,.JPEG,.gif,.GIF,.bmp,.BMP"
          :multiple="false" :http-request="uploadImage">
          <span class="iconfont icon-add"></span>
        </el-upload>
      </template>
    </div>
    <div class="select-btn">
      <el-upload name="file" :show-file-list="false" accept=".png,.PNG,.jpg,.JPG,.jpeg,.JPEG,.gif,.GIF,.bmp,.BMP"
        :multiple="false" :http-request="uploadImage">
        <el-button type="primary" size="small">上传头像</el-button></el-upload>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, onMounted, watch, onUnmounted } from 'vue'
import ShowLocalImage from './ShowLocalImage.vue'

const { proxy } = getCurrentInstance()

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: null
  }
})

const emit = defineEmits(['coverFile'])
// const preview = ref(false)
const localFile = ref(null)


// 文件上传
const preview = computed(() => {
  return props.modelValue instanceof File
})


const uploadImage = async (file) => {
  file = file.file
  window.ipcRenderer.send("createCover", file.path);
}

onMounted(() => {
  window.ipcRenderer.on('createCoverCallback', (e, { avatarStream, coverStream }) => {
    // 处理封面图
    const coverBlob = new Blob([coverStream], { type: 'image/png' });
    const coverFile = new File([coverBlob], 'thumbnail.jpg');
    let img = new FileReader();
    img.readAsDataURL(coverFile);
    img.onload = ({ target }) => {
      localFile.value = target.result;
    };

    // 处理头像缩略图
    const avatarBlob = new Blob([avatarStream], { type: 'image/png' });
    const avatarFile = new File([avatarBlob], 'thumbnail2.jpg');

    // 向父组件 emit 事件，传递两个文件对象
    emit('coverFile', { avatarFile, coverFile });
  });
});
onUnmounted(() => {
  window.ipcRenderer.removeAllListeners('createCoverCallback')
})
</script>

<style lang="scss" scoped>
.avatar-upload {
  display: flex;
  justify-content: center;
  align-items: end;
  line-height: normal;

  .avatar-show {
    background: #ededed;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: relative;

    .icon-add {
      font-size: 30px;
      color: #b9b9b9;
      width: 60px;
      height: 60px;
      text-align: center;
      line-height: 60px;
    }

    img {
      width: 60px;
      height: 60px;
    }

    .op {
      position: absolute;
      color: #0e8aef;
      top: 80px;
    }
  }

  .select-btn {
    vertical-align: bottom;
    margin-left: 5px;
  }
}
</style>