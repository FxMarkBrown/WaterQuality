<template>
  <div class="content">
    <!-- 查询条件区域 -->
    <div class="query">
      <Row class="queryline">
        <!-- 指标选择 -->
        <Col span="2" offset="1" style="text-align: center">
          <span>指标</span>
        </Col>
        <Col span="3" style="text-align: left">
          <Select
            v-model="selectedIndicator"
            @on-change="handleIndicatorChange"
            placeholder="选择指标"
          >
            <Option value="ph">PH值</Option>
            <Option value="do">溶解氧</Option>
            <Option value="nh3N">氨氯</Option>
          </Select>
        </Col>

        <!-- 模型类型选择 -->
        <Col span="3" offset="1" style="text-align: center">
          <span>模型类型</span>
        </Col>
        <Col span="3" style="text-align: left">
          <Select
            v-model="selectedModelType"
            @on-change="handleModelTypeChange"
            placeholder="选择模型"
          >
            <Option value="all">所有模型</Option>
            <Option
              v-for="modelType in availableModelTypes"
              :value="modelType"
              :key="modelType"
            >
              {{ modelType }}
            </Option>
          </Select>
        </Col>
      </Row>
    </div>

    <!-- 模型列表表格 -->
    <div class="data_table">
      <div class="table_title">可用模型</div>
      <Table
        class="table"
        :loading="isLoadingModels"
        border
        :columns="tableColumns"
        :data="filteredModels"
        empty-text="暂无可用模型"
      >
        <template #action="{ row, index }">
          <Button
            type="success"
            size="default"
            style="margin-right: 8px"
            :disabled="!canPredict"
            @click="handlePrediction(index)"
          >
            预测
          </Button>
          <Button
            type="primary"
            size="default"
            style="margin-right: 8px"
            v-if="isTunableModel(row.method)"
            :disabled="!canTune"
            @click="showTuningDialog(row)"
          >
            调优
          </Button>
          <Button
            type="error"
            size="default"
            :disabled="!canDelete"
            @click="handleDeleteModel(index)"
          >
            删除
          </Button>
        </template>
      </Table>
    </div>

    <!-- 预测结果加载指示 -->
    <div id="prediction_holder" v-if="isPredicting" style="height: 400px">
      <Spin size="large" fix style="font-size: 20px">
        正在使用 {{ selectedModel.method }} 模型预测 {{ selectedIndicator.toUpperCase() }} 指标...
      </Spin>
    </div>

    <!-- 预测结果图表 -->
    <div
      ref="predictingChartRef"
      id="predictionChart"
      style="height: 400px; margin: 20px 30px;"
      :style="{
        visibility: (!isPredicting && hasPredictionData) ? 'visible' : 'hidden',
        minHeight: '600px'
      }"
    ></div>

    <!-- 模型调优模态框 -->
    <Modal
      v-model="showTuningModal"
      title="模型调优"
      @on-ok="submitTuning"
      @on-cancel="handleTuningCancel"
      :mask-closable="false"
    >
      <Row class="search-algorithm-row" style="margin: 15px 0;">
        <Col span="6" style="text-align: right; padding-right: 10px;">
          <span>搜索算法：</span>
        </Col>
        <Col span="18" style="text-align: left;">
          <Select
            v-model="selectedSearchAlgorithm"
            placeholder="请选择搜索算法"
            style="width: 200px;"
          >
            <Option value="random">{{ SEARCH_ALGORITHM_NAMES[SEARCH_ALGORITHMS.RANDOM] }}</Option>
            <Option value="bayesian">{{ SEARCH_ALGORITHM_NAMES[SEARCH_ALGORITHMS.BAYESIAN] }}</Option>
          </Select>
        </Col>
      </Row>

      <Row style="margin: 15px 0;">
        <Col span="24">
          <div class="tuning-info">
            <p><strong>当前模型：</strong>{{ tuningModel.method }}</p>
            <p><strong>指标：</strong>{{ selectedIndicator.toUpperCase() }}</p>
            <p><strong>当前RMSE：</strong>{{ tuningModel.rmse }}</p>
          </div>
        </Col>
      </Row>
    </Modal>

    <!-- 调优结果模态框 -->
    <Modal v-model="showTuningResultModal" title="调优完成">
      <div class="tuning-result">
        <div class="result-item">
          <span class="label">最优RMSE：</span>
          <span class="value">{{ tuningResult.best_rmse }}</span>
        </div>
        <div class="params-title">最优参数：</div>
        <div class="params-list">
          <div class="param-item" v-for="(value, key) in tuningResult.params" :key="key">
            <span class="param-label">{{ formatParamName(key) }}：</span>
            <span class="param-value">{{ value }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <Button type="primary" @click="closeTuningResult">确认</Button>
      </template>
    </Modal>

    <!-- 调优进行中指示 -->
    <div id="tuning_holder" v-if="isTuning" style="height: 400px">
      <Spin size="large" fix style="font-size: 20px">
        正在使用 {{ selectedSearchAlgorithm.toUpperCase() }} 调优模型 {{ tuningModel.method }}...
      </Spin>
    </div>
  </div>
</template>

/**
 * 模型管理组件
 * @description 管理机器学习模型，包括模型查询、预测、调优和删除等功能
 * @author FxMarkBrown
 */
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, onMounted, computed, watch, nextTick} from 'vue'

