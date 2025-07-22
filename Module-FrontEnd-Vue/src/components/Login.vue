<template>
  <div class="content">
    <div class="title">
      水质预测平台
    </div>
    <!-- 登录表单区域 -->
    <div id="login">
      <div class="login_title">登入</div>
      <Form ref="loginFormRef" :model="loginForm">
        <!-- 用户名输入 -->
        <FormItem
          prop="username"
          :error="hasLoginError('username') ? getLoginError('username') : ''"
        >
          <Input
            type="text"
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :status="hasLoginError('username') ? 'error' : ''"
            @on-enter="handleLogin"
          >
            <template #prepend>
              <Icon type="ios-person-outline"/>
            </template>
          </Input>
        </FormItem>

        <!-- 密码输入 -->
        <FormItem
          prop="password"
          id="password"
          :error="hasLoginError('password') ? getLoginError('password') : ''"
        >
          <Input
            type="password"
            v-model="loginForm.password"
            placeholder="请输入密码"
            :status="hasLoginError('password') ? 'error' : ''"
            @on-enter="handleLogin"
          >
            <template #prepend>
              <Icon type="ios-lock-outline"/>
            </template>
          </Input>
        </FormItem>

        <!-- 注册链接 -->
        <Row class="register">
          <a @click="showRegister">没有账户？点击注册</a>
        </Row>

        <!-- 登录按钮 -->
        <FormItem id="submitButton">
          <Button
            type="primary"
            size="large"
            :loading="isLoginLoading"
            :disabled="!canLogin"
            @click="handleLogin"
          >
            {{ isLoginLoading ? '登录中...' : '登入' }}
          </Button>
        </FormItem>
      </Form>
    </div>
    <div class="footer">
      <span> &copy;2025 NCUT</span>
    </div>
    <!-- 注册模态框 -->
    <Modal
      v-model="showRegisterModal"
      title="用户注册"
      :closable="false"
    >
      <!-- 用户名输入 -->
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>用户名</span>
        </Col>
        <Col span="8" offset="1">
          <Input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :status="hasRegisterError('username') ? 'error' : ''"
          />
          <div v-if="hasRegisterError('username')" class="error-message">
            {{ getRegisterError('username') }}
          </div>
        </Col>
      </Row>

      <!-- 密码输入 -->
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input
            type="password"
            v-model="registerForm.password"
            placeholder="请输入密码（至少3位）"
            :status="hasRegisterError('password') ? 'error' : ''"
          />
          <div v-if="hasRegisterError('password')" class="error-message">
            {{ getRegisterError('password') }}
          </div>
        </Col>
      </Row>

      <!-- 确认密码输入 -->
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>确认密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input
            type="password"
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            :status="hasRegisterError('confirmPassword') ? 'error' : ''"
          />
          <div v-if="hasRegisterError('confirmPassword')" class="error-message">
            {{ getRegisterError('confirmPassword') }}
          </div>
        </Col>
      </Row>

      <!-- 自定义对话框按钮，代替原来自动关闭的逻辑 -->
      <template #footer>
        <Button type="text" size="large" @click="handleRegisterCancel">取消</Button>
        <Button type="primary" size="large" @click="handleRegister">注册</Button>
      </template>
    </Modal>
  </div>
</template>

/**
* 登录组件
* @description 用户登录和注册
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, computed} from 'vue'
import {useRouter} from 'vue-router'

// ============================ UI组件导入 ============================
import {Button, Col, Form, FormItem, Icon, Input, Modal, Row} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useAuthStore} from '@/stores/auth'

// ============================ 工具函数导入 ============================
import {useForm} from '@/composables'
import {createConfirmPasswordValidator, passwordRules, usernameRules} from '@/utils/validation'
import {ErrorHandler} from '@/utils/error-handler'

// ============================ 路由和状态初始化 ============================
const router = useRouter()
const authStore = useAuthStore()

// ============================ 表单引用 ============================
const loginFormRef = ref(null)

// ============================ 响应式数据定义 ============================

/** 登录表单数据 */
const loginForm = reactive({
  username: '',
  password: ''
})

/** 注册表单数据 */
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

/** 注册模态框显示状态 */
const showRegisterModal = ref(false)

/** 登录按钮加载状态 */
const isLoginLoading = ref(false)

