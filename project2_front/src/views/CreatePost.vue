<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="logo">发布新帖</div>
      <el-button @click="goBack">返回列表</el-button>
    </el-header>

    <!-- 发帖表单 -->
    <el-main class="main-content">
      <el-card shadow="never" class="form-card">
        <el-form :model="postForm" label-position="top">
          <el-form-item label="帖子标题" required>
            <el-input 
              v-model="postForm.title" 
              placeholder="请输入一个吸引人的标题" 
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="帖子内容" required>
            <el-input 
              v-model="postForm.content" 
              type="textarea" 
              :rows="10"
              placeholder="写点什么吧..." 
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="submit-btn" 
              @click="handleSubmit" 
              :loading="loading"
            >
              确认发布
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const loading = ref(false)

const postForm = ref({
  title: '',
  content: ''
})

// 提交发帖
const handleSubmit = async () => {
  if (!postForm.value.title.trim() || !postForm.value.content.trim()) {
    ElMessage.warning('标题和内容不能为空')
    return
  }

  loading.value = true
  try {
    // 发送 POST 请求，request.js 会自动带上 token
    const res = await request.post('/post', postForm.value)
    
    // 你的后端返回格式：{ code: 200, msg: "发布成功", postId: xxx }
    if (res.code === 200) {
      ElMessage.success('发布成功！')
      // 发布成功后，跳回帖子列表页
      router.push('/posts')
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/posts')
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
.main-content {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}
.form-card {
  border-radius: 8px;
}
.submit-btn {
  width: 100%;
  margin-top: 20px;
}
</style>