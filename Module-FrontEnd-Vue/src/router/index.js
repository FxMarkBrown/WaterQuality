import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/components/Home.vue'
import WaterManagement from '@/components/WaterManagement.vue'
import RecentCollection from '@/components/RecentCollection.vue'
import WaterTrend from '@/components/WaterTrend.vue'
import ModelManagement from '@/components/ModelManagement.vue'
import ModelTraining from '@/components/ModelTraining.vue'
import Login from '@/components/Login.vue'
import UserManagement from '@/components/UserManagement.vue'

const routes = [
  {
    path: '/',
    name: '登录',
    component: Login
  },
  {
    path: '/home',
    name: '主页',
    component: Home,
    children: [
      {
        path: '/recent',
        name: '近日收集',
        component: RecentCollection
      },
      {
        path: '/manage',
        name: '历史数据',
        component: WaterManagement
      },
      {
        path: '/trend',
        name: '数据走势',
        component: WaterTrend
      },
      {
        path: '/model',
        name: '模型管理',
        component: ModelManagement
      },
      {
        path: '/train',
        name: '模型训练',
        component: ModelTraining
      },
      {
        path: '/user',
        name: '用户管理',
        component: UserManagement
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
