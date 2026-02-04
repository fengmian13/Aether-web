<template>
  <div class="image-panel" @click="showImageHandler">
    <el-image :src="serverUrl" fit="scale-down" style="width: 100%; height: 100%">
      <template #error>
        <img :src="noData" width="100%" height="100%" />
      </template>
    </el-image>
  </div>
</template>
<script setup>
import { ref, reactive, getCurrentInstance, nextTick, computed } from 'vue'
const { proxy } = getCurrentInstance()

const props = defineProps({
  width: {
    type: Number,
    default: 170
  },
  height: { type: Number },
  showPlay: {
    type: Boolean,
    default: false
  },
  fileId: { type: [String, Number] },
  partType: {
    type: String,
    default: 'avatar'
  },
  fileType: {
    type: Number,
    default: 0
  },
  forceGet: {
    type: Boolean,
    default: false
  }
})

const showImageHandler = () => {
  // 实现图片显示逻辑
}

import noData from '@/assets/img/no_data.png'

const serverUrl = computed(() => {
  if (!props.fileId) {
    return noData
  }
  let url = `${proxy.Api.prodDomain}/file/getResource?sourceName=${props.partType}&fileId=${props.fileId}`
  if (props.forceGet) {
    url += `&_t=${new Date().getTime()}`
  }
  return url
})
</script>


<style lang="scss" scoped>
.image-panel {
  position: relative;
  display: flex;
  overflow: hidden;
  cursor: pointer;
  width: 100%;
  height: 100%;
  max-width: 170px;
  max-height: 170px;
  background: #ddd;
  .icon-image-error {
    margin: 0px auto;
    font-size: 30px;
    color: #838383;
  }
  .play-panel {
    z-index: 2;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    .icon-video-play {
      font-size: 35px;
      color: #fff;
    }
    &:hover {
      opacity: 0.8;
    }
  }
}
</style>