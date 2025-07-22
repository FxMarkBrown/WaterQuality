<template>
  <div class="content">
    <div class="title">
      <span>近期数据</span>
    </div>

    <!-- 近期数据表格区域 -->
    <div class="data_table">
      <Table
        class="table"
        border
        :loading="isLoading"
        :columns="tableColumns"
        :data="recentWaterQualities"
        empty-text="暂无近期数据"
      >
      </Table>
    </div>

    <!-- 新增数据按钮 -->
    <div class="add">
      <Button
        type="success"
        shape="circle"
        size="large"
        @click="showAddDialog"
        :disabled="!canAddData"
      >
        新增数据
      </Button>
    </div>

    <!-- 新增水质数据模态框 -->
    <Modal
      v-model="showAddModal"
      title="新增水质数据"
      @on-ok="addWaterQuality"
      @on-cancel="handleAddCancel"
      :mask-closable="false"
    >
      <!-- 时间选择 -->
      <Row class="editLine_time">
        <Col span="4" offset="5" style="text-align: center">
          <span>时间</span>
        </Col>
        <Col span="10">
          <DatePicker
            type="date"
            v-model="newWaterQuality.date"
            @on-change="handleDateChange"
            placeholder="选择采集日期"
            format="yyyy-MM-dd hh:mm:ss"
          />
          <div v-if="hasFieldError('date')" class="error-message">
            {{ getFieldError('date') }}
          </div>
        </Col>
      </Row>

      <!-- PH值和溶解氧 -->
      <Row class="editLine">
        <Col span="4" offset="1" style="text-align: center">
          <span>PH值</span>
        </Col>
        <Col span="6">
          <Input
            v-model="newWaterQuality.phValue"
            placeholder="请输入PH值"
            :status="hasFieldError('phValue') ? 'error' : ''"
          />
          <div v-if="hasFieldError('phValue')" class="error-message">
            {{ getFieldError('phValue') }}
          </div>
        </Col>
        <Col span="4" offset="1" style="text-align: center">
          <span>溶解氧</span>
        </Col>
        <Col span="6">
          <Input
            v-model="newWaterQuality.doValue"
            placeholder="请输入溶解氧值"
            :status="hasFieldError('doValue') ? 'error' : ''"
          />
          <div v-if="hasFieldError('doValue')" class="error-message">
            {{ getFieldError('doValue') }}
          </div>
        </Col>
      </Row>

      <!-- 氨氯和地点 -->
      <Row class="editLine">
        <Col span="4" offset="1" style="text-align: center">
          <span>氨氯</span>
        </Col>
        <Col span="6">
          <Input
            v-model="newWaterQuality.nh3nValue"
            placeholder="请输入氨氯值"
            :status="hasFieldError('nh3nValue') ? 'error' : ''"
          />
          <div v-if="hasFieldError('nh3nValue')" class="error-message">
            {{ getFieldError('nh3nValue') }}
          </div>
        </Col>
        <Col span="4" offset="1" style="text-align: center">
          <span>采集地点</span>
        </Col>
        <Col span="6">
          <Select
            v-model="newWaterQuality.station"
            placeholder="选择采集地点"
            :status="hasFieldError('station') ? 'error' : ''"
          >
            <Option
              v-for="station in availableStations"
              :value="station"
              :key="station"
            >
              {{ station }}
            </Option>
          </Select>
          <div v-if="hasFieldError('station')" class="error-message">
            {{ getFieldError('station') }}
          </div>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

/**
* 近期数据收集组件
* @description 显示最近的水质数据、新增数据等
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, onMounted, computed} from 'vue'

// ============================ UI组件导入 ============================
import {Button, Col, DatePicker, Input, Modal, Option, Row, Select, Table} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useWaterQualityStore} from '@/stores/waterquality'
import {useAuthStore} from '@/stores/auth'

// ============================ 工具函数导入 ============================
import {useForm} from '@/composables'
import {formatDate} from '@/utils/date'
import {ErrorHandler, showError} from '@/utils/error-handler'
import {doValueRules, nh3nValueRules, phValueRules, stationRules} from '@/utils/validation'
import {WATER_QUALITY_TABLE_COLUMNS, DEFAULT_WATER_QUALITY} from '@/constants'

// ============================ 状态初始化 ============================
const waterQualityStore = useWaterQualityStore()
const authStore = useAuthStore()

// ============================ 响应式数据定义 ============================

/** 新增数据模态框显示状态 */
const showAddModal = ref(false)