// ============================ 表单验证配置 ============================

/**
 * 登录表单验证规则
 */
const loginFormRules = {
  username: usernameRules,
  password: passwordRules,
};

/** 登录表单验证 */
const {
  validateAll: validateLoginForm,
  hasFieldError: hasLoginError,
  getFieldError: getLoginError,
  resetForm: resetLoginForm,
} = useForm(loginForm, loginFormRules)

/**
 * 注册表单验证规则
 */
const registerFormRules = {
  username: usernameRules,
  password: passwordRules,
  confirmPassword: [
    {
      required: true,
      message: '请再次输入密码',
      trigger: 'blur'
    },
    {
      validator: (confirmPassword) => createConfirmPasswordValidator(registerForm.password)(confirmPassword),
      message: '两次密码不相同',
      trigger: 'blur'
    }
  ],
};

/** 注册表单验证 */
const {
  validateAll: validateRegisterForm,
  hasFieldError: hasRegisterError,
  getFieldError: getRegisterError,
  resetForm: resetRegisterForm,
} = useForm(registerForm, registerFormRules)

// ============================ 计算属性 ============================

/** 是否可以登录 */
const canLogin = computed(() => {
  return loginForm.username.trim() && loginForm.password.trim() && !isLoginLoading.value
})

// ============================ 业务方法 ============================

/**
 * 处理登录提交
 * 使用新的状态管理系统进行登录
 */
const handleLogin = async () => {
  // 重置表单
  resetLoginForm()
  // 验证表单
  const isValid = await validateLoginForm()
  if (!isValid) {
    return
  }

  try {
    isLoginLoading.value = true

    // 使用状态管理进行登录
    const success = await authStore.login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (success) {
      // 登录成功，重定向到管理页面
      await router.replace({path: '/manage'})
    }
  } catch (error) {
    // 错误处理由状态管理层处理
    ErrorHandler.handleGenericError(error, '用户登录')
  } finally {
    isLoginLoading.value = false
    // 清空
    loginForm.username = ''
    loginForm.password = ''
  }
}

/**
 * 处理用户注册
 * 使用新的状态管理系统和表单验证
 */
const handleRegister = async () => {
  try {
    // 重置表单验证状态
    resetRegisterForm()
    // 验证注册表单
    const isValid = await validateRegisterForm()
    if (!isValid) {
      // 验证失败
      return
    }

    // 使用状态管理进行注册
    const success = await authStore.register({
      username: registerForm.username,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword
    })

    if (success) {
      // 注册成功，手动关闭模态框并重置表单
      showRegisterModal.value = false
      resetRegisterForm()
    } else {
      // 错误处理由状态管理层处理
      ErrorHandler.handleGenericError(new Error('注册失败'), '用户注册')
    }
  } catch (error) {
    // 错误处理由状态管理层处理
    ErrorHandler.handleGenericError(error, '用户注册')
  } finally {
    // 清空
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
  }
}

/**
 * 显示注册模态框
 */
const showRegister = () => {
  resetRegisterForm()
  showRegisterModal.value = true
}

/**
 * 处理注册模态框取消
 */
const handleRegisterCancel = () => {
  resetRegisterForm()
  showRegisterModal.value = false
}
</script>

<style scoped>
#login {
  font-size: 14px;
  margin: 80px auto 0;
  padding: 50px;
  width: 360px;
  height: 280px;
  box-shadow: darkgrey 2px 2px 10px 2px;
  background: #ffffff;
}

.title {
  margin-top: 80px;
  font-size: 46px;
  color: white;
}

.login_title {
  font-size: 20px;
  font-weight: bold;
  color: #3399FF;
  margin-bottom: 15px;
}

#login img {
  margin-bottom: 20px;
}

#submitButton {
  margin-top: 20px;
}

.footer {
  font-size: 16px;
  margin-top: 100px;
  text-align: center;
  color: gray;
}

.register {
  margin-top: 15px !important;
}

#password {
  margin-bottom: 10px;
}

#submitButton {
  margin-top: 10px;
}

.editLine {
  font-size: 12px;
  line-height: 32px;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 表单验证错误信息样式 */
.error-message {
  color: #ed4014;
  font-size: 11px;
  margin-top: 2px;
  line-height: 1.4;
}

</style>
