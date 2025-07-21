<template>
  <div class="content">
    <div class="query">
      <Row class="queryline">
        <Col span="2" offset="2" style="text-align: right;margin-right: 15px">地点</Col>
        <Col span="2" style="text-align: left">
          <Select v-model="station" style="width:100px" placeholder="0">
            <Option v-for="item in stationList" :value="item" :key="item">{{ item }}</Option>
          </Select>
        </Col>
        <Col span="2" style="text-align: right;margin-right: 15px; margin-left: 15px"><span>指标</span></Col>
        <Col span="2" style="text-align: left">
          <Select v-model="indicator" style="width: 100px" placeholder="PH">
            <Option value="ph">PH</Option>
            <Option value="do">溶解氧</Option>
            <Option value="nh3N">氨氯</Option>
          </Select>
        </Col>
        <Col span="2" style="text-align: right;margin-right: 15px;margin-left: 15px"><span>时间</span></Col>
        <Col span="2" style="text-align: left">
          <Select v-model="period" style="width: 100px" placeholder="One Year">
            <Option value="1">近一年</Option>
            <Option value="3">近三年</Option>
            <Option value="5">近五年</Option>
          </Select>
        </Col>
        <Col span="3" offset="2">
          <Button type="success" shape="circle" icon="ios-stats" long @click="getQueriedDataForPlot">展示趋势</Button>
        </Col>
      </Row>
    </div>
    <div id="plot_holder" v-if="plot_loading_flag" style="height: 600px">
      <Spin size="large" fix v-if="plot_loading_flag" style="font-size: 20px">加载中...</Spin>
    </div>
    <div id="plot" style="height: 600px"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import {Button, Col, Message, Option, Row, Select, Spin} from 'view-ui-plus'
import { formatDate } from '@/utils/date'

const { proxy } = getCurrentInstance()

const stationList = ref([])
const station = ref(0)
const period = ref('1')
const indicator = ref('ph')
const plot_loading_flag = ref(true)
const waterQualities = ref([])
const dates = ref([])
let chart = null

const getAllStations = async () => {
  try {
    const response = await proxy.$axios.get('waterquality/station')
    stationList.value = response.data
  } catch (error) {
    Message.error('获取站点失败!')
  }
}

const getQueriedDataForPlot = async () => {
  try {
    const charts = document.getElementById('plot')
    charts.style.height = '0'

    const response = await proxy.$axios.get('waterquality/plot', {
      params: {
        station: station.value,
        period: period.value,
        indicator: indicator.value
      }
    })

    const data = response.data
    waterQualities.value = data.waterquality

    // 格式化日期数据
    dates.value = data.dates.map(date => {
      // 如果日期是字符串格式，尝试格式化
      if (typeof date === 'string' || typeof date === 'number') {
        return formatDate(date, 'yyyy-MM')
      }
      return date
    })

    charts.style.height = '600px'
    plot()
  } catch (error) {
    Message.error('获取图表数据失败!')
  }
}

const plot = () => {
  const plotElement = document.getElementById('plot')
  if (!plotElement) return

  // 检查是否已存在ECharts实例，如果有则先销毁
  if (chart) {
    chart.dispose()
    chart = null
  }
  
  chart = proxy.$echarts.init(plotElement)
  const option = {
    tooltip: {
      trigger: 'item'
    },
    xAxis: {
      type: 'category',
      data: dates.value,
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
      data: waterQualities.value,
      type: 'line',
    }]
  }
  chart.setOption(option)
  plot_loading_flag.value = false
}

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

onMounted(() => {
  getAllStations()
  getQueriedDataForPlot()
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

  #plot_holder {
    position: relative;
    margin-top: 20px;
    margin-left: 30px;
    margin-right: 30px;
  }
</style>
