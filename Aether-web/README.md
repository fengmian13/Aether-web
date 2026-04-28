# Aether Web

`Aether Web` 是一个基于 `Electron + Vue 3` 构建的桌面端即时通讯前端项目，主要用于聊天会话、联系人管理、文件消息展示，以及 1 对 1 音视频通话场景。

项目采用 Electron 承载桌面能力，渲染层使用 Vue 3 组合式 API，配合 `Element Plus`、`Pinia`、`Vue Router` 构建交互界面与状态管理；主进程负责窗口管理、本地存储、IPC 通信、托盘行为和部分本地文件能力。

## 项目介绍

当前项目定位为桌面聊天客户端，主要包含以下能力：

- 用户登录与基础信息管理
- 单聊 / 群聊会话列表与消息展示
- 联系人搜索、详情查看与群组相关页面
- 图片、文件、视频等消息内容展示
- 本地文件管理与资源落盘
- 基于 WebRTC 的 1 对 1 音视频通话
- Electron 托盘、窗口控制与本地 IPC 通信

## 技术栈

- `Electron`
- `Vue 3`
- `Vite / electron-vite`
- `Element Plus`
- `Pinia`
- `Vue Router`
- `Axios`
- `SQLite3`
- `WebSocket`
- `WebRTC`

## 目录结构

```text
.
├─ src
│  ├─ main                 # Electron 主进程：窗口、IPC、数据库、本地能力
│  ├─ preload              # 预加载脚本
│  └─ renderer             # Vue 前端页面与组件
│     └─ src
│        ├─ assets         # 样式、图标、静态资源
│        ├─ components     # 通用组件
│        ├─ router         # 路由配置
│        ├─ services       # 业务服务，如通话服务
│        ├─ stores         # Pinia 状态管理
│        ├─ utils          # 请求、校验、工具方法
│        └─ views          # 页面视图
├─ assets                  # 应用依赖资源，如 ffmpeg / 图片
├─ build                   # 打包图标与构建配置资源
├─ resources               # 应用资源文件
└─ installPackages         # 打包输出目录
```

## 环境要求

- `Node.js` 18 及以上
- `npm` 9 及以上

建议优先在 Windows 环境开发与打包，项目中包含 `ffmpeg.exe`、`ffprobe.exe` 等资源文件，Windows 体验会更直接。

## 项目构建与运行

### 1. 安装依赖

```bash
npm install
```

首次安装会执行 `electron-builder install-app-deps`，用于补齐 Electron 原生依赖。

### 2. 启动开发环境

```bash
npm run dev
```

开发模式下：

- Electron 主进程与渲染进程会同时启动
- 渲染层默认使用 `5000` 端口
- `/api` 请求会代理到 `http://localhost:6060`

### 3. 预览生产构建

```bash
npm run start
```

### 4. 构建前端产物

```bash
npm run build
```

该命令会使用 `electron-vite` 生成 Electron 主进程、预加载脚本和渲染层构建产物。

### 5. 打包桌面安装程序

Windows：

```bash
npm run build:win
```

macOS：

```bash
npm run build:mac
```

Linux：

```bash
npm run build:linux
```

打包产物默认输出到：

```text
installPackages/
```

## 开发说明

### 本地接口代理

`electron.vite.config.js` 中已配置开发代理：

- 前端访问前缀：`/api`
- 代理目标地址：`http://localhost:6060`

如果后端地址变化，可直接修改该文件中的 `proxy` 配置。

### 桌面端特性

项目不是纯 Web 前端，包含以下 Electron 桌面能力：

- 自定义窗口控制
- 系统托盘
- 本地文件保存与打开
- 本地数据库与本地设置存储
- 通过 `IPC` 实现渲染进程与主进程通信

### 通话能力说明

项目已接入 1 对 1 音视频通话能力，前端通过：

- HTTP 接口处理通话创建、接听、拒绝、挂断等状态流转
- WebSocket 处理信令收发
- WebRTC 建立点对点音视频连接

## 主要页面

- 登录页
- 聊天页
- 联系人页
- 群组详情页
- 设置页
- 文件管理页
- 音视频通话弹窗

## 常用命令

```bash
npm run dev
npm run build
npm run build:win
npm run build:mac
npm run build:linux
npm run lint
npm run format
```

## 补充说明

- 当前项目包名为 `easychat-front`，桌面应用名称配置为 `EasyChat`
- 主窗口标题显示为 `Aether`
- Windows 安装包名称默认格式为 `EasyChatSetup.<version>.exe`

如果需要，我还可以继续帮你补一版更偏对外展示的 README，比如加入产品截图区、功能亮点区和更正式的部署说明。 
