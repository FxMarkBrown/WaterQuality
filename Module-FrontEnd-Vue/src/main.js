import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ViewUIPlus from 'view-ui-plus'
import axios from 'axios'
import qs from 'qs'
import * as echarts from 'echarts'
import 'view-ui-plus/dist/styles/viewuiplus.css'

// 导入Pinia状态管理
import { pinia } from '@/stores'

// 导入配置管理器
import { configManager } from '@/config'

// 导入错误处理器
import { ErrorHandler } from '@/utils/error-handler'

// 配置axios默认值
axios.defaults.baseURL = configManager.getApiBaseUrl()
axios.defaults.withCredentials = true
axios.defaults.timeout = configManager.getRequestTimeout()

// 配置错误处理器
ErrorHandler.configure({
  enableConsoleLog: configManager.isDebugEnabled(),
  enableUserNotification: true,
})

// 创建Vue应用实例
const app = createApp(App)

// 全局属性配置（向后兼容）
app.config.globalProperties.$axios = axios
app.config.globalProperties.$qs = qs
app.config.globalProperties.$echarts = echarts

// 注册插件
app.use(pinia)  // 状态管理
app.use(router) // 路由
app.use(ViewUIPlus) // UI组件库

// 挂载应用
app.mount('#app')
