import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ViewUIPlus from 'view-ui-plus'
import axios from 'axios'
import qs from 'qs'
import * as echarts from 'echarts'
import 'view-ui-plus/dist/styles/viewuiplus.css'

axios.defaults.baseURL = 'http://localhost:8080'
axios.defaults.withCredentials = true

const app = createApp(App)

app.config.globalProperties.$axios = axios
app.config.globalProperties.$qs = qs
app.config.globalProperties.$echarts = echarts

app.use(router)
app.use(ViewUIPlus)

app.mount('#app')
