<template>
  <div class="layout">
    <Layout :style="{minHeight: '100vh'}">
      <Header class="title" style="z-index: 999">
        <Row>
          <Col span="8" style="text-align: left; line-height: 54px">水质预测平台</Col>
          <Col span="4" offset="12" style="line-height: 54px">
            <Dropdown transfer>
              <a href="javascript:void(0)" style="color: white">
                {{ currentUser.username }}
                <Icon type="ios-arrow-down"></Icon>
              </a>
              <template #list>
                <DropdownMenu>
                  <DropdownItem name="info" @click="dropDownClicked('info')">用户信息</DropdownItem>
                  <DropdownItem name="editPassword" @click="dropDownClicked('handleEditPassword')">更新密码</DropdownItem>
                  <DropdownItem name="logout" @click="dropDownClicked('logout')">注销</DropdownItem>
                </DropdownMenu>
              </template>
            </Dropdown>
          </Col>
        </Row>
      </Header>
      <Layout>
        <Sider class="sider">
          <Menu
            class="menu"
            :open-names="openNames"
            theme="light"
            width="auto"
            :active-name="activeName"
          >
            <Submenu name="1">
              <template #title>
                <Icon type="ios-archive"/>
                水质
              </template>
              <MenuItem name="/recent" @click="navigateTo('/recent')">近期数据</MenuItem>
              <MenuItem name="/manage" @click="navigateTo('/manage')">历史数据</MenuItem>
              <MenuItem name="/trend" @click="navigateTo('/trend')">趋势一览</MenuItem>
            </Submenu>

            <Submenu name="2">
              <template #title>
                <Icon type="md-trending-up"/>
                模型
              </template>
              <MenuItem name="/model" @click="navigateTo('/model')">模型管理</MenuItem>
              <MenuItem name="/train" @click="navigateTo('/train')">模型训练</MenuItem>
            </Submenu>

            <!-- 用户管理菜单组 - 仅管理员可见 -->
            <Submenu name="3" v-if="showUserMenu">
              <template #title>
                <Icon type="ios-contact"/>
                用户
              </template>
              <MenuItem name="/user" @click="navigateTo('/user')">
                用户管理
              </MenuItem>
            </Submenu>
          </Menu>
        </Sider>
        <Layout>
          <Content>
            <router-view></router-view>
          </Content>
          <Footer class="footer">
            &copy; 2025 NCUT
          </Footer>
        </Layout>
      </Layout>
    </Layout>
    <Modal v-model="info_modal_flag" title="用户信息" :footer-hide="true">
      <Row class="editLine">
        <Col span="4" offset="3" style="text-align: left">
          <span>用户名</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{ currentUser.username }}</span>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="3" style="text-align: left">
          <span>角色</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{ currentUser.role }}</span>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="3" style="text-align: left">
          <span>权限</span>
        </Col>
        <Col span="12" offset="1">
          <span>{{ currentUser.authority }}</span>
        </Col>
      </Row>
    </Modal>
    <!-- 密码修改模态框 -->
    <Modal
      v-model="pwd_modal_flag"
      title="更改密码"
      :closable="false"
    >
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>旧密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input
            size="small"
            type="password"
            v-model="password.originPassword"
            :status="hasFieldError('originPassword') ? 'error' : ''"
            placeholder="请输入当前密码"
            style="width: 200px"
          />
          <div v-if="hasFieldError('originPassword')" class="error-message">
            {{ getFieldError('originPassword') }}
          </div>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>新密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input
            size="small"
            type="password"
            v-model="password.newPassword"
            :status="hasFieldError('newPassword') ? 'error' : ''"
            placeholder="请输入新密码（至少3位）"
            style="width: 200px"
          />
          <div v-if="hasFieldError('newPassword')" class="error-message">
            {{ getFieldError('newPassword') }}
          </div>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>再次输入新密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input
            size="small"
            type="password"
            v-model="password.confirmPassword"
            :status="hasFieldError('confirmPassword') ? 'error' : ''"
            placeholder="请再次输入新密码"
            style="width: 200px"
          />
          <div v-if="hasFieldError('confirmPassword')" class="error-message">
            {{ getFieldError('confirmPassword') }}
          </div>
        </Col>
      </Row>

      <!-- 自定义对话框按钮，代替原来自动关闭的逻辑 -->
      <template #footer>
        <Button type="text" size="large" @click="handleEditPasswordCancel">取消</Button>
        <Button type="primary" size="large" @click="handleEditPassword">注册</Button>
      </template>
    </Modal>
  </div>
