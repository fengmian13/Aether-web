<template>
  <div class="contact-apply-list">
    <!-- 头部标题区 -->
    <div class="header-panel">
      <h2>新的朋友</h2>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchContactApplyList" class="btn-retry">重试</button>
    </div>

    <!-- 列表展示 -->
    <div v-else class="table-container">
      <table v-if="list.length > 0" class="contact-table">
        <thead>
          <tr>
            <th>申请人</th>
            <th>申请信息</th>
            <th>申请时间</th>
            <th>状态</th>
            <th class="text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.applyUserId">
            <td>
              <div class="user-profile">
                <div class="avatar-placeholder">{{ item.applyUserNickName.charAt(0) }}</div>
                <div class="user-info">
                  <span class="nickname">{{ item.applyUserNickName }}</span>
                  <span class="user-id-sub">ID: {{ item.applyUserId }}</span>
                </div>
              </div>
            </td>
            <td class="apply-info">{{ item.applyInfo || '请求添加你为好友' }}</td>
            <td class="time-col">{{ formatDate(item.applyTime) }}</td>
            <td>
              <span :class="['status-tag', getStatusClass(item.status)]">
                {{ getStatusText(item.status) }}
              </span>
            </td>
            <td class="text-center">
              <button v-if="item.status === 0" class="btn btn-handle" @click="openAuditModal(item)">
                处理
              </button>
              <span v-else class="text-gray">--</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <p>暂无新的申请记录</p>
      </div>
    </div>

    <!-- 处理审核弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>处理好友申请</h3>
          <span class="close-icon" @click="closeModal">×</span>
        </div>

        <div class="modal-body" v-if="currentApply">
          <div class="modal-user-card">
            <div class="modal-avatar">{{ currentApply.applyUserNickName.charAt(0) }}</div>
            <div class="modal-user-details">
              <div class="modal-name">{{ currentApply.applyUserNickName }}</div>
              <div class="modal-id">ID: {{ currentApply.applyUserId }}</div>
            </div>
          </div>

          <div class="info-row">
            <label>申请说明：</label>
            <div class="info-content">{{ currentApply.applyInfo || '无' }}</div>
          </div>
          <div class="info-row">
            <label>申请时间：</label>
            <div class="info-content">{{ formatDate(currentApply.applyTime) }}</div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="btn btn-secondary"
            @click="dealWithApply(currentApply.applyUserId, 2)"
            :disabled="actionLoading"
          >
            拒绝
          </button>
          <button
            class="btn btn-primary"
            @click="dealWithApply(currentApply.applyUserId, 1)"
            :disabled="actionLoading"
          >
            同意
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted } from 'vue'

const { proxy } = getCurrentInstance()

// 响应式数据
const list = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const error = ref(null)

// 弹窗相关数据
const showModal = ref(false)
const currentApply = ref(null)

// 状态枚举映射
const ApplyStatusEnum = {
  INIT: 0,
  PASS: 1,
  REJECT: 2,
  BLACKLIST: 3
}

// 格式化时间
const formatDate = (timestamp) => {
  if (!timestamp) return '--'
  const date = new Date(Number(timestamp))
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

// 获取状态文字
const getStatusText = (status) => {
  const map = {
    [ApplyStatusEnum.INIT]: '待处理',
    [ApplyStatusEnum.PASS]: '已同意',
    [ApplyStatusEnum.REJECT]: '已拒绝',
    [ApplyStatusEnum.BLACKLIST]: '已拉黑'
  }
  return map[status] || '未知'
}

// 获取状态样式类名
const getStatusClass = (status) => {
  const map = {
    [ApplyStatusEnum.INIT]: 'status-init',
    [ApplyStatusEnum.PASS]: 'status-pass',
    [ApplyStatusEnum.REJECT]: 'status-reject',
    [ApplyStatusEnum.BLACKLIST]: 'status-black'
  }
  return map[status] || ''
}

// 获取列表数据
const fetchContactApplyList = async () => {
  loading.value = true
  error.value = null
  try {
    let result = await proxy.Request({
      url: proxy.Api.contactNotice
    })
    if (!result) return

    if (result.data && Array.isArray(result.data)) {
      list.value = result.data
    } else if (result.data?.data && Array.isArray(result.data.data)) {
      list.value = result.data.data
    } else {
      list.value = []
    }
  } catch (err) {
    console.error('获取联系人申请失败:', err)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 打开审核弹窗
const openAuditModal = (item) => {
  currentApply.value = item
  showModal.value = true
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  currentApply.value = null
}

// 处理申请（同意/拒绝）
const dealWithApply = async (applyUserId, status) => {
  if (actionLoading.value) return

  actionLoading.value = true
  try {
    let result = await proxy.Request({
      url: proxy.Api.dealWithApply,
      params: {
        applyUserId: applyUserId,
        status: status
      }
    })

    if (!result) return

    // 关闭弹窗并刷新列表
    closeModal()
    proxy.Message?.success('操作成功') // 如果有全局消息提示
    await fetchContactApplyList()
  } catch (error) {
    console.error('处理申请失败', error)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchContactApplyList()
})
</script>

<style scoped>
/* 容器与基础布局 */
.contact-apply-list {
  padding: 24px;
  background-color: #fff;
  min-height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

.header-panel {
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.header-panel h2 {
  margin: 0;
  font-size: 20px;
  color: #1f1f1f;
  font-weight: 600;
  display: inline-block;
  margin-right: 12px;
}

.sub-title {
  color: #999;
  font-size: 14px;
}

/* 表格样式优化 */
.table-container {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.contact-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.contact-table th {
  background-color: #fafafa;
  color: #666;
  font-weight: 500;
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.contact-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
  font-size: 14px;
  color: #333;
}

.contact-table tr:hover td {
  background-color: #fbfbfb;
}

.contact-table tr:last-child td {
  border-bottom: none;
}

.text-center {
  text-align: center;
}

.time-col {
  color: #888;
  font-size: 13px;
}

/* 用户信息卡片 */
.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-weight: 500;
  color: #333;
  line-height: 1.2;
}

.user-id-sub {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-init {
  color: #fa8c16;
  background: #fff7e6;
  border: 1px solid #ffd591;
}

.status-pass {
  color: #52c41a;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.status-reject {
  color: #f5222d;
  background: #fff1f0;
  border: 1px solid #ffa39e;
}

.status-black {
  color: #bfbfbf;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
}

/* 按钮 */
.btn {
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-handle {
  background-color: #1890ff;
  color: white;
}
.btn-handle:hover {
  background-color: #40a9ff;
}

.text-gray {
  color: #ccc;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s ease;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-icon {
  cursor: pointer;
  font-size: 20px;
  color: #999;
}
.close-icon:hover {
  color: #666;
}

.modal-body {
  padding: 24px;
}

.modal-user-card {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #f0f0f0;
}

.modal-avatar {
  width: 48px;
  height: 48px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 12px;
}

.modal-user-details .modal-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}
.modal-user-details .modal-id {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.info-row {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-row label {
  color: #999;
  width: 80px;
}

.info-content {
  color: #333;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #fafafa;
  border-radius: 0 0 8px 8px;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}
.btn-secondary:hover {
  background: #fff;
  color: #f5222d;
  border-color: #f5222d;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
}
.btn-primary:hover {
  background: #40a9ff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.empty-state,
.loading-state,
.error-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>