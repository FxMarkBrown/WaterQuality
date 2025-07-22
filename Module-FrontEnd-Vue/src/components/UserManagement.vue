<template>
  <!-- 用户管理主内容区域 -->
  <div class="content">
    <!-- 搜索区域 -->
    <Row class="search">
      <Col span="6" offset="9">
        <Input
          search
          enter-button="搜索"
          placeholder="请输入用户名进行搜索"
          v-model="searchKeyword"
          @search="handleSearch"
          clearable
        />
      </Col>
    </Row>

    <!-- 用户列表区域 -->
    <div class="data_table">
      <Table
        class="table"
        border
        :loading="isLoading"
        :columns="tableColumns"
        :data="currentUsers"
        empty-text="暂无用户数据"
      >
        <!-- 操作列模板 -->
        <template #action="{ row, index }">
          <Button
            type="primary"
            size="default"
            style="margin-right: 10px"
            @click="showGrantPermissionModal(index)"
            :disabled="row.role === USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN]"
          >
            修改权限
          </Button>
          <Button
            type="error"
            size="default"
            @click="deleteUser(index)"
            :disabled="row.role === USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN]"
          >
            删除
          </Button>
        </template>
      </Table>
    </div>
    <!-- 权限修改模态框 -->
    <Modal
      v-model="showGrantModal"
      title="修改用户权限"
      @on-ok="grantAuthority"
      @on-cancel="handleGrantCancel"
      :mask-closable="false"
    >
      <!-- 用户名显示 -->
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>用户名</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{ selectedUser.username }}</span>
        </Col>
      </Row>

      <!-- 当前角色显示 -->
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>当前角色</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{ selectedUser.role }}</span>
        </Col>
      </Row>

      <!-- 角色选择 -->
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>新角色</span>
        </Col>
        <Col span="6" offset="1">
          <Select v-model="newRoleName" placeholder="请选择角色">
            <Option :value="GRANT_ROLE_OPTIONS.VIP">{{ USER_ROLE_NAMES[USER_ROLES.ADMIN] }}</Option>
            <Option :value="GRANT_ROLE_OPTIONS.USER">{{ USER_ROLE_NAMES[USER_ROLES.USER] }}</Option>
          </Select>
        </Col>
      </Row>

      <!-- 权限说明 -->
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>权限说明</span>
        </Col>
        <Col span="6" offset="1">
          <span v-if="newRoleName === 'vip'" class="authority-desc">
            查询、创建、修改、删除水质数据；预测水质；训练模型
          </span>
          <span v-else-if="newRoleName === 'user'" class="authority-desc">
            查询水质数据；预测水质
          </span>
          <span v-else class="authority-desc placeholder">
            请选择角色查看权限说明
          </span>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

/**
* 用户管理组件
* @description 管理系统用户，包括用户搜索、权限修改、用户删除等
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, onMounted, computed, watch} from 'vue'

// ============================ UI组件导入 ============================
import {Button, Col, Input, Modal, Option, Row, Select, Table} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useUserStore} from '@/stores/user'
import {useAuthStore} from '@/stores/auth'

// ============================ 工具函数导入 ============================
import {ErrorHandler, showError} from '@/utils/error-handler'
import {GRANT_ROLE_OPTIONS, USER_ROLE_NAMES, USER_ROLES, USER_TABLE_COLUMNS} from '@/constants'

// ============================ 状态初始化 ============================
const userStore = useUserStore()
const authStore = useAuthStore()

// ============================ 响应式数据定义 ============================

/** 搜索关键词 */
const searchKeyword = ref('')

/** 权限修改模态框显示状态 */
const showGrantModal = ref(false)

/** 当前选中的用户 */
const selectedUser = reactive({
  id: 0,
  username: '',
  role: '',
  authority: ''
})

/** 新的角色名称 */
const newRoleName = ref('')

// ============================ 计算属性 ============================

/** 表格列配置（使用常量定义） */
const tableColumns = computed(() => {
  return USER_TABLE_COLUMNS
})

/** 当前用户列表（基于搜索状态） */
const currentUsers = computed(() => {
  return searchKeyword.value.trim() ? userStore.searchResults : userStore.users
})