// ============================ UI组件导入 ============================
import { Button, Col, Modal, Option, Row, Select, Spin, Table } from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import { useModelStore } from '@/stores/model'
import { useAuthStore } from '@/stores/auth'

// ============================ 工具函数导入 ============================
import { useChart } from '@/composables'
import { formatDate } from '@/utils/date'
import {ErrorHandler, showError} from '@/utils/error-handler'
import {
  MODEL_TABLE_COLUMNS,
  TUNABLE_MODELS,
  SEARCH_ALGORITHMS,
  WATER_QUALITY_INDICATOR_NAMES, WATER_QUALITY_INDICATORS, SEARCH_ALGORITHM_NAMES
} from '@/constants'

// ============================ 状态初始化 ============================
const modelStore = useModelStore()
const authStore = useAuthStore()

// ============================ 响应式数据定义 ============================

/** 选中的指标 */
const selectedIndicator = ref(WATER_QUALITY_INDICATORS.PH)

/** 选中的模型类型 */
const selectedModelType = ref('all')

/** 选中的模型用于预测 */
const selectedModel = reactive({})

/** 模型调优相关状态 */
const tuningModel = reactive({})

/** 选中的搜索算法 */
const selectedSearchAlgorithm = ref('')

/** 调优模态框显示状态 */
const showTuningModal = ref(false)

/** 调优结果模态框显示状态 */
const showTuningResultModal = ref(false)

/** 预测数据 */
const predictionData = reactive({
  prediction: '',
  dates: [],
  values: [],
  model: {}
})

/** 调优结果 */
const tuningResult = reactive({
  best_rmse: null,
  params: {}
})

// ============================ 计算属性 ============================

/** 是否正在调优 */
const isTuning = computed(() => modelStore.isTuning)

/** 是否正在预测 */
const isPredicting = computed(() => modelStore.isPredicting)

/** 表格列配置 */
const tableColumns = computed(() => MODEL_TABLE_COLUMNS)

/** 可用模型类型列表 */
const availableModelTypes = computed(() => modelStore.modelMethods)

/** 过滤后的模型列表 */
const filteredModels = computed(() => {
  const models = modelStore.availableModels
  if (selectedModelType.value === 'all') {
    return models
  }
  return models.filter(model => model.method === selectedModelType.value)
})

/** 是否正在加载模型 */
const isLoadingModels = computed(() => modelStore.isLoadingModels)

/** 是否有预测数据 */
const hasPredictionData = computed(() => predictionData.dates.length > 0)

/** 是否可以预测 */
const canPredict = computed(() => authStore.isAdmin && !isPredicting.value && !isTuning.value)

/** 是否可以调优 */
const canTune = computed(() => authStore.isAdmin && !isPredicting.value && !isTuning.value)

/** 是否可以删除 */
const canDelete = computed(() => authStore.isAdmin && !isPredicting.value && !isTuning.value)

// ============================ ECharts管理 ============================

/** 图表容器引用 */
const predictingChartRef = ref(null)

/** 图表管理组合函数 */
const {
  initChart,
  updateChart,
  chart
} = useChart(predictingChartRef)

// ============================ 监听器 ============================

/**
 * 监听指标变化，重新加载模型
 */
watch(selectedIndicator, () => {
  initializeModels()
})

// ============================ 业务方法 ============================

/**
 * 初始化模型数据
 */
const initializeModels = async () => {
  try {
    // 清空预测数据
    resetPredictionData()

    // 使用现有的initializeModels方法
    await modelStore.initializeModels(selectedIndicator.value)
  } catch (error) {
    ErrorHandler.handleGenericError(error, '获取模型数据')
  }
}

/**
 * 处理指标变化
 */
const handleIndicatorChange = () => {
  selectedModelType.value = 'all'
  initializeModels()
}

/**
 * 处理模型类型变化
 */
const handleModelTypeChange = () => {
  // 清空预测数据
  resetPredictionData()
}

/**
 * 判断模型是否可调优
 */
const isTunableModel = (modelMethod) => {
  return TUNABLE_MODELS.includes(modelMethod)
}

/**
 * 处理模型删除
 */
