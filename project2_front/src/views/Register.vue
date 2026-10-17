<template>
  <div class="register-container">
    <el-card class="register-card">
      <h2 class="title">校园论坛注册</h2>
      <el-form :model="registerForm" label-width="70px">
        <el-form-item label="账号">
          <el-input v-model="registerForm.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="registerForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-button type="success" class="register-btn" @click="handleRegister" :loading="loading">
          注 册
        </el-button>
        <div class="footer-link">
          已有账号？<el-link type="primary" @click="$router.push('/login')">去登录</el-link>
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
const registerForm = ref({
  username: '',
  password: '',
  nickname: ''
})

const handleRegister = async () => {
  if (!registerForm.value.username || !registerForm.value.password) {
    ElMessage.warning('账号和密码不能为空')
    return
  }

  loading.value = true
  try {
    const res = await request.post('/register', registerForm.value)
    ElMessage.success(res.msg || '注册成功！')
    // 注册成功后跳回登录页
    router.push('/login')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
}
.register-card {
  width: 400px;
  padding: 20px;
}
.title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
.register-btn {
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