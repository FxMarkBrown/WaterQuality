<template>
  <div class="content">
    <div class="title">
      水质预测平台
    </div>
    <div id="login">
      <div class="login_title">登入</div>
      <Form ref="userRef" :model="user" :rules="ruleInline">
        <FormItem prop="username">
          <Input type="text" v-model="user.username" placeholder="用户名">
            <template #prepend>
              <Icon type="ios-person-outline" />
            </template>
          </Input>
        </FormItem>
        <FormItem prop="password" id="password">
          <Input type="password" v-model="user.password" placeholder="密码">
            <template #prepend>
              <Icon type="ios-lock-outline" />
            </template>
          </Input>
        </FormItem>
        <Row class="register">
            <a @click="modal_flag = true">没有账户？点击注册</a>
        </Row>
        <FormItem id="submitButton">
          <Button type="primary" size="large" @click="handleSubmit()">登入</Button>
        </FormItem>
      </Form>
    </div>
    <div class="footer">
      <span> &copy;2025 NCUT</span>
    </div>
    <Modal v-model="modal_flag" title="注册" @on-ok="register" >
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>用户名</span>
        </Col>
        <Col span="8" offset="1">
          <Input v-model="newUser.username"></Input>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input type="password" v-model="newUser.password"></Input>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="6" offset="3">
          <span>再次输入密码</span>
        </Col>
        <Col span="8" offset="1">
          <Input type="password" v-model="newUser.confirmPassword"></Input>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import {Button, Col, Form, FormItem, Icon, Input, Message, Modal, Row} from 'view-ui-plus'

const router = useRouter()
const { proxy } = getCurrentInstance()

const userRef = ref(null)

const user = reactive({
  username: '',
  password: ''
})

const ruleInline = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
})

const modal_flag = ref(false)

const newUser = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const handleSubmit = () => {
  userRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await proxy.$axios({
          url: '/login',
          method: 'POST',
          data: {
            username: user.username,
            password: user.password
          },
          transformRequest: [function (data) {
            let ret = ''
            for (let it in data) {
              ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
            }
            return ret
          }],
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        if (response.data.status === 'success') {
          router.replace({ path: '/manage' })
        } else {
          Message.error('错误的用户名或密码!')
        }
      } catch (error) {
        Message.error('登录失败!')
      }
    } else {
      Message.error('请填写完整的登录信息!')
    }
  })
}

const check = () => {
  if (newUser.username === '' || newUser.password === '' || newUser.confirmPassword === '') {
    Message.error('输入为空!')
    return false
  }
  if (newUser.password !== newUser.confirmPassword) {
    Message.error('密码不相同!')
    return false
  }
  return true
}

const register = async () => {
  if (check()) {
    try {
      const response = await proxy.$axios.post(
        '/user/register',
        {
          username: newUser.username,
          password: newUser.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.status === 'success') {
        Message.success('注册成功!')
      } else if (response.data.status === 'duplicate') {
        Message.error('用户名已存在!')
      } else {
        Message.error('注册失败!')
      }
    } catch (error) {
      Message.error('注册失败!')
    }
  }

  newUser.username = ''
  newUser.password = ''
  newUser.confirmPassword = ''
}
</script>

<style scoped>
  #login{
    font-size: 14px;
    margin: 0 auto;
    margin-top: 80px;
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

  #login img{
    margin-bottom: 20px;
  }

  #submitButton{
    margin-top: 20px;
  }

  .footer {
    font-size: 16px;
    margin-top: 100px;
    text-align: center;
    color: gray;
  }

  .register{
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

</style>
