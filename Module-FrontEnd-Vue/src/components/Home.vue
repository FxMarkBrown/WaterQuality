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
                    <DropdownItem name="editPassword" @click="dropDownClicked('editPassword')">更新密码</DropdownItem>
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
                <Icon type="ios-archive" />
                水质
              </template>
              <MenuItem name="/recent" @click="navigateTo('/recent')">近期数据</MenuItem>
              <MenuItem name="/manage" @click="navigateTo('/manage')">历史数据</MenuItem>
              <MenuItem name="/trend" @click="navigateTo('/trend')">趋势一览</MenuItem>
            </Submenu>

            <Submenu name="2">
              <template #title>
                <Icon type="md-trending-up" />
                模型
              </template>
              <MenuItem name="/model" @click="navigateTo('/model')">模型管理</MenuItem>
              <MenuItem name="/train" @click="navigateTo('/train')">模型训练</MenuItem>
            </Submenu>

            <Submenu name="3" v-if="showUserMenu">
              <template #title>
                <Icon type="ios-contact" />
                用户
              </template>
              <MenuItem name="/user" @click="navigateTo('/user')">用户管理</MenuItem>
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
          <span>{{currentUser.username}}</span>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="3" style="text-align: left">
          <span>角色</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{currentUser.role}}</span>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="3" style="text-align: left">
          <span>权限</span>
        </Col>
        <Col span="12" offset="1">
          <span>{{currentUser.authority}}</span>
        </Col>
      </Row>
    </Modal>
    <Modal v-model="pwd_modal_flag" title="更改密码" @on-ok="editPassword" >
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>旧密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input size="small" type="password" v-model="password.originPassword"></Input>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>新密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input size="small" type="password" v-model="password.newPassword"></Input>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>再次输入新密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input size="small" type="password" v-model="password.confirmPassword"></Input>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Col, Content, Dropdown,
  DropdownItem,
  DropdownMenu, Footer,
  Header,
  Icon,
  Input,
  Layout, Menu,
  MenuItem,
  Message, Modal, Row,
  Sider,
  Submenu
} from 'view-ui-plus'

const router = useRouter()
const route = useRoute()
const { proxy } = getCurrentInstance()

const activeName = ref(route.path)
const currentUser = reactive({})
const password = reactive({
  originPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const info_modal_flag = ref(false)
const pwd_modal_flag = ref(false)
const showUserMenu = ref(false)
const openNames = ref([])

watch(
  () => route.path,
  (newPath) => {
    activeName.value = newPath
    // 根据当前路径决定展开哪个选项卡
    if (['/recent', '/manage', '/trend'].includes(newPath)) {
      openNames.value = ['1']
    } else if (['/model', '/train'].includes(newPath)) {
      openNames.value = ['2']
    } else if (['/user'].includes(newPath)) {
      openNames.value = ['3']
    } else {
      openNames.value = []
    }
  },
  { immediate: true }
)

const getCurrentUser = async () => {
  try {
    const response = await proxy.$axios.get('/user/current')
    if (response.data.status === 'noLogin') {
      router.replace({ path: '/' })
    } else {
      Object.assign(currentUser, response.data)
      if (currentUser.role.id === 1) {
        currentUser.role = '超级管理员'
        currentUser.authority = '所有权限'
        showUserMenu.value = true
      } else if (currentUser.role.id === 2) {
        currentUser.role = '管理员'
        currentUser.authority = '查询, 创建, 修改, 删除水质数据; 预测水质; 训练模型'
      } else {
        currentUser.role = '普通用户'
        currentUser.authority = '查询水质数据; 预测水质'
      }
    }
  } catch (error) {
    console.error('Error getting current user:', error)
  }
}

const dropDownClicked = (name) => {
  switch (name) {
    case 'logout':
      logout()
      break
    case 'info':
      info_modal_flag.value = true
      break
    case 'editPassword':
      pwd_modal_flag.value = true
      break
  }
}

const logout = async () => {
  try {
    const response = await proxy.$axios.get('/logout')
    if (response.data.status === 'success') {
      router.replace({ path: '/' })
    } else {
      Message.error('注销失败!')
    }
  } catch (error) {
    Message.error('注销失败!')
  }
}

const checkPassword = () => {
  if (
    password.originPassword === '' ||
    password.newPassword === '' ||
    password.confirmPassword === ''
  ) {
    Message.error('输入不能为空!')
    return false
  } else if (password.newPassword !== password.confirmPassword) {
    Message.error('两次输入密码不一致!')
    return false
  }
  return true
}

const editPassword = async () => {
  if (checkPassword()) {
    try {
      const response = await proxy.$axios.post(
        `/user/editPassword/${currentUser.id}`,
        {
          originPassword: password.originPassword,
          newPassword: password.newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      if (response.data.status === 'success') {
        Message.success('成功更新密码!')
      } else if (response.data.status === 'error') {
        Message.error('密码错误!')
      } else {
        Message.error('更新密码失败!')
      }
    } catch (error) {
      Message.error('更新密码失败!')
    }
  }
  password.originPassword = ''
  password.newPassword = ''
  password.confirmPassword = ''
}

const navigateTo = (path) => {
  router.push(path)
  activeName.value = path
}


onMounted(() => {
  getCurrentUser()
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


  .footer {
    font-size: 16px;
    margin-top: 100px;
    text-align: center;
    color: gray;
  }

</style>