const handleDeleteModel = async (index) => {
  const model = filteredModels.value[index]
  if (!model) {
    showError('模型数据不存在')
    return
  }

  if (!canDelete.value) {
    showError('无权限执行此操作')
    return
  }

  try {
    // 确认删除
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模型 "${model.method}" 吗？此操作不可恢复。`,
      onOk: async () => {
        const success = await modelStore.deleteModel(model.id)
        if (success) {
          // 刷新模型列表
          await initializeModels()
        }
      }
    })
  } catch (error) {
    ErrorHandler.handleGenericError(error, '删除模型')
  }
}

/**
 * 处理模型预测
 */
const handlePrediction = async (index) => {
  const model = filteredModels.value[index]
  if (!model) {
    showError('模型数据不存在')
    return
  }

  if (!canPredict.value) {
    showError('无权限执行此操作')
    return
  }

  try {
    Object.assign(selectedModel, model)

    // 使用状态管理进行预测
    const success = await modelStore.predictModel({
      id: model.id,
      indicator: selectedIndicator.value
    })

    if (success && modelStore.predictionResult) {
      const result = modelStore.predictionResult
      // 更新预测数据
      predictionData.prediction = result.pred || result.prediction
      predictionData.values = result.forPlot || result.values
      predictionData.dates = (result.dates || []).map(date => {
        if (typeof date === 'string' || typeof date === 'number') {
          return formatDate(date, 'yyyy-MM-dd')
        }
        return date
      })
      predictionData.model = model

      // 等待预测状态更新后再渲染图表
      await nextTick()
      await renderPredictionChart()
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '模型预测')
  }
}

/**
 * 渲染预测图表
 */
const renderPredictionChart = async () => {
  // 确保图表容器存在且有预测数据
  if (!predictingChartRef.value || isPredicting.value || !hasPredictionData.value) {
    return
  }


  if (!chart.value) {
    await nextTick()
    // 小延迟确保DOM尺寸计算完成
    await new Promise(resolve => setTimeout(resolve, 100))
    await initChart()
  }

  const indicatorName = WATER_QUALITY_INDICATOR_NAMES[selectedIndicator.value] || selectedIndicator.value

  const chartConfig = {
    title: {
      left: 'center',
      text: `${indicatorName}下个月水质预测: ${predictionData.prediction}`,
      subtext: `使用模型: ${predictionData.model.method} | 训练者: ${predictionData.model.user} | 训练日期: ${predictionData.model.date}`
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      data: ['历史数据', '预测数据'],
      top: 40
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
      data: predictionData.dates,
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      name: indicatorName
    },
    series: [
      {
        name: '历史数据',
        data: predictionData.values.slice(0, -1),
        type: 'line',
        lineStyle: {
          color: '#3399FF'
        },
        itemStyle: {
          color: '#3399FF'
        },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '预测数据',
        data: Array(predictionData.values.length - 2)
          .fill(null)
          .concat([
            predictionData.values[predictionData.values.length - 2],
            predictionData.values[predictionData.values.length - 1]
          ]),
        type: 'line',
        lineStyle: {
          color: '#19be6b',
          type: 'dashed'
        },
        itemStyle: {
          color: '#19be6b'
        },
        symbol: 'diamond',
        symbolSize: 6
      }
    ]
  }

  updateChart(chartConfig)
}

/**
 * 显示调优模态框
 */
const showTuningDialog = (model) => {
  if (!canTune.value) {
    showError('无权限执行此操作')
    return
  }

  Object.assign(tuningModel, model)
  selectedSearchAlgorithm.value = SEARCH_ALGORITHMS.RANDOM
  showTuningModal.value = true
}

/**
 * 提交模型调优
 */
const submitTuning = async () => {
  if (!selectedSearchAlgorithm.value) {
    showError('请选择搜索算法')
    return
  }

  try {
    showTuningModal.value = false

    // 使用状态管理进行模型调优
    const success = await modelStore.tuneModel({
      modelId: tuningModel.id,
      method: selectedSearchAlgorithm.value
    })

    if (success && modelStore.tuningResult?.data) {
      const result = modelStore.tuningResult.data
      // 更新调优结果
      tuningResult.best_rmse = result.best_rmse
      tuningResult.params = result.best_params

      // 显示调优结果
      showTuningResultModal.value = true

      // 刷新模型列表
      await initializeModels()
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '模型调优')
  }
}

/**
 * 处理调优模态框取消
 */
const handleTuningCancel = () => {
  showTuningModal.value = false
  selectedSearchAlgorithm.value = ''
}

/**
 * 关闭调优结果模态框
 */
const closeTuningResult = () => {
  showTuningResultModal.value = false
  // 清空调优结果
  tuningResult.best_rmse = null
  tuningResult.params = {}
}

/**
 * 格式化参数名称
 */
const formatParamName = (paramKey) => {
  const nameMap = {
    learning_rate: '学习率',
    hidden_size: '隐藏层数量',
    num_layers: '叠加数量',
    batch_size: '小批量样本数量',
    epochs: '迭代轮数',
    dropout: '丢弃概率'
  }
  return nameMap[paramKey] || paramKey
}

/**
 * 重置预测数据
 */
const resetPredictionData = () => {
  predictionData.prediction = ''
  predictionData.dates = []
  predictionData.values = []
  predictionData.model = {}
}

// ============================ 生命周期钩子 ============================

/**
 * 组件挂载时初始化
 */
onMounted(async () => {
  await initializeModels()
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