</template>

/**
* 主布局组件
* @description 包含头部导航、侧边栏菜单等
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, onMounted, watch, computed} from 'vue'
import {useRouter, useRoute} from 'vue-router'

// ============================ UI组件导入 ============================
import {
  Button,
  Col, Content, Dropdown,
  DropdownItem,
  DropdownMenu, Footer,
  Header,
  Icon,
  Input,
  Layout, Menu,
  MenuItem,
  Modal, Row,
  Sider,
  Submenu
} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useAuthStore} from '@/stores/auth'
import {useUserStore} from '@/stores/user'

// ============================ 工具函数导入 ============================
import {useForm} from '@/composables'
import {createConfirmPasswordValidator, passwordRules} from '@/utils/validation'
import {ErrorHandler} from '@/utils/error-handler'

// ============================ 路由和状态初始化 ============================
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()

// ============================ 响应式数据定义 ============================

/** 当前激活的菜单项 */
const activeName = ref(route.path)

/** 密码修改表单数据 */
const password = reactive({
  originPassword: '',
  newPassword: '',
  confirmPassword: ''
})

/** 用户信息模态框显示状态 */
const info_modal_flag = ref(false)

/** 密码修改模态框显示状态 */
const pwd_modal_flag = ref(false)

/** 密码修改加载状态 */
const isPasswordLoading = ref(false)

/** 展开的菜单组 */
const openNames = ref([])

// ============================ 计算属性 ============================

/** 当前用户信息（从状态管理获取） */
const currentUser = computed(() => authStore.currentUser || {})

/** 是否显示用户管理菜单（仅管理员可见） */
const showUserMenu = computed(() => authStore.isAdmin)

// ============================ 表单验证配置 ============================

/** 密码修改表单验证规则 */
const passwordFormRules = {
  originPassword: [
    {
      required: true,
      message: '请输入当前密码',
      trigger: 'blur'
    }
  ],
  newPassword: passwordRules,
  confirmPassword: [
    {
      required: true,
      message: '请再次输入密码',
      trigger: 'blur'
    },
    {
      validator: (confirmPassword) => createConfirmPasswordValidator(password.newPassword)(confirmPassword),
      message: '两次密码不相同',
      trigger: 'blur'
    }
  ]
}

/** 密码修改表单验证组合函数 */
const {
  validateAll: validatePassword,
  hasFieldError,
  getFieldError,
  resetForm: resetPasswordForm,
} = useForm(password, passwordFormRules)

// ============================ 监听器 ============================

/**
 * 监听路由变化，更新菜单状态
 * 根据当前路径自动展开对应的菜单组
 */
watch(
  () => route.path,
  (newPath) => {
    activeName.value = newPath

    // 根据当前路径决定展开哪个选项卡
    if (['/recent', '/manage', '/trend'].includes(newPath)) {
      openNames.value = ['1'] // 水质菜单组
    } else if (['/model', '/train'].includes(newPath)) {
      openNames.value = ['2'] // 模型菜单组
    } else if (['/user'].includes(newPath)) {
      openNames.value = ['3'] // 用户管理菜单组
    } else {
      openNames.value = []
    }
  },
  {immediate: true}
)

// ============================ 业务方法 ============================

/**
 * 检查并初始化用户登录状态
 * 如果用户未登录，则重定向到登录页面
 * 此方法使用新的认证状态管理替代原有逻辑
 */