/** 是否正在加载 */
const isLoading = computed(() => {
  return userStore.isLoadingUsers || userStore.isSearching
})

/** 是否可以修改权限 */
const canGrantAuthority = computed(() => {
  return selectedUser.role !== USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN] && authStore.isSuperAdmin
})

// ============================ 监听器 ============================

/**
 * 监听搜索关键词变化，执行防抖搜索
 */
watch(searchKeyword, (newKeyword) => {
  userStore.debouncedSearchUsers(newKeyword)
})

// ============================ 业务方法 ============================

/**
 * 初始化用户列表
 * 使用状态管理替代直接API调用
 */
const initializeUsers = async () => {
  try {
    await userStore.getAllUsers()
  } catch (error) {
    ErrorHandler.handleGenericError(error, '获取用户列表')
  }
}

/**
 * 显示权限修改模态框
 * @param {number} index 用户在列表中的索引
 */
const showGrantPermissionModal = (index) => {
  const user = currentUsers.value[index]
  if (!user) {
    showError('用户数据不存在')
    return
  }

  // 复制用户数据到选中用户
  Object.assign(selectedUser, user)

  if (selectedUser.role === USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN]) {
    showError('不能修改超级管理员角色')
    return
  }

  if (!authStore.isSuperAdmin) {
    showError('无权限执行此操作')
    return
  }

  // 根据当前角色设置默认值
  newRoleName.value = selectedUser.role === '管理员' ? 'vip' : 'user'
  showGrantModal.value = true
}

/**
 * 删除用户
 * @param {number} index 用户在列表中的索引
 */
const deleteUser = async (index) => {
  const user = currentUsers.value[index]
  if (!user) {
    showError('用户数据不存在')
    return
  }

  // 复制用户数据到选中用户
  Object.assign(selectedUser, user)

  if (selectedUser.role === USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN]) {
    showError('不能删除超级管理员')
    return
  }

  if (!authStore.isAdmin) {
    showError('无权限执行此操作')
    return
  }

  try {
    // 确认删除
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${selectedUser.username}" 吗？此操作不可恢复。`,
      onOk: async () => {
        // 使用状态管理删除用户
        const success = await userStore.deleteUser(selectedUser.id)

        if (success) {
          // 刷新当前显示的列表
          if (searchKeyword.value.trim()) {
            await userStore.searchUsers(searchKeyword.value)
          }
        }
      }
    })
  } catch (error) {
    ErrorHandler.handleGenericError(error, '删除用户')
  }
}

/**
 * 修改用户权限
 */
const grantAuthority = async () => {
  if (!canGrantAuthority.value) {
    showError('无权限修改此用户角色')
    return
  }

  try {
    // 使用状态管理修改用户权限
    const success = await userStore.grantUserPermission(
      selectedUser.id,
      {roleName: newRoleName.value}
    )

    if (success) {
      // 关闭模态框
      showGrantModal.value = false

      // 刷新当前显示的列表
      if (searchKeyword.value.trim()) {
        await userStore.searchUsers(searchKeyword.value)
      }
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '修改用户权限')
  }
}

/**
 * 处理权限修改模态框取消
 */
const handleGrantCancel = () => {
  showGrantModal.value = false
  newRoleName.value = ''
}

/**
 * 处理搜索输入
 * @param {string} value 搜索值
 */
const handleSearch = (value) => {
  searchKeyword.value = value
}

// ============================ 生命周期钩子 ============================

/**
 * 组件挂载时初始化用户列表
 */
onMounted(async () => {
  await initializeUsers()
})
</script>

<style scoped>
.search {
  font-size: 16px;
  line-height: 32px;
  margin-top: 20px;
}

.data_table {
  margin-top: 20px;
  margin-bottom: 10px;
  padding-left: 30px;
  padding-right: 30px;
}

.editLine {
  font-size: 14px;
  line-height: 24px;
  margin-top: 10px;
  margin-bottom: 10px;
}

/* 权限说明样式 */
.authority-desc {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.authority-desc.placeholder {
  color: #ccc;
  font-style: italic;
}
</style>
