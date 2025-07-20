<template>
  <div class="content">
    <div class="title">
      <span>近期数据</span>
    </div>
    <div class="data_table">
      <Table border  :loading="loading_flag"  :columns="columns" :data="waterQualities">
      </Table>
    </div>
    <div class="add">
      <Button type="success" shape="circle" size="large" @click="showModal">新增数据</Button>
    </div>
    <Modal v-model="modal_flag" title="新增水质数据" @on-ok="addWaterQuality" >
      <Row class="editLine_time">
        <Col span="4" offset="5" style="text-align: center">
          <span>时间</span>
        </Col>
        <Col>
          <DatePicker type="date"  :value="toBeAddedWaterQuality.date" @on-change="changeDate"></DatePicker>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="1" style="text-align: center">
          <span>PH</span>
        </Col>
        <Col span="6">
          <Input v-model="toBeAddedWaterQuality.phValue"></Input>
        </Col>
        <Col span="4" offset="1" style="text-align: center">
          <span>溶解氧</span>
        </Col>
        <Col span="6" >
          <Input v-model="toBeAddedWaterQuality.doValue"></Input>
        </Col>
      </Row>
      <Row class="editLine">
        <Col span="4" offset="1" style="text-align: center">
          <span>氨氯</span>
        </Col>
        <Col span="6">
          <Input v-model="toBeAddedWaterQuality.nh3nValue"></Input>
        </Col>
        <Col span="4" offset="1" style="text-align: center">
          <span>地点</span>
        </Col>
        <Col span="6">
          <Select v-model="toBeAddedWaterQuality.station">
            <Option v-for="item in stationList" :value="item" :key="item">{{ item }}</Option>
          </Select>
        </Col>
      </Row>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import {Button, Col, DatePicker, Input, Message, Modal, Option, Row, Select, Table} from 'view-ui-plus'
import { formatDate } from '@/utils/date'

const { proxy } = getCurrentInstance()

const loading_flag = ref(true)
const modal_flag = ref(false)
const stationList = ref([])
const waterQualities = ref([])

const toBeAddedWaterQuality = reactive({
  phValue: 0,
  doValue: 0,
  nh3nValue: 0,
  date: new Date(),
  station: ''
})

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
    align: 'center'
  },
  {
    title: '地点',
    key: 'station',
    width: 100,
    align: 'center'
  }
])

const getAllStations = async () => {
  try {
    const response = await proxy.$axios.get('waterquality/station')
    stationList.value = response.data
  } catch (error) {
    Message.error('获取站点失败!')
  }
}

const getRecentWaterQualities = async (num = 10) => {
  try {
    loading_flag.value = true
    const response = await proxy.$axios.get('waterquality/recent', {
      params: {
        num: num
      }
    })

    waterQualities.value = response.data

    for (let i = 0; i < waterQualities.value.length; i++) {
      waterQualities.value[i].date = formatDate(waterQualities.value[i].date)
    }

    loading_flag.value = false
  } catch (error) {
    loading_flag.value = false
    Message.error('获取数据失败!')
  }
}

const showModal = () => {
  modal_flag.value = true
}

const addWaterQuality = async () => {
  try {
    const response = await proxy.$axios.post('waterquality/add', {
      phValue: toBeAddedWaterQuality.phValue,
      doValue: toBeAddedWaterQuality.doValue,
      nh3nValue: toBeAddedWaterQuality.nh3nValue,
      date: formatDate(toBeAddedWaterQuality.date),
      station: toBeAddedWaterQuality.station
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.data.status === 'success') {
      Message.success('成功添加!')
    } else if (response.data.status === 'deny') {
      Message.error('权限不足!')
    } else {
      Message.error('添加失败!')
    }

    getRecentWaterQualities()
  } catch (error) {
    Message.error('添加失败!')
  }
}

const changeDate = (date) => {
  toBeAddedWaterQuality.date = new Date(date)
}

onMounted(() => {
  getAllStations()
  getRecentWaterQualities()
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
</style>
