<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="title">校园论坛登录</h2>
      <el-form :model="loginForm" label-width="70px">
        <el-form-item label="账号">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">
          登 录
        </el-button>
        <div class="footer-link">
          没有账号？<el-link type="primary" @click="$router.push('/register')">去注册</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const loading = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  loading.value = true
  try {
    // 发送请求给后端
    const res = await request.post('/login', loginForm.value)
    
    // 你的后端成功时返回的是 { msg, token, user }
    if (res.token) {
      ElMessage.success('登录成功！')
      // 把 token 和用户信息存到本地，供后续使用
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      // 跳转到帖子列表页
      router.push('/posts')
    }
  } catch (error) {
    // 失败的情况已经在 request.js 的拦截器里处理了，这里不用写
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}
.login-card {
  width: 400px;
  padding: 20px;
}
.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
.login-btn {
  width: 100%;
  margin-top: 10px;
}
.footer-link {
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
  color: #666;
}
</style>