<template>
  <div class="content">
    <div class="query">
      <Row class="queryline">
        <Col span="2" offset="1" style="text-align: center">指标</Col>
        <Col span="3" style="text-align: left">
          <Select v-model="indicator">
            <Option value="ph">PH</Option>
            <Option value="do">溶解氧</Option>
            <Option value="nh3N">氨氮</Option>
          </Select>
        </Col>
        <Col span="3" offset="1" style="text-align: center">模型</Col>
        <Col span="3" style="text-align: left">
          <Select v-model="method">
            <Option value="SVM">支持向量机(SVM)</Option>
            <Option value="Adaboost">Boosting(Adaboost)</Option>
            <Option value="LSTM">长短时记忆网络(LSTM)</Option>
            <Option value="GRU">门控循环单元网络(GRU)</Option>
            <Option value="Bi-RNN">双向循环神经网络(Bi-RNN)</Option>
          </Select>
        </Col>
        <Col span="3" offset="2">
          <Button type="success" shape="circle" icon="ios-build" long @click="trainModel">开始训练</Button>
        </Col>
      </Row>
    </div>
    <div id="plot_holder" v-if="plot_loading_flag" style="height: 600px">
      <Spin size="large" fix v-if="plot_loading_flag" style="font-size: 20px">正在训练 {{ method }} 模型...</Spin>
    </div>
    <div id="plot" style="height: 600px"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import {Button, Col, Message, Option, Row, Select, Spin} from 'view-ui-plus'

const { proxy } = getCurrentInstance()

const indicator = ref('ph')
const method = ref('SVM')
const rmse = ref('')
const pred = ref([])
const real = ref([])
const plot_loading_flag = ref(false)
const currentUser = reactive({})
let chart = null

const getCurrentUser = async () => {
  try {
    const response = await proxy.$axios.get('/user/current')
    Object.assign(currentUser, response.data)
  } catch (error) {
    Message.error('获取用户信息失败!')
  }
}

const trainModel = async () => {
  try {
    const charts = document.getElementById('plot')
    charts.style.visibility = 'hidden'
    charts.style.height = '0'
    plot_loading_flag.value = true

    const response = await proxy.$axios.get('model/training', {
      params: {
        indicator: indicator.value,
        method: method.value,
        uid: currentUser.id
      }
    })

    const body = response.data
    if (body.status === 'success') {
      rmse.value = body.data.rmse
      pred.value = body.data.pred
      real.value = body.data.real
      charts.style.height = '600px'
      plot()
    } else if (body.status === 'deny') {
      Message.error('权限不足')
      charts.style.height = '600px'
      charts.style.visibility = 'visible'
      plot_loading_flag.value = false
    } else {
      Message.error('训练失败！')
      charts.style.height = '600px'
      charts.style.visibility = 'visible'
      plot_loading_flag.value = false
    }
  } catch (error) {
    plot_loading_flag.value = false
    Message.error('训练请求失败!')
  }
}

const plot = () => {
  const plotElement = document.getElementById('plot')
  if (!plotElement) return

  chart = proxy.$echarts.init(plotElement)
  const x = new Array(pred.value.length)
  for (let i = 0; i < pred.value.length; i++) {
    x[i] = i + 1
  }

  const option = {
    title: {
      left: 'center',
      text: '训练结果(' + ' ' + method.value + ') 指标:' + indicator.value.toUpperCase(),
      subtext: '均方根误差(RMSE): ' + rmse.value
    },
    legend: {
      data: ['Predication', 'Actual value']
    },
    tooltip: {
      trigger: 'item'
    },
    xAxis: {
      type: 'category',
      data: x
    },
    yAxis: {
      type: 'value',
      scale: true
    },
    series: [{
      data: pred.value,
      lineStyle: {
        color: 'blue'
      },
      type: 'line'
    }, {
      data: real.value,
      lineStyle: {
        color: 'red'
      },
      type: 'line'
    }]
  }

  chart.setOption(option)
  const charts = document.getElementById('plot')
  charts.style.visibility = 'visible'
  plot_loading_flag.value = false
}

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

onMounted(() => {
  getCurrentUser()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
  .query {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .queryline {
    line-height: 32px;
  }

  #plot_holder {
    position: relative;
    margin-top: 20px;
    margin-left: 30px;
    margin-right: 30px;
  }
</style>
