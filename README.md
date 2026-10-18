# 校园论坛项目 (Campus Forum)

## 📖 项目简介
本项目是一个基于前后端分离的校园论坛系统，实现了用户的注册、登录、发帖、查看帖子列表、帖子详情、点赞以及评论功能。界面使用了 Element Plus 组件库，简洁美观。

## 🛠️ 技术栈
* **前端**：Vue 3 + Vite + Vue Router + Element Plus + Axios
* **后端**：Node.js + Express + JSONWebToken (JWT)
* **数据库**：MySQL

## 🚀 功能列表
- [x] 用户注册与登录 (JWT鉴权)
- [x] 帖子列表展示
- [x] 发布新帖子
- [x] 帖子详情展示
- [x] 点赞/取消点赞
- [x] 发表评论
- [x] 路由守卫（未登录拦截）

## 💻 本地运行指南
### 1. 后端启动
1. 进入 `project2` 目录。
2. 运行 `npm install` 安装依赖。
3. 在 MySQL 中创建名为 `campus_forum` 的数据库，并导入 `.sql` 建表语句。
4. 修改 `index.js` 中的数据库配置（用户名、密码）。
5. 运行 `node index.js`，服务将在 `http://localhost:3000` 启动。

### 2. 前端启动
1. 进入 `project2_front` 目录。
2. 运行 `npm install` 安装依赖。
3. 运行 `npm run dev`。
4. 在浏览器访问 `http://localhost:5173`。

## 🌐 在线演示
由于后端部署在本地，演示链接依赖电脑开机，若失效可参考上方本地运行指南
