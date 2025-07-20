<template>
  <div class="content">
    <div class="time_picker">
      <Row class="queryline">
        <Col span="2" offset="1" style="text-align: center">地点</Col>
        <Col span="2" style="text-align: left">
          <Select v-model="station" >
            <Option value="-1">所有</Option>
            <Option v-for="item in stationList" :value="item" :key="item">{{ item }}</Option>
          </Select>
        </Col>
        <Col span="2" style="text-align: center;margin-left: 15px"><span>开始</span></Col>
        <Col span="4" style="text-align: left">
          <DatePicker v-if="date_loaded_flag" type="date"  @on-change="changeStartDate"
                      :value="startDate" :placeholder="startDateStr" ></DatePicker>
        </Col>
        <Col span="2" style="text-align: center;margin-left: 15px"><span>结束</span></Col>
        <Col span="4" style="text-align: left">
          <DatePicker v-if="date_loaded_flag" type="date"  @on-change="changeEndDate"
                      :value="endDate" :placeholder="endDateStr" ></DatePicker>
        </Col>
        <Col span="3" offset="1">
          <Button type="success" shape="circle" icon="ios-search" long @click="getQueriedWaterQualities(1)">查询</Button>
        </Col>
      </Row>
    </div>
    <div class="data_table">
      <Table class="table" border  :loading="loading_flag" :columns="columns" :data="showWaterQualities" @sort-change="sortBydate">
        <template #action="{ row, index }">
              <Button type="primary" size="default" style="margin-right: 10px" @click="show(index)">编辑</Button>
              <Button type="error" size="default" @click="remove(index)">删除</Button>
        </template>
      </Table>
    </div>
    <div class="page">
      <Page :current="currentPage" :total="waterQualities.length" show-elevator @on-change="changePage"/>
    </div>
    <Modal v-model="modal_flag" title="正在编辑数据" @on-ok="updateWaterQuality" >
          <Row class="editLine_time">
            <Col span="4" offset="7" style="text-align: center">
              <span>时间</span>
            </Col>
            <Col span="6">
              <span>{{ chosenWaterQuality.date }}</span>
            </Col>
          </Row>
          <Row class="editLine">
            <Col span="4" offset="1" style="text-align: center">
              <span>PH</span>
            </Col>
            <Col span="6">
                <Input v-model="chosenWaterQuality.phValue" :placeholder="chosenWaterQuality.phValue.toString()"></Input>
            </Col>
            <Col span="4" offset="1" style="text-align: center">
              <span>溶解氧</span>
            </Col>
            <Col span="6" >
              <Input v-model="chosenWaterQuality.doValue" :placeholder="chosenWaterQuality.doValue.toString()"></Input>
            </Col>
          </Row>
          <Row class="editLine">
            <Col span="4" offset="1" style="text-align: center">
              <span>氨氯</span>
            </Col>
            <Col span="6">
              <Input v-model="chosenWaterQuality.nh3nValue" :placeholder="chosenWaterQuality.nh3nValue.toString()"></Input>
            </Col>
            <Col span="4" offset="1" style="text-align: center">
              <span>地点</span>
            </Col>
            <Col span="6">
                <Select v-model="chosenWaterQuality.station">
                  <Option v-for="item in stationList" :value="item" :key="item">{{ item }}</Option>
                </Select>
            </Col>
          </Row>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import {Button, Col, DatePicker, Input, Message, Modal, Option, Page, Row, Select, Table} from 'view-ui-plus'
import { formatDate, cloneObj } from '@/utils/date'

const { proxy } = getCurrentInstance()

const waterQualities = ref([])
const showWaterQualities = ref([])
const stationList = ref([])
const currentPage = ref(1)
const startDate = ref(new Date())
const endDate = ref(new Date())
const startDateStr = ref('')
const endDateStr = ref('')
const station = ref('-1')
const chosenWaterQuality = reactive({
  phValue: 0,
  doValue: 0,
  nh3nValue: 0,
  date: '',
  station: 0
})
const date_loaded_flag = ref(false)
const loading_flag = ref(true)
const modal_flag = ref(false)

const columns = ref([
  {
    title: 'PH',
    key: 'phValue',
    align: 'center'
  },
  {
    title: '溶解氧',
    key: 'doValue',
    align: 'center'
  },
  {
    title: '氨氯',
    key: 'nh3nValue',
    align: 'center'
  },
  {
    title: '时间',
    key: 'date',
    align: 'center',
    sortable: 'custom'
  },
  {
    title: '地点',
    key: 'station',
    width: 100,
    align: 'center'
  },
  {
    title: '操作',
    slot: 'action',
    align: 'center',
    width: 200
  }
])

