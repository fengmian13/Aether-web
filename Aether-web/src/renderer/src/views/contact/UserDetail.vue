<template>
  <div class="wechat-container">
    <!-- 顶部导航栏 -->

    <!-- 主要内容区域 (可滚动，如果内容超出) -->
    <div class="content-scroll-area">
      <!-- 个人信息头部 -->
      <div class="profile-header">
        <div class="avatar-box">
          <img v-if="user.avatar" :src="user.avatar" class="avatar" />
          <div v-else class="avatar-placeholder"></div>
        </div>
        <div class="info-box">
          <div class="nickname-row">
            <h2 class="nickname">{{ user.nickname || '昵称' }}</h2>
            <div v-if="user.gender" class="gender-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="#ec4899"
                stroke="#ec4899"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 23a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2" />
              </svg>
            </div>
          </div>
          <p class="sub-text">账号ID： {{ user.wechatId }}</p>
          <p class="sub-text">地区： {{ user.region }}</p>
        </div>
        <div class="more-icon">
          <svg
            class="icon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </div>
      </div>

      <!-- 分组 1 -->
      <div class="group-section">
        <div class="cell">
          <span class="label">备注</span>
          <span class="value placeholder-text">{{ user.alias || '添加备注名' }}</span>
        </div>
        <div class="cell last-cell">
          <span class="label">标签</span>
          <span class="value dark-text">{{
            user.tags && user.tags.length ? user.tags.join('，') : ''
          }}</span>
        </div>
      </div>

      <!-- 分组 2 -->
      <div class="group-section">
        <div class="cell last-cell">
          <span class="label">动态</span>
          <div class="moments-list">
            <template v-if="user.moments && user.moments.length">
              <img
                v-for="(img, index) in user.moments"
                :key="index"
                :src="img"
                class="moment-img"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- 分组 3 -->
      <div class="group-section mb-large">
        <div class="cell last-cell">
          <span class="label">来源</span>
          <span class="value dark-text">{{ user.source }}</span>
        </div>
      </div>

      <!-- 底部按钮 (放在内容流最后，或者您可以根据需要固定在底部) -->
      <div class="footer-area">
        <div class="action-btn">
          <div class="icon-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#576b95"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span class="btn-text">发消息</span>
        </div>

        <div class="action-btn">
          <div class="icon-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#576b95"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
              />
            </svg>
          </div>
          <span class="btn-text">语音聊天</span>
        </div>

        <div class="action-btn">
          <div class="icon-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#576b95"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <span class="btn-text">视频聊天</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      user: {
        nickname: '',
        wechatId: '',
        region: '',
        avatar: '',
        gender: '',
        alias: '',
        tags: [],
        source: '',
        moments: []
      }
    }
  }
}
</script>

<style scoped>
/* 全局容器：铺满父级，无滚动条 */
.wechat-container {
  width: 100%;
  height: 100%;
  background-color: #ededed;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止最外层出现滚动条 */
}

/* 顶部导航 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0; /* 防止导航栏被压缩 */
}
.icon {
  color: #1a1a1a;
  cursor: pointer;
}

/* 内容区域：自动填充剩余高度，内部可滚动 */
.content-scroll-area {
  flex: 1;
  overflow-y: auto; /* 如果屏幕真的很矮，允许内部滚动，但不影响整体布局 */
  display: flex;
  flex-direction: column;
}

/* 头部个人信息 */
.profile-header {
  display: flex;
  padding: 24px;
  background-color: #fff;
  margin-bottom: 8px;
}
.avatar-box {
  margin-right: 20px;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
  background-color: #eee;
  display: block;
}
.avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  background-color: #eee;
}
.info-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.nickname-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.nickname {
  font-size: 20px;
  font-weight: 600;
  color: #111;
  margin: 0;
  margin-right: 8px;
  line-height: 1.2;
}
.gender-icon {
  background-color: #fce7f3;
  border-radius: 50%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sub-text {
  font-size: 14px;
  color: #7f7f7f;
  margin: 2px 0;
  line-height: 1.4;
}

/* 分组样式：填满宽度 */
.group-section {
  background-color: #fff;
  padding-left: 20px;
  margin-bottom: 8px;
  width: 100%; /* 确保填满 */
}
.mb-large {
  margin-bottom: 32px;
}
.cell {
  display: flex;
  align-items: center;
  padding: 16px 16px 16px 0;
  border-bottom: 1px solid #e5e5e5;
}
.last-cell {
  border-bottom: none;
}
.label {
  font-size: 16px;
  color: #333;
  width: 80px;
  flex-shrink: 0;
}
.value {
  font-size: 16px;
  flex: 1;
}
.placeholder-text {
  color: #7f7f7f;
}
.dark-text {
  color: #111;
}

/* 朋友圈图片列表 */
.moments-list {
  display: flex;
  gap: 6px;
  overflow: hidden;
  flex: 1;
}
.moment-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  background-color: #eee;
}

/* 底部按钮区域 */
.footer-area {
  background-color: #ededed; /* 与背景同色 */
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  margin-top: auto; /* 将按钮推到底部（如果内容少的话） */
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  background: transparent;
  border: none;
}
.action-btn:active {
  opacity: 0.7;
}
.icon-box {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.btn-text {
  font-size: 12px;
  color: #576b95;
  font-weight: 500;
}
</style>