const initializeUserState = async () => {
  try {
    // 检查用户是否已登录
    if (!authStore.isLoggedIn) {
      // 尝试从本地存储恢复登录状态
      await authStore.initializeAuth()

      // 如果仍未登录，重定向到登录页
      if (!authStore.isLoggedIn) {
        await router.replace({path: '/'})
        return
      }
    }

    // 刷新用户信息确保数据最新
    await authStore.refreshUser()
  } catch (error) {
    ErrorHandler.handleGenericError(error, '初始化用户状态')
    // 如果初始化失败，重定向到登录页
    await router.replace({path: '/'})
  }
}

/**
 * 处理用户下拉菜单点击事件
 * @param {string} name 菜单项名称
 */
const dropDownClicked = (name) => {
  switch (name) {
    case 'logout':
      handleLogout()
      break
    case 'info':
      showUserInfo()
      break
    case 'handleEditPassword':
      showPasswordModal()
      break
    default:
      console.warn(`Unknown dropdown action: ${name}`)
  }
}

/**
 * 显示用户信息模态框
 */
const showUserInfo = () => {
  info_modal_flag.value = true
}

/**
 * 显示密码修改模态框
 */
const showPasswordModal = () => {
  resetPasswordForm() // 重置表单
  pwd_modal_flag.value = true
}

/**
 * 处理用户注销
 * 使用状态管理中的注销方法，提供更好的错误处理
 */
const handleLogout = async () => {
  try {
    const success = await authStore.logout()

    if (success) {
      // 注销成功，重定向到登录页
      await router.replace({path: '/'})
    }
    // 错误处理由状态管理层处理，无需额外处理
  } catch (error) {
    ErrorHandler.handleGenericError(error, '用户注销')
  }
}

/**
 * 处理密码修改
 * 使用状态管理中的密码修改方法和新的表单验证系统
 */
const handleEditPassword = async () => {
  try {
    // 开始loading
    isPasswordLoading.value = true

    // 重置表单验证状态
    resetPasswordForm()
    // 验证表单
    const isValid = await validatePassword()

    if (!isValid) {
      // 验证失败，不关闭Modal
      return false
    }

    // 使用状态管理中的密码修改方法
    const success = await userStore.changePassword(
      currentUser.value.id,
      {
        originPassword: password.originPassword,
        newPassword: password.newPassword
      }
    )

    if (success) {
      // 密码修改成功，手动关闭模态框并重置表单
      pwd_modal_flag.value = false
      resetPasswordForm()
      return true
    } else {
      // 修改失败，不关闭Modal
      ErrorHandler.handleGenericError(new Error('密码修改失败'), '修改密码')
      return false
    }
  } catch (error) {
    // 出现错误，不关闭Modal
    ErrorHandler.handleGenericError(error, '修改密码')
    return false
  } finally {
    // 确保停止loading
    isPasswordLoading.value = false
  }
}

/**
 * 处理密码修改模态框取消
 */
const handleEditPasswordCancel = () => {
  resetPasswordForm() // 重置表单
  password.originPassword = ''
  password.confirmPassword = ''
  password.newPassword = ''
  pwd_modal_flag.value = false
}

/**
 * 导航到指定路径
 * @param {string} path 目标路径
 */
const navigateTo = (path) => {
  router.push(path)
  activeName.value = path
}

// ============================ 生命周期钩子 ============================

/**
 * 组件挂载时初始化用户状态
 * 检查登录状态，如果未登录则重定向到登录页
 */
onMounted(async () => {
  await initializeUserState()
})
</script>

<style scoped>
.title {
  font-size: 20px;
  color: #ffffff;
  background-color: #336699;
  opacity: 0.9;
  height: 54px;
}

.sider {
  background-color: #E8E8E8;
}

.menu {
  background-color: #E8E8E8;
}

.editLine {
  font-size: 12px;
  line-height: 24px;
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


.footer {
  font-size: 16px;
  margin-top: 100px;
  text-align: center;
  color: gray;
}

</style>
