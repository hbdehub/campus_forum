<template>
  <div class="layout">
    <!-- 顶部导航 -->
    <el-header class="header">
      <el-button @click="goBack" icon="ArrowLeft">返回列表</el-button>
      <div class="logo">帖子详情</div>
    </el-header>

    <el-main class="main-content" v-loading="loading">
      <!-- 1. 帖子主体内容 -->
      <el-card class="post-card" shadow="never" v-if="post.id">
        <h1 class="post-title">{{ post.title }}</h1>
        
        <div class="post-meta">
          <span class="author">👤 {{ post.nickname || '匿名用户' }}</span>
          <span class="time">🕒 {{ formatDate(post.created_at) }}</span>
        </div>
        
        <div class="post-content">{{ post.content }}</div>
        
        <div class="post-actions">
          <!-- 点赞按钮 -->
          <el-button 
            :type="isLiked ? 'danger' : 'default'" 
            round 
            @click="handleLike"
          >
            <span v-if="isLiked">❤️ 已赞 ({{ post.like_count }})</span>
            <span v-else>🤍 点赞 ({{ post.like_count }})</span>
          </el-button>
        </div>
      </el-card>

      <!-- 2. 评论区 -->
      <el-card class="comment-section" shadow="never" v-if="post.id">
        <h3 class="section-title">全部评论 ({{ post.comment_count || 0 }})</h3>
        
        <!-- 发表评论输入框 -->
        <div class="comment-input-box">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="友善发言，分享你的看法..."
          />
          <el-button 
            type="primary" 
            class="submit-comment-btn" 
            @click="handleComment" 
            :loading="commentLoading"
          >
            发表评论
          </el-button>
        </div>

        <!-- 评论列表 -->
        <div class="comment-list" v-if="comments.length > 0">
          <div class="comment-item" v-for="comment in comments" :key="comment.id">
            <div class="comment-user">
              <span class="comment-author">👤 {{ comment.nickname || '匿名用户' }}</span>
              <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
        <el-empty v-else description="还没有评论，快来抢沙发吧！" :image-size="80"></el-empty>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const postId = route.params.id // 从路由地址中获取帖子 ID

// 状态变量
const loading = ref(false)
const post = ref({})
const comments = ref([])
const isLiked = ref(false) // 记录当前用户是否已赞（仅针对本次页面）

const commentContent = ref('')
const commentLoading = ref(false)

// 1. 获取帖子详情
const fetchPostDetail = async () => {
  try {
    const res = await request.get(`/post/${postId}`)
    if (res.code === 200) {
      post.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    console.error('获取详情失败', error)
  }
}

// 2. 获取评论列表
const fetchComments = async () => {
  try {
    const res = await request.get(`/comments/${postId}`)
    if (res.code === 200) {
      comments.value = res.data
    }
  } catch (error) {
    console.error('获取评论失败', error)
  }
}

// 页面加载时同时调用两个接口
onMounted(async () => {
  loading.value = true
  await Promise.all([fetchPostDetail(), fetchComments()])
  loading.value = false
})

// 3. 点赞/取消点赞逻辑
const handleLike = async () => {
  try {
    const res = await request.post('/like', { postId })
    if (res.code === 200) {
      // 后端会返回 liked: true 或 false
      isLiked.value = res.liked
      ElMessage.success(res.msg)
      
      // 更新页面上的点赞数
      if (res.liked) {
        post.value.like_count++
      } else {
        post.value.like_count--
      }
    }
  } catch (error) {
    console.error('点赞失败', error)
  }
}

// 4. 发表评论逻辑
const handleComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  commentLoading.value = true
  try {
    const res = await request.post('/comment', {
      postId: postId,
      content: commentContent.value
    })
    
    if (res.code === 200) {
      ElMessage.success('评论成功')
      commentContent.value = '' // 清空输入框
      post.value.comment_count++ // 评论数加一
      fetchComments() // 重新拉取评论列表，展示新评论
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    console.error('评论失败', error)
  } finally {
    commentLoading.value = false
  }
}

// 返回列表页
const goBack = () => {
  router.push('/posts')
}

// 格式化时间
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
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
  align-items: center;
  padding: 0 20px;
  height: 60px;
  gap: 20px;
}
.logo {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
.main-content {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.post-title {
  margin-top: 0;
  color: #303133;
}
.post-meta {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
}
.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 30px;
  white-space: pre-wrap; /* 保留内容里的换行 */
}
.post-actions {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 评论区样式 */
.comment-section {
  margin-bottom: 40px;
}
.section-title {
  margin-top: 0;
  font-size: 18px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}
.comment-input-box {
  margin-bottom: 30px;
}
.submit-comment-btn {
  margin-top: 10px;
  float: right;
}
.comment-list {
  clear: both;
  margin-top: 20px;
}
.comment-item {
  padding: 15px 0;
  border-bottom: 1px dashed #ebeef5;
}
.comment-user {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #909399;
}
.comment-author {
  font-weight: bold;
  color: #409EFF;
}
.comment-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}
</style>