/** 新增水质数据表单 */
const newWaterQuality = reactive({
  ...DEFAULT_WATER_QUALITY,
  date: formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss')
})

// ============================ 计算属性 ============================

/** 表格列配置 */
const tableColumns = computed(() =>
  WATER_QUALITY_TABLE_COLUMNS.filter(column => column.slot !== 'action')
)

/** 近期水质数据 */
const recentWaterQualities = computed(() => waterQualityStore.recentWaterQualities)

/** 可用站点列表 */
const availableStations = computed(() => waterQualityStore.stations)

/** 是否正在加载 */
const isLoading = computed(() => waterQualityStore.isLoading)

/** 是否可以添加数据 */
const canAddData = computed(() => authStore.isAdmin)

// ============================ 表单验证配置 ============================

/**
 * 水质数据表单验证规则
 */
const waterQualityFormRules = {
  phValue: phValueRules,
  doValue: doValueRules,
  nh3nValue: nh3nValueRules,
  station: stationRules,
  date: [
    {
      required: true,
      message: '请选择采集时间',
      trigger: 'change'
    }
  ],
};

/** 新增数据表单验证 */
const {
  validateAll: validateWaterQuality,
  hasFieldError,
  getFieldError,
  resetForm: resetAddForm,
} = useForm(newWaterQuality, waterQualityFormRules)

// ============================ 业务方法 ============================

/**
 * 初始化近期数据
 */
const initializeRecentData = async () => {
  try {
    // 获取近期水质数据（默认10条）
    await waterQualityStore.getRecentWaterQuality(10)

    // 获取可用站点列表
    await waterQualityStore.getStations()
  } catch (error) {
    ErrorHandler.handleGenericError(error, '初始化近期数据')
  }
}

/**
 * 显示新增数据模态框
 */
const showAddDialog = () => {
  if (!canAddData.value) {
    showError('无权限执行此操作')
    return
  }

  resetAddForm()
  showAddModal.value = true
}

/**
 * 新增水质数据
 */
const addWaterQuality = async () => {
  // 重置表单
  resetAddForm()
  // 验证表单
  const isValid = await validateWaterQuality()
  if (!isValid) {
    return
  }

  if (!canAddData.value) {
    showError('无权限执行此操作')
    return
  }

  try {
    const addData = {
      phValue: Number(newWaterQuality.phValue),
      doValue: Number(newWaterQuality.doValue),
      nh3nValue: Number(newWaterQuality.nh3nValue),
      date: newWaterQuality.date,
      station: newWaterQuality.station.toString()
    }

    const success = await waterQualityStore.addWaterQuality(addData)

    if (success) {
      showAddModal.value = false
      resetAddForm()

      // 刷新近期数据
      await waterQualityStore.getRecentWaterQuality(10)
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '新增水质数据')
  }
}

/**
 * 处理日期变化
 */
const handleDateChange = (date) => {
  newWaterQuality.date = date
}

/**
 * 处理新增模态框取消
 */
const handleAddCancel = () => {
  showAddModal.value = false
  resetAddForm()
}

// ============================ 生命周期钩子 ============================

/**
 * 组件挂载时初始化数据
 */
onMounted(async () => {
  await initializeRecentData()
})
</script>

<style scoped>
.data_table {
  margin-top: 20px;
  margin-bottom: 20px;
  padding-left: 30px;
  padding-right: 30px;
}

.title {
  height: 32px;
  font-size: 20px;
  line-height: 32px;
  margin-top: 20px;
  text-align: center;
}

.add {
  text-align: center;
  margin: 20px 0;
}

.editLine {
  line-height: 32px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.editLine_time {
  line-height: 32px;
  margin-bottom: 15px;
}

/* 表单验证错误信息样式 */
.error-message {
  color: #ed4014;
  font-size: 11px;
  margin-top: 2px;
  line-height: 1.4;
}
</style>
