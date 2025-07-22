<template>
  <div class="content">
    <!-- 训练参数选择区域 -->
    <div class="query">
      <Row class="queryline">
        <!-- 指标选择 -->
        <Col span="2" offset="1" style="text-align: center">
          <span>指标</span>
        </Col>
        <Col span="3" style="text-align: left">
          <Select
            v-model="selectedIndicator"
            placeholder="选择指标"
          >
            <Option value="ph">PH值</Option>
            <Option value="do">溶解氧</Option>
            <Option value="nh3N">氨氮</Option>
          </Select>
        </Col>

        <!-- 模型类型选择 -->
        <Col span="3" offset="1" style="text-align: center">
          <span>模型类型</span>
        </Col>
        <Col span="3" style="text-align: left">
          <Select
            v-model="selectedModelType"
            placeholder="选择模型"
          >
            <Option value="SVM">支持向量机 (SVM)</Option>
            <Option value="Adaboost">Boosting (Adaboost)</Option>
            <Option value="LSTM">长短时记忆网络 (LSTM)</Option>
            <Option value="GRU">门控循环单元网络 (GRU)</Option>
            <Option value="Bi-RNN">双向循环神经网络 (Bi-RNN)</Option>
          </Select>
        </Col>

        <!-- 训练按钮 -->
        <Col span="3" offset="2">
          <Button
            type="success"
            shape="circle"
            icon="ios-build"
            long
            :loading="isTraining"
            :disabled="!canTrain"
            @click="handleTraining"
          >
            {{ isTraining ? '训练中...' : '开始训练' }}
          </Button>
        </Col>
      </Row>
    </div>

    <!-- 训练进行中指示 -->
    <div id="training_holder" v-if="isTraining" style="height: 600px">
      <Spin size="large" fix style="font-size: 20px">
        正在训练 {{ selectedModelType }} 模型...
      </Spin>
    </div>

    <!-- 训练结果图表 -->
    <div
      ref="trainingChartRef"
      id="trainingChart"
      style="height: 600px; margin: 20px 30px;"
      :style="{
        visibility: (!isTraining && hasTrainingData) ? 'visible' : 'hidden',
        minHeight: '600px'
      }"
    ></div>
  </div>
</template>

/**
* 模型训练组件
* @description 机器学习模型训练，包括模型选择、训练执行和结果展示
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, computed, nextTick} from 'vue'

// ============================ UI组件导入 ============================
import {Button, Col, Option, Row, Select, Spin} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useModelStore} from '@/stores/model'
import {useAuthStore} from '@/stores/auth'

// ============================ 工具函数导入 ============================
import {useChart} from '@/composables'
import {ErrorHandler, showError} from '@/utils/error-handler'
import {
  MODEL_TYPES,
  MODEL_TYPE_NAMES,
  WATER_QUALITY_INDICATOR_NAMES, WATER_QUALITY_INDICATORS
} from '@/constants'

// ============================ 状态初始化 ============================
const modelStore = useModelStore()
const authStore = useAuthStore()

// ============================ 响应式数据定义 ============================

/** 选中的指标 */
const selectedIndicator = ref(WATER_QUALITY_INDICATORS.PH)

/** 选中的模型类型 */
const selectedModelType = ref(MODEL_TYPES.SVM)

/** 训练结果数据 */
const trainingData = reactive({
  rmse: '',
  predicted: [],
  actual: [],
  modelInfo: {}
})

// ============================ 计算属性 ============================

/** 是否正在训练 */
const isTraining = computed(() => modelStore.isTraining)

/** 是否有训练数据 */
const hasTrainingData = computed(() => trainingData.predicted.length > 0)

/** 是否可以训练 */
const canTrain = computed(() => {
  return selectedIndicator.value &&
    selectedModelType.value &&
    authStore.isAdmin &&
    !isTraining.value
})

/** 当前用户 */
const currentUser = computed(() => authStore.currentUser)

// ============================ ECharts管理 ============================

/** 图表容器引用 */
const trainingChartRef = ref(null)

/** 图表管理组合函数 */
const {
  initChart,
  updateChart,
  chart
} = useChart(trainingChartRef)

// ============================ 业务方法 ============================

/**
 * 处理模型训练
 */
const handleTraining = async () => {
  if (!canTrain.value) {
    showError('请检查训练条件或权限')
    return
  }

  try {
    // 清空之前的训练结果
    resetTrainingData()

    // 使用状态管理进行模型训练
    const success = await modelStore.trainModel({
      indicator: selectedIndicator.value,
      method: selectedModelType.value,
      uid: currentUser.value?.id
    })

    if (success && modelStore.trainingResult) {
      const result = modelStore.trainingResult
      // 更新训练结果数据
      trainingData.rmse = result.data?.rmse || result.rmse
      trainingData.predicted = result.data?.pred || result.predicted || []
      trainingData.actual = result.data?.real || result.actual || []
      trainingData.modelInfo = {
        method: selectedModelType.value,
        indicator: selectedIndicator.value,
        user: currentUser.value?.username,
        rmse: trainingData.rmse
      }

      await renderTrainingChart()
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '模型训练')
  }
}

/**
 * 渲染训练结果图表
 */
const renderTrainingChart = async () => {
  // 确保图表容器存在且可见
  if (!trainingChartRef.value || isTraining.value || !hasTrainingData.value) {
    return
  }

  if (!chart.value) {
    await nextTick()
    // 小延迟确保DOM尺寸计算完成
    await new Promise(resolve => setTimeout(resolve, 100))
    await initChart()
  }

  const indicatorName = WATER_QUALITY_INDICATOR_NAMES[selectedIndicator.value] || selectedIndicator.value
  const modelName = MODEL_TYPE_NAMES[selectedModelType.value] || selectedModelType.value

  // 生成X轴数据（样本索引）
  const xAxisData = Array.from({length: trainingData.predicted.length}, (_, i) => i + 1)

  const chartConfig = {
    title: {
      left: 'center',
      text: `模型训练结果 - ${modelName}`,
      subtext: `指标: ${indicatorName} | RMSE: ${trainingData.rmse}`
    },
    legend: {
      data: ['预测值', '实际值'],
      top: 40
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let result = `样本 ${params[0].name}<br/>`
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value.toFixed(4)}<br/>`
        })
        return result
      }
    },
    grid: {
      top: 80,
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      name: '样本索引',
      axisLabel: {
        interval: Math.floor(xAxisData.length / 10) // 显示部分标签
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: indicatorName
    },
    series: [
      {
        name: '预测值',
        data: trainingData.predicted,
        type: 'line',
        lineStyle: {
          color: '#3399FF',
          width: 2
        },
        itemStyle: {
          color: '#3399FF'
        },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true
      },
      {
        name: '实际值',
        data: trainingData.actual,
        type: 'line',
        lineStyle: {
          color: '#ed4014',
          width: 2
        },
        itemStyle: {
          color: '#ed4014'
        },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true
      }
    ]
  }

  updateChart(chartConfig)
}

/**
 * 重置训练数据
 */
const resetTrainingData = () => {
  trainingData.rmse = ''
  trainingData.predicted = []
  trainingData.actual = []
  trainingData.modelInfo = {}
}
</script>

<style scoped>
.query {
  margin-top: 20px;
  margin-bottom: 20px;
}

.queryline {
  line-height: 32px;
}
</style>
