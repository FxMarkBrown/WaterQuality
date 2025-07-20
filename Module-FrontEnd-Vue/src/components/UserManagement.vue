<template>
  <div class="content">
    <Row class="search">
      <Col span="6" offset="9">
        <Input search enter-button placeholder="搜索" v-model="searchUsername" @search="getQueriedUsers"/>
      </Col>
    </Row>
    <div class="data_table">
      <Table class="table" border  :loading="loading_flag" :columns="columns" :data="allUsers">
        <template #action="{ row, index }">
          <Button type="primary" size="default" style="margin-right: 10px" @click="show(index)">认证</Button>
          <Button type="error" size="default" @click="remove(index)">删除</Button>
        </template>
      </Table>
    </div>
    <Modal v-model="modal_flag" title="是否给予此用户认证？" @on-ok="grantAuthority" >
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>用户名</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{ chosenUser.username }}</span>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>角色</span>
        </Col>
        <Col span="6" offset="1">
          <span>{{ chosenUser.role }}</span>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="6" style="text-align: center">
          <span>权限</span>
        </Col>
        <Col span="6" offset="1">
          <Select size="small" v-model="roleName">
            <Option value="vip" >管理员</Option>
            <Option value="user">普通用户</Option>
          </Select>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import {Button, Col, Input, Message, Modal, Option, Row, Select, Table} from 'view-ui-plus'

const { proxy } = getCurrentInstance()

const loading_flag = ref(true)
const modal_flag = ref(false)
const allUsers = ref([])
const chosenUser = reactive({})
const roleName = ref('')
const searchUsername = ref('')

const columns = ref([
  {
    title: 'ID',
    key: 'id',
    align: 'center'
  },
  {
    title: '用户名',
    key: 'username',
    align: 'center',
  },
  {
    title: '角色',
    key: 'role',
    align: 'center',
    filters: [
      {
        label: 'Admin',
        value: 1
      },
      {
        label: 'User',
        value: 2
      }
    ],
    filterMultiple: false,
  },
  {
    title: '操作',
    slot: 'action',
    align: 'center',
  }
])

const getAllUsers = async () => {
  try {
    loading_flag.value = true
    const response = await proxy.$axios.get('/user/all')
    allUsers.value = response.data

    for (let i = 0; i < allUsers.value.length; i++) {
      if (allUsers.value[i].role.id === 1) {
        allUsers.value[i].role = '超级管理员'
      } else if (allUsers.value[i].role.id === 2) {
        allUsers.value[i].role = '管理员'
      } else {
        allUsers.value[i].role = '普通用户'
      }
    }
    loading_flag.value = false
  } catch (error) {
    loading_flag.value = false
    Message.error('获取用户列表失败!')
  }
}

const show = (index) => {
  Object.assign(chosenUser, allUsers.value[index])
  if (chosenUser.role === '超级管理员') {
    Message.error('不能认证超级管理员')
  } else {
    modal_flag.value = true
  }
}

const remove = async (index) => {
  try {
    Object.assign(chosenUser, allUsers.value[index])
    if (chosenUser.role === '超级管理员') {
      Message.error('不能删除超级管理员')
    } else {
      const response = await proxy.$axios.post('/user/delete/' + chosenUser.id)
      if (response.data.status === 'success') {
        Message.success('成功删除!')
        getQueriedUsers()
      } else if (response.data.status === 'deny') {
        Message.error('权限不足')
      } else {
        Message.error('删除失败!')
      }
    }
  } catch (error) {
    Message.error('删除失败!')
  }
}

const grantAuthority = async () => {
  try {
    const response = await proxy.$axios.post(
      `/user/grant/${chosenUser.id}`,
      {
        roleName: roleName.value
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.status === 'success') {
      Message.success('认证成功!')
      getQueriedUsers()
    } else if (response.data.status === 'deny') {
      Message.error('权限不足!')
    } else {
      Message.error('认证失败!')
    }
  } catch (error) {
    Message.error('认证失败!')
  }
}

const getQueriedUsers = async () => {
  try {
    loading_flag.value = true
    if (searchUsername.value === '') {
      getAllUsers()
    } else {
      const response = await proxy.$axios.get('/user/query', {
        params: {
          username: searchUsername.value
        }
      })

      allUsers.value = response.data
      for (let i = 0; i < allUsers.value.length; i++) {
        if (allUsers.value[i].role.id === 1) {
          allUsers.value[i].role = '超级管理员'
        } else if (allUsers.value[i].role.id === 2) {
          allUsers.value[i].role = '管理员'
        } else {
          allUsers.value[i].role = '普通用户'
        }
      }
      loading_flag.value = false
    }
  } catch (error) {
    loading_flag.value = false
    Message.error('查询用户失败!')
  }
}

onMounted(() => {
  getAllUsers()
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
</style>
