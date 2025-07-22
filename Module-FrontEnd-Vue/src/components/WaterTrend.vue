<template>
  <div class="content">
    <div class="query">
      <Row class="queryline">
        <!-- 站点选择 -->
        <Col span="2" offset="2" style="text-align: right;margin-right: 15px">
          <span>地点</span>
        </Col>
        <Col span="2" style="text-align: left">
          <Select
            v-model="selectedStation"
            style="width:100px"
            placeholder="选择站点"
          >
            <Option
              v-for="station in availableStations"
              :value="station"
              :key="station"
            >
              {{ station }}
            </Option>
          </Select>
        </Col>

        <!-- 指标选择 -->
        <Col span="2" style="text-align: right;margin-right: 15px; margin-left: 15px">
          <span>指标</span>
        </Col>
        <Col span="2" style="text-align: left">
          <Select
            v-model="selectedIndicator"
            style="width: 100px"
            placeholder="选择指标"
          >
            <Option value="ph">PH值</Option>
            <Option value="do">溶解氧</Option>
            <Option value="nh3N">氨氯</Option>
          </Select>
        </Col>

        <!-- 时间期间选择 -->
        <Col span="2" style="text-align: right;margin-right: 15px;margin-left: 15px">
          <span>时间</span>
        </Col>
        <Col span="2" style="text-align: left">
          <Select
            v-model="selectedPeriod"
            style="width: 100px"
            placeholder="选择期间"
          >
            <Option value="1">{{ TREND_PERIOD_NAMES[TREND_PERIODS.ONE_YEAR] }}</Option>
            <Option value="3">{{ TREND_PERIOD_NAMES[TREND_PERIODS.THREE_YEARS] }}</Option>
            <Option value="5">{{ TREND_PERIOD_NAMES[TREND_PERIODS.FIVE_YEARS] }}</Option>
          </Select>
        </Col>

        <!-- 展示按钮 -->
        <Col span="3" offset="2">
          <Button
            type="success"
            shape="circle"
            icon="ios-stats"
            long
            :loading="isLoadingTrend"
            @click="generateTrend"
          >
            {{ isLoadingTrend ? '加载中...' : '展示趋势' }}
          </Button>
        </Col>
      </Row>
    </div>

    <!-- 图表加载指示 -->
    <div id="plot_holder" v-if="isLoadingTrend" style="height: 600px">
      <Spin size="large" fix style="font-size: 20px">加载中...</Spin>
    </div>

    <!-- 图表容器 -->
    <div
      ref="trendChartRef"
      id="trendChart"
      style="height: 600px; margin-top: 20px; margin-left: 30px; margin-right: 30px; min-height: 600px;"
      :style="{ visibility: isLoadingTrend ? 'hidden' : 'visible' }"
    ></div>
  </div>
</template>

/**
* 水质趋勿组件
* @description 显示水质数据的趋势图，支持按站点、指标和时间期间筛选
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, onMounted, computed, nextTick} from 'vue'

// ============================ UI组件导入 ============================
import {Button, Col, Option, Row, Select, Spin} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useWaterQualityStore} from '@/stores/waterquality'

// ============================ 工具函数导入 ============================
import {useChart} from '@/composables'
import {formatDate} from '@/utils/date'
import {ErrorHandler} from '@/utils/error-handler'
import {TREND_PERIOD_NAMES, TREND_PERIODS, WATER_QUALITY_INDICATOR_NAMES} from "@/constants/index";

// ============================ 状态初始化 ============================
const waterQualityStore = useWaterQualityStore()

// ============================ 响应式数据定义 ============================

/** 选中的站点 */
const selectedStation = ref('')

/** 选中的指标 */
const selectedIndicator = ref('ph')

/** 选中的时间期间 */
const selectedPeriod = ref('1')

/** 趋勿数据加载状态 */
const isLoadingTrend = ref(false)

/** 趋勿数据 */
const trendData = reactive({
  dates: [],
  values: [],
  indicator: ''
})

// ============================ 计算属性 ============================

/** 可用站点列表 */
const availableStations = computed(() => waterQualityStore.stations)

/** 是否可以生成趋勿 */
const canGenerateTrend = computed(() => {
  // 检查 selectedStation 是否为有效ID（假设ID为非负整数）
  const isValidStation = typeof selectedStation.value === 'number' && selectedStation.value >= 0;
  return isValidStation && selectedIndicator.value && selectedPeriod.value && !isLoadingTrend.value
})

// ============================ ECharts管理 ============================

/** 图表容器引用 */
const trendChartRef = ref(null)

/** 图表管理组合函数 */
const {
  initChart,
  updateChart,
  chart
} = useChart(trendChartRef)

// ============================ 业务方法 ============================

/**
 * 初始化站点数据
 */
const initializeStations = async () => {
  try {
    await waterQualityStore.getStations()

    // 设置默认站点
    if (availableStations.value.length > 0) {
      selectedStation.value = availableStations.value[0]
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '获取站点列表')
  }
}

/**
 * 获取趋勿数据
 */
const fetchTrendData = async () => {
  if (!canGenerateTrend.value) {
    showError('请选择完整的查询条件')
    return
  }

  try {
    isLoadingTrend.value = true

    // 使用状态管理获取趋勿数据
    const result = await waterQualityStore.getTrendData({
      station: selectedStation.value,
      indicator: selectedIndicator.value,
      period: selectedPeriod.value
    })

    if (result) {
      // 格式化数据
      trendData.dates = waterQualityStore.trendData.dates.map(date => {
        if (typeof date === 'string' || typeof date === 'number') {
          return formatDate(date, 'yyyy-MM')
        }
        return date
      })
      trendData.values = waterQualityStore.trendData.waterquality
      trendData.indicator = WATER_QUALITY_INDICATOR_NAMES[selectedIndicator.value] || selectedIndicator.value

      // 渲染图表
      isLoadingTrend.value = false
      await renderTrendChart()
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '获取趋勿数据')
  }
}

/**
 * 渲染图表
 */
const renderTrendChart = async () => {
  // 确保图表容器存在且可见
  if (!trendChartRef.value || isLoadingTrend.value) {
    return
  }

  if (!chart.value) {
    await nextTick()
    // 小延迟确保DOM尺寸计算完成
    await new Promise(resolve => setTimeout(resolve, 100))
    await initChart()
  }

  const chartConfig = {
    tooltip: {
      trigger: 'item'
    },
    xAxis: {
      type: 'category',
      data: trendData.dates,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: trendData.indicator
    },
    series: [{
      name: trendData.indicator,
      data: trendData.values,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: '#3399FF'
      }
    }]
  }

  updateChart(chartConfig)
}

/**
 * 生成图
 */
const generateTrend = async () => {
  await fetchTrendData()
}

/**
 * 初始化组件数据
 */
const initializeComponent = async () => {
  await initializeStations()
}

// ============================ 生命周期钩子 ============================

/**
 * 组件挂载时初始化
 */
onMounted(async () => {
  await initializeComponent()
})
</script>

<style scoped>
.query {
  margin-top: 20px;
  padding: 0 20px;
}

.queryline {
  line-height: 32px;
  align-items: center;
}

#plot_holder {
  position: relative;
  margin-top: 20px;
  margin-left: 30px;
  margin-right: 30px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

#trendChart {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .queryline {
    flex-direction: column;
    gap: 10px;
  }

  #trendChart {
    height: 400px !important;
    margin-left: 10px;
    margin-right: 10px;
  }
}
</style>
