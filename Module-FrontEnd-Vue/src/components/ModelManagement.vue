<template>
  <div class="content">
    <div class="query">
      <Row class="queryline">
        <Col span="2" offset="1" style="text-align: center">指标</Col>
        <Col span="3" style="text-align: left">
          <Select v-model="indicator" @on-change="getAllMethods" >
            <Option value="ph">PH</Option>
            <Option value="do">溶解氧</Option>
            <Option value="nh3N">氨氯</Option>
          </Select>
        </Col>
        <Col span="3" offset="1" style="text-align: center">模型</Col>
        <Col span="3" style="text-align: left">
          <Select v-model="method" @on-change="getAvailableMethods">
            <Option value="all">所有</Option>
            <Option v-for="item in modelList" :value="item" :key="item">{{ item }}</Option>
          </Select>
        </Col>
      </Row>
    </div>
    <div class="data_table">
      <div class="table_title">可用模型</div>
      <Table class="table" :loading="model_table_flag" border :columns="columns" :data="availableModels">
        <template #action="{ row, index }">
          <Button type="success" size="default" @click="getNextMonthPrediction(index)">预测</Button>
          <Button type="primary" size="default" @click="openTuningTab(row)" v-if="tunableModels.includes(row.method)">调优</Button>
          <Button type="error" size="default" @click="deleteModel(index)">删除</Button>
        </template>
      </Table>
    </div>
    <div id="plot_holder" v-if="plot_loading_flag" style="height: 400px">
      <Spin size="large" fix v-if="plot_loading_flag" style="font-size: 20px">正在使用 {{ chosenModel.method }} 以指标 {{ indicator.toUpperCase() }} 预测水质中...</Spin>
    </div>
    <div id="plot" style="height: 400px"></div>

    <Modal v-model="showTuningTab" title="调优模型？" @on-ok="submitTuning" >
      <Row class="search-algorithm-row" style="margin: 15px 0;">
        <Col span="6" style="text-align: right; padding-right: 10px;">
          <span>搜索算法：</span>
        </Col>
        <Col span="18" style="text-align: left;">
          <Select
            v-model="searchMethod"
            placeholder="请选择搜索算法"
            style="width: 200px;"
          >
            <Option value="random">随机搜索</Option>
            <Option value="bayesian">贝叶斯搜索</Option>
          </Select>
        </Col>
      </Row>
    </Modal>

    <Modal v-model="showTuningResult" title="调优完成">
      <div class="tuning-result">
        <div class="result-item">
          <span class="label">最优RMSE：</span>
          <span class="value">{{ tuningResult.best_rmse }}</span>
        </div>
        <div class="params-title">最优参数：</div>
        <div class="params-list">
          <div class="param-item">
            <span class="param-label">学习率：</span>
            <span class="param-value">{{ tuningResult.params.learning_rate }}</span>
          </div>
          <div class="param-item">
            <span class="param-label">隐藏层数量：</span>
            <span class="param-value">{{ tuningResult.params.hidden_size }}</span>
          </div>
          <div class="param-item">
            <span class="param-label">叠加数量：</span>
            <span class="param-value">{{ tuningResult.params.num_layers }}</span>
          </div>
          <div class="param-item">
            <span class="param-label">小批量样本数量：</span>
            <span class="param-value">{{ tuningResult.params.batch_size }}</span>
          </div>
          <div class="param-item">
            <span class="param-label">迭代轮数：</span>
            <span class="param-value">{{ tuningResult.params.epochs }}</span>
          </div>
          <div class="param-item">
            <span class="param-label">丢弃概率：</span>
            <span class="param-value">{{ tuningResult.params.dropout }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button type="primary" @click="showTuningResult = false">确认</Button>
      </template>
    </Modal>

    <div id="tuning_holder" v-if="tuning_loading_flag" style="height: 400px">
      <Spin size="large" fix v-if="tuning_loading_flag" style="font-size: 20px">
        正在使用 {{ searchMethod.toUpperCase() }} 调优模型 {{ currentTuningModel.method }}...
      </Spin>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import {Button, Col, Message, Modal, Option, Row, Select, Spin, Table} from 'view-ui-plus'
import { formatDate } from '@/utils/date'

const { proxy } = getCurrentInstance()

const indicator = ref('ph')
const method = ref('all')
const modelList = ref([])
const availableModels = ref([])
const prediction = ref('')
const chosenModel = reactive({})
const model_table_flag = ref(false)
const plot_loading_flag = ref(false)
const plotWaterQualities = ref([])
const plotDates = ref([])
const tunableModels = ref(['LSTM', 'GRU', 'BI-RNN'])
const showTuningTab = ref(false)
const currentTuningModel = ref(null)
const searchMethod = ref('')
const showTuningResult = ref(false)
const tuning_loading_flag = ref(false)
let chart = null

const tuningResult = reactive({
  best_rmse: null,
  params: {
    learning_rate: null,
    hidden_size: null,
    num_layers: null,
    batch_size: null,
    epochs: null,
    dropout: null
  }
})

const columns = ref([
  {
    title: '类型',
    key: 'method',
    align: 'center',
  },
  {
    title: 'RMSE',
    key: 'rmse',
    align: 'center',
    sortable: 'true'
  },
  {
    title: '用户',
    key: 'user',
    align: 'center',
  },
  {
    title: '训练日期',
    key: 'date',
    align: 'center',
    sortable: 'true'
  },
  {
    title: '操作',
    slot: 'action',
    align: 'center',
  }
])

const getAvailableMethods = async () => {
  try {
    model_table_flag.value = true
    const charts = document.getElementById('plot')
    charts.style.height = '0'
    charts.style.visibility = 'hidden'

    const response = await proxy.$axios.get('/model/available', {
      params: {
        indicator: indicator.value,
        method: method.value,
      }
    })

    availableModels.value = response.data
    for (let i = 0; i < availableModels.value.length; i++) {
      availableModels.value[i].user = availableModels.value[i].user.username
      availableModels.value[i].date = formatDate(availableModels.value[i].date)
    }
    model_table_flag.value = false
  } catch (error) {
    model_table_flag.value = false
    Message.error('获取可用模型失败!')
  }
}

const getAllMethods = async () => {
  try {
    model_table_flag.value = true
    const charts = document.getElementById('plot')
    charts.style.height = '0'
    charts.style.visibility = 'hidden'

    const response = await proxy.$axios.get('model/list', {
      params: {
        indicator: indicator.value
      }
    })

    modelList.value = response.data
    method.value = 'all'
    getAvailableMethods()
  } catch (error) {
    model_table_flag.value = false
    Message.error('获取模型列表失败!')
  }
}

const deleteModel = async (index) => {
  try {
    Object.assign(chosenModel, availableModels.value[index])
    const response = await proxy.$axios.post('model/delete/' + chosenModel.id.toString())

    if (response.data.status === 'success') {
      Message.success('成功删除!')
      getAvailableMethods()
    } else if (response.data.status === 'deny') {
      Message.error('权限不足!')
    } else {
      Message.error('删除失败!')
    }
  } catch (error) {
    Message.error('删除失败!')
  }
}

const getNextMonthPrediction = async (index) => {
  try {
    plot_loading_flag.value = true
    const charts = document.getElementById('plot')
    charts.style.height = '0'
    charts.style.visibility = 'hidden'
    Object.assign(chosenModel, availableModels.value[index])

    const response = await proxy.$axios.get('model/prediction', {
      params: {
        id: chosenModel.id,
        indicator: indicator.value
      }
    })

    const body = response.data
    if (body.status === 'success') {
      prediction.value = body.pred
      plotWaterQualities.value = body.forPlot

      // 格式化日期数据
      plotDates.value = body.dates.map(date => {
        if (typeof date === 'string' || typeof date === 'number') {
          return formatDate(date, 'yyyy-MM-dd')
        }
        return date
      })

      charts.style.height = '400px'
      plot()
    } else {
      charts.style.visibility = 'visible'
      charts.style.height = '400px'
      plot_loading_flag.value = false
      Message.error('预测失败！')
    }
  } catch (error) {
    plot_loading_flag.value = false
    Message.error('预测失败!')
  }
}

const plot = () => {
  const plotElement = document.getElementById('plot')
  if (!plotElement) return

  chart = proxy.$echarts.init(plotElement)
  const option = {
    title: {
      left: 'center',
      text: indicator.value.toUpperCase() + '下个月水质预测: ' + prediction.value,
      subtext: '使用模型: ' + chosenModel.method + ' 训练者: ' + chosenModel.user + ' 训练日期: ' + chosenModel.date
    },
    tooltip: {
      trigger: 'item'
    },
    xAxis: {
      type: 'category',
      data: plotDates.value,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      scale: true
    },
    series: [{
      data: plotWaterQualities.value.slice(0, -1),
      lineStyle: {
        color: 'blue'
      },
      type: 'line'
    }, {
      data: Array(plotWaterQualities.value.length - 2)
        .fill(null)
        .concat(
          [plotWaterQualities.value[plotWaterQualities.value.length - 2],
            plotWaterQualities.value[plotWaterQualities.value.length - 1]]
        ),
      lineStyle: {
        color: 'green'
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

const openTuningTab = (row) => {
  currentTuningModel.value = row
  showTuningTab.value = true
}

const submitTuning = async () => {
  try {
    tuning_loading_flag.value = true
    const response = await proxy.$axios.get('/model/tuning', {
      params: {
        id: currentTuningModel.value.id,
        method: searchMethod.value
      }
    })

    const body = response.data
    if (body.status === 'success') {
      Object.assign(tuningResult, {
        best_rmse: body.data.best_rmse,
        params: {
          learning_rate: body.data.best_params.learning_rate,
          hidden_size: body.data.best_params.hidden_size,
          num_layers: body.data.best_params.num_layers,
          batch_size: body.data.best_params.batch_size,
          epochs: body.data.best_params.epochs,
          dropout: body.data.best_params.dropout
        }
      })

      showTuningTab.value = false
      showTuningResult.value = true
      tuning_loading_flag.value = false
      Message.success('模型调优成功！')
      getAvailableMethods()
    } else {
      Message.error('调优失败：' + response.data.msg)
    }
  } catch (error) {
    tuning_loading_flag.value = false
    Message.error('调优请求失败！')
  }
}

onMounted(() => {
  getAllMethods()
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
  }

  .queryline {
    line-height: 32px;
  }

  .data_table {
    margin-top: 20px;
    margin-bottom: 15px;
    padding-left: 30px;
    padding-right: 30px;
  }

  .table_title {
    margin-bottom: 10px;
    font-size: 16px;
  }

  #plot_holder {
    position: relative;
    margin-left: 30px;
    margin-right: 30px;
  }

  #tuning_holder {
    position: relative;
    margin-left: 30px;
    margin-right: 30px;
  }

  .tuning-result {
    padding: 20px;
  }

  .result-item {
    margin-bottom: 15px;
    font-size: 16px;
  }

  .label {
    font-weight: bold;
    color: #2d8cf0;
  }

  .value {
    margin-left: 10px;
    color: #19be6b;
  }

  .params-title {
    font-weight: bold;
    margin: 20px 0 10px 0;
    font-size: 16px;
    color: #2d8cf0;
  }

  .param-item {
    margin: 8px 0;
    padding: 5px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .param-label {
    font-weight: 500;
    color: #515a6e;
  }

  .param-value {
    margin-left: 10px;
    color: #19be6b;
    font-weight: bold;
  }
</style>