const getAllStations = () => {
  for (let i = 0; i < waterQualities.value.length; i++) {
    if (stationList.value.indexOf(waterQualities.value[i].station) === -1) {
      stationList.value.push(waterQualities.value[i].station)
    }
  }
}

const getStartAndEndTime = () => {
  if (waterQualities.value.length === 0) {
    return
  }

  startDate.value = new Date(waterQualities.value[0].date)
  endDate.value = new Date(waterQualities.value[waterQualities.value.length - 1].date)
  startDateStr.value = formatDate(startDate.value, 'yyyy-MM-dd')
  endDateStr.value = formatDate(endDate.value, 'yyyy-MM-dd')

  date_loaded_flag.value = true
}

const getAllWaterQualities = async () => {
  try {
    loading_flag.value = true
    const response = await proxy.$axios.get('/waterquality/all')
    waterQualities.value = response.data

    for (let i = 0; i < waterQualities.value.length; i++) {
      waterQualities.value[i].date = formatDate(waterQualities.value[i].date)
    }

    getAllStations()
    getStartAndEndTime()
    showWaterQualities.value = waterQualities.value.slice(0, 10)
    loading_flag.value = false
  } catch (error) {
    loading_flag.value = false
    Message.error('获取数据失败!')
  }
}

const getQueriedWaterQualities = async (mode = 2) => {
  try {
    loading_flag.value = true
    const date = new Date(endDateStr.value)

    const response = await proxy.$axios.get('/waterquality/query', {
      params: {
        station: station.value,
        startDate: startDateStr.value,
        endDate: formatDate(date, 'yyyy-MM-dd')
      }
    })

    waterQualities.value = response.data

    for (let i = 0; i < waterQualities.value.length; i++) {
      waterQualities.value[i].date = formatDate(waterQualities.value[i].date)
    }

    if (mode === 1) {
      currentPage.value = 1
    }

    showWaterQualities.value = waterQualities.value.slice(
      (currentPage.value - 1) * 10,
      currentPage.value * 10
    )
    loading_flag.value = false
  } catch (error) {
    loading_flag.value = false
    Message.error('查询失败!')
  }
}

const updateWaterQuality = async () => {
  try {
    const response = await proxy.$axios({
      url: '/waterquality/update/' + chosenWaterQuality.id.toString(),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        phValue: chosenWaterQuality.phValue,
        doValue: chosenWaterQuality.doValue,
        nh3nValue: chosenWaterQuality.nh3nValue,
        date: formatDate(new Date(chosenWaterQuality.date)),
        station: chosenWaterQuality.station
      })
    })

    if (response.data.status === 'success') {
      Message.success('编辑成功!')
      getQueriedWaterQualities()
    } else if (response.data.status === 'deny') {
      Message.error('权限不足!')
    } else {
      Message.error('编辑失败!')
    }
  } catch (error) {
    Message.error('编辑失败!')
  }
}

const changePage = (index) => {
  currentPage.value = index
  showWaterQualities.value = waterQualities.value.slice((index - 1) * 10, index * 10)
}

const asc_sorter = (a, b) => {
  if (a.date < b.date) {
    return -1
  } else if (a.date > b.date) {
    return 1
  } else {
    return 0
  }
}

const desc_sorter = (a, b) => {
  if (a.date < b.date) {
    return 1
  } else if (a.date > b.date) {
    return -1
  } else {
    return 0
  }
}

const sortBydate = (value) => {
  if (value.order === 'asc') {
    waterQualities.value.sort(asc_sorter)
  } else {
    waterQualities.value.sort(desc_sorter)
  }
  changePage(currentPage.value)
}

const changeStartDate = (date) => {
  startDateStr.value = date
  startDate.value = new Date(date)
}

const changeEndDate = (date) => {
  endDateStr.value = date
  endDate.value = new Date(date)
}

const show = (index) => {
  Object.assign(chosenWaterQuality, cloneObj(showWaterQualities.value[index]))
  modal_flag.value = true
}

const remove = async (index) => {
  try {
    Object.assign(chosenWaterQuality, showWaterQualities.value[index])
    const response = await proxy.$axios.post('/waterquality/delete/' + chosenWaterQuality.id.toString())

    if (response.data.status === 'success') {
      Message.success('成功删除!')
      getQueriedWaterQualities()
    } else if (response.data.status === 'deny') {
      Message.error('权限不足!')
    } else {
      Message.error('删除失败!')
    }
  } catch (error) {
    Message.error('删除失败!')
  }
}

onMounted(() => {
  getAllWaterQualities()
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
</style>
