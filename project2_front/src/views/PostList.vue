<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="logo">校园论坛</div>
      <div class="user-info">
        <span class="welcome">欢迎，{{ userInfo.nickname || userInfo.username }}</span>
        <el-button type="primary" @click="goToCreate">发 帖</el-button>
        <el-button type="danger" plain @click="handleLogout">退出</el-button>
      </div>
    </el-header>

    <!-- 主体内容区 -->
    <el-main class="main-content" v-loading="loading">
      <div class="post-list">
        <!-- 循环渲染每一条帖子 -->
        <el-card 
          v-for="post in posts" 
          :key="post.id" 
          class="post-card" 
          shadow="hover"
          @click="goToDetail(post.id)"
        >
          <template #header>
            <div class="card-header">
              <span class="post-title">{{ post.title }}</span>
            </div>
          </template>
          
          <div class="post-content">{{ post.content }}</div>
          
          <div class="card-footer">
            <div class="post-meta">
              <span class="author">👤 {{ post.nickname || '匿名用户' }}</span>
              <span class="time">🕒 {{ formatDate(post.created_at) }}</span>
            </div>
            <div class="post-stats">
              <span>❤️ {{ post.like_count }} 点赞</span>
              <span>💬 {{ post.comment_count }} 评论</span>
            </div>
          </div>
        </el-card>
        
        <!-- 如果没数据，显示提示 -->
        <el-empty v-if="posts.length === 0 && !loading" description="还没有帖子，快去发第一个吧！"></el-empty>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()

// 响应式变量
const posts = ref([])    // 存放帖子列表
const loading = ref(false) // 控制加载动画
// 获取本地保存的用户信息
const userInfo = ref(JSON.parse(localStorage.getItem('user')) || {})

// 1. 获取帖子列表的函数
const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await request.get('/posts')
    if (res.code === 200) {
      posts.value = res.data // 你的后端返回的数据在 res.data 里
    }
  } catch (error) {
    console.error('获取帖子失败', error)
  } finally {
    loading.value = false
  }
}

// 2. 页面一加载，就自动请求数据
onMounted(() => {
  fetchPosts()
})

// 3. 跳转到详情页
const goToDetail = (id) => {
  router.push(`/post/${id}`)
}

// 4. 跳转到发帖页
const goToCreate = () => {
  router.push('/create')
}

// 5. 退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 6. 格式化时间（把后端复杂的时间格式变好看）
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString() // 例如：2023/10/17 22:30:00
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background-color: #f5f7fa;
}
.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
}
.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}
.welcome {
  font-size: 14px;
  color: #606266;
}
.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.post-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}
.post-card:hover {
  transform: translateY(-2px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.post-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
  /* 限制内容显示两行，多出来的用省略号 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
  border-top: 1px solid #ebeef5;
  padding-top: 10px;
}
.post-meta {
  display: flex;
  gap: 15px;
}
.post-stats {
  display: flex;
  gap: 15px;
}
</style>