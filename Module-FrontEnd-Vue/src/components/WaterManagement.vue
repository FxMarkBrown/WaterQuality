<template>
  <div class="content">
    <!-- 查询条件区域 -->
    <div class="time_picker">
      <Row class="queryline">
        <!-- 站点选择 -->
        <Col span="2" offset="1" style="text-align: center">地点</Col>
        <Col span="2" style="text-align: left">
          <Select v-model="selectedStation" placeholder="选择站点">
            <Option :value="ALL_STATIONS_VALUE_REF">所有站点</Option>
            <Option v-for="station in availableStations" :value="station" :key="station">
              {{ station }}
            </Option>
          </Select>
        </Col>

        <!-- 开始日期 -->
        <Col span="2" style="text-align: center;margin-left: 15px">
          <span>开始日期</span>
        </Col>
        <Col span="4" style="text-align: left">
          <DatePicker
            v-if="isDatePickerReady"
            type="date"
            v-model="startDateStr"
            @on-change="handleStartDateChange"
            placeholder="选择开始日期"
            format="yyyy-MM-dd"
          />
        </Col>

        <!-- 结束日期 -->
        <Col span="2" style="text-align: center;margin-left: 15px">
          <span>结束日期</span>
        </Col>
        <Col span="4" style="text-align: left">
          <DatePicker
            v-if="isDatePickerReady"
            type="date"
            v-model="endDateStr"
            @on-change="handleEndDateChange"
            placeholder="选择结束日期"
            format="yyyy-MM-dd"
          />
        </Col>

        <!-- 查询按钮 -->
        <Col span="3" offset="1">
          <Button
            type="success"
            shape="circle"
            icon="ios-search"
            long
            :loading="isLoading"
            @click="performQuery"
          >
            {{ isLoading ? '查询中...' : '查询' }}
          </Button>
        </Col>
      </Row>
    </div>
    <!-- 数据表格区域 -->
    <div class="data_table">
      <Table
        class="table"
        border
        :loading="isLoading"
        :columns="tableColumns"
        :data="currentWaterQualities"
        @on-sort-change="handleSort"
        empty-text="暂无水质数据"
      >
        <!-- 操作列模板 -->
        <template #action="{ row, index }">
          <Button
            type="primary"
            size="default"
            style="margin-right: 10px"
            @click="showEditDialog(index)"
            :disabled="!canEdit"
          >
            编辑
          </Button>
          <Button
            type="error"
            size="default"
            @click="deleteWaterQuality(index)"
            :disabled="!canDelete"
          >
            删除
          </Button>
        </template>
      </Table>
    </div>

    <!-- 分页区域 -->
    <div class="page">
      <Page
        :current="currentPage"
        :total="totalCount"
        :page-size="DEFAULT_PAGE_SIZE"
        show-elevator
        show-sizer
        show-total
        @on-change="handlePageChange"
      />
    </div>
    <!-- 水质数据编辑模态框 -->
    <Modal
      v-model="showEditModal"
      title="编辑水质数据"
      @on-ok="updateWaterQuality"
      @on-cancel="handleEditCancel"
      :mask-closable="false"
    >
      <!-- 时间显示（只读） -->
      <Row class="editLine_time">
        <Col span="4" offset="7" style="text-align: center">
          <span>采集时间</span>
        </Col>
        <Col span="6">
          <span>{{ editingWaterQuality.date }}</span>
        </Col>
      </Row>

      <!-- PH值和溶解氧 -->
      <Row class="editLine">
        <Col span="4" offset="1" style="text-align: center">
          <span>PH值</span>
        </Col>
        <Col span="6">
          <Input
            v-model="editingWaterQuality.phValue"
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
            v-model="editingWaterQuality.doValue"
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
            v-model="editingWaterQuality.nh3nValue"
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
            v-model="editingWaterQuality.station"
            placeholder="选择采集地点"
            :status="hasFieldError('station') ? 'error' : ''"
          >
            <Option v-for="station in availableStations" :value="station" :key="station">
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
* 水质数据管理组件
* @description 管理水质数据，包括查询、编辑、删除等
* @author FxMarkBrown
*/
<script setup>
// ============================ 核心导入 ============================
import {ref, reactive, onMounted, computed, watch} from 'vue'

// ============================ UI组件导入 ============================
import {Button, Col, DatePicker, Input, Modal, Option, Page, Row, Select, Table} from 'view-ui-plus'

// ============================ 状态管理导入 ============================
import {useWaterQualityStore} from '@/stores/waterquality'
import {useAuthStore} from '@/stores/auth'

// ============================ 工具函数导入 ============================
import {useForm} from '@/composables'
import {cloneObj} from '@/utils/clone'
import {formatDate} from '@/utils/date'
import {ErrorHandler, showError} from '@/utils/error-handler'
import {doValueRules, nh3nValueRules, phValueRules, stationRules} from '@/utils/validation'
import {WATER_QUALITY_TABLE_COLUMNS, ALL_STATIONS_VALUE, DEFAULT_PAGE_SIZE} from '@/constants'

// 导入ALL_STATIONS_VALUE到模板中使用
const ALL_STATIONS_VALUE_REF = ALL_STATIONS_VALUE

// ============================ 状态初始化 ============================
const waterQualityStore = useWaterQualityStore()
const authStore = useAuthStore()

// ============================ 响应式数据定义 ============================

/** 当前页码 */
const currentPage = ref(1)

/** 开始日期 */
const startDateStr = ref('')

/** 结束日期 */
const endDateStr = ref('')

/** 选中的站点 */
const selectedStation = ref(ALL_STATIONS_VALUE_REF)

/** 日期选择器加载状态 */
const isDatePickerReady = ref(false)

/** 编辑模态框显示状态 */
const showEditModal = ref(false)

/** 当前编辑的水质数据 */
const editingWaterQuality = reactive({
  id: 0,
  phValue: 0,
  doValue: 0,
  nh3nValue: 0,
  date: '',
  station: ''
})

// ============================ 计算属性 ============================

/** 表格列配置 */
const tableColumns = computed(() => WATER_QUALITY_TABLE_COLUMNS)

/** 可用站点列表 */
const availableStations = computed(() => waterQualityStore.stations)

/** 当前显示的水质数据 */
const currentWaterQualities = computed(() => {
  const start = (currentPage.value - 1) * DEFAULT_PAGE_SIZE
  const end = start + DEFAULT_PAGE_SIZE
  return waterQualityStore.waterQualities.slice(start, end)
})

/** 数据总数 */
const totalCount = computed(() => waterQualityStore.waterQualities.length)

/** 是否正在加载 */
const isLoading = computed(() => waterQualityStore.isLoading)

/** 是否可以编辑数据 */
const canEdit = computed(() => authStore.isAdmin)

/** 是否可以删除数据 */
const canDelete = computed(() => authStore.isAdmin)

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

/** 水质数据编辑表单验证 */
const {
  validateAll: validateWaterQuality,
  hasFieldError,
  getFieldError,
  resetForm: resetEditForm,
} = useForm(editingWaterQuality, waterQualityFormRules)

// ============================ 业务方法 ============================

/**
 * 初始化日期范围
 */
const initializeDateRange = () => {
  const data = waterQualityStore.waterQualities
  if (data.length === 0) return

  // 设置默认日期范围为数据的开始和结束日期
  startDateStr.value = formatDate(new Date(data[0].date), 'yyyy-MM-dd')
  endDateStr.value = formatDate(new Date(data[data.length - 1].date), 'yyyy-MM-dd')

  isDatePickerReady.value = true
}

/**
 * 监听水质数据变化，初始化日期选择器
 */
watch(() => waterQualityStore.waterQualities, (newData) => {
  if (newData.length > 0 && !isDatePickerReady.value) {
    initializeDateRange()
  }
}, {immediate: true})

/**
 * 执行水质数据查询
 */
const performQuery = async () => {
  if (!startDateStr.value || !endDateStr.value) {
    showError('请选择查询日期范围')
    return
  }

  try {
    const queryParams = {
      station: selectedStation.value,
      startDate: startDateStr.value,
      endDate: endDateStr.value
    }

    await waterQualityStore.queryWaterQuality(queryParams)
    currentPage.value = 1 // 重置页码
  } catch (error) {
    ErrorHandler.handleGenericError(error, '查询水质数据')
  }
}

/**
 * 更新水质数据
 */
const updateWaterQuality = async () => {
  // 重置表单
  resetEditForm()
  // 验证表单
  const isValid = await validateWaterQuality()
  if (!isValid) {
    return
  }

  if (!canEdit.value) {
    showError('无权限执行此操作')
    return
  }

  try {
    const updateData = {
      phValue: Number(editingWaterQuality.phValue),
      doValue: Number(editingWaterQuality.doValue),
      nh3nValue: Number(editingWaterQuality.nh3nValue),
      date: editingWaterQuality.date,
      station: editingWaterQuality.station.toString()
    }

    const success = await waterQualityStore.updateWaterQuality(editingWaterQuality.id, updateData)

    if (success) {
      showEditModal.value = false
      resetEditForm()

      // 刷新当前查询结果
      await performQuery()
    }
  } catch (error) {
    ErrorHandler.handleGenericError(error, '更新水质数据')
  }
}

/**
 * 处理分页变化
 */
const handlePageChange = (page) => {
  currentPage.value = page
}

/**
 * 处理表格排序
 */
const handleSort = (sortInfo) => {
  const {key, order} = sortInfo
  waterQualityStore.sortWaterQualities(key, order)
}

/**
 * 处理开始日期变化
 */
const handleStartDateChange = (date) => {
  startDateStr.value = date
}

/**
 * 处理结束日期变化
 */
const handleEndDateChange = (date) => {
  endDateStr.value = date
}

/**
 * 显示编辑模态框
 */
const showEditDialog = (index) => {
  const waterQuality = currentWaterQualities.value[index]
  if (!waterQuality) {
    showError('数据不存在')
    return
  }

  if (!canEdit.value) {
    showError('无权限执行此操作')
    return
  }

  // 复制数据到编辑表单
  Object.assign(editingWaterQuality, cloneObj(waterQuality))
  showEditModal.value = true
}

/**
 * 删除水质数据
 */
const deleteWaterQuality = async (index) => {
  const waterQuality = currentWaterQualities.value[index]
  if (!waterQuality) {
    showError('数据不存在')
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
      content: `确定要删除该水质数据吗？此操作不可恢复。`,
      onOk: async () => {
        const success = await waterQualityStore.deleteWaterQuality(waterQuality.id)

        if (success) {
          // 刷新当前查询结果
          await performQuery()
        }
      }
    })
  } catch (error) {
    ErrorHandler.handleGenericError(error, '删除水质数据')
  }
}

/**
 * 处理编辑模态框取消
 */
const handleEditCancel = () => {
  showEditModal.value = false
  resetEditForm()
}

// ============================ 生命周期钩子 ============================

/**
 * 组件挂载时初始化数据
 */
onMounted(async () => {
  await waterQualityStore.initializeWaterQuality()
})
</script>

<style scoped>
.data_table {
  margin-top: 20px;
  margin-bottom: 10px;
  padding-left: 30px;
  padding-right: 30px;
}

.time_picker {
  margin-top: 20px;
}

.queryline {
  line-height: 32px;
}

.editLine {
  line-height: 32px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.editLine_time {
  line-height: 32px;
  margin-bottom: 10px;
}

.page {
  margin: 20px;
  text-align: center;
}

/* 表单验证错误信息样式 */
.error-message {
  color: #ed4014;
  font-size: 11px;
  margin-top: 2px;
  line-height: 1.4;
}
</style>
