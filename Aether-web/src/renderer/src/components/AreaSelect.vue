<template>
  <div>
    <el-cascader
      v-model="modelValue.areaCode"
      :options="AreaData"
      @change="change"
      ref="areaSelectRef"
      clearable
    />
  </div>
</template>

<script setup>
import AreaData from './AreaData'
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
const { proxy } = getCurrentInstance()
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const props = defineProps({
  modelValue: {
    type: Object,
    default: {}
  }
})

const emit = defineEmits(['update:modelValue'])
const areaSelectRef = ref()
const change = (e) => {
  const areaData = {
    areaName: [],
    areaCode: []
  }
  const checkedNodes = areaSelectRef.value.getCheckedNodes()[0]
  if (!checkedNodes) {
    emit('update:modelValue', areaData)
    return
  }
  const pathValues = checkedNodes.pathValues
  const pathLabels = checkedNodes.pathLabels
  areaData.areaCode = pathValues
  areaData.areaName = pathLabels
  emit('update:modelValue', areaData)
}
</script>

<style>
</style>