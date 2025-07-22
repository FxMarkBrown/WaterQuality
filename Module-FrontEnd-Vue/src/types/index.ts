/**
 * 水质监测系统类型定义
 * @author FxMarkBrown
 * @description 使用TypeScript封装项目中的类型定义
 */

// ============================ API响应基础类型 ============================

/** API响应状态 */
export type ApiStatus = 'success' | 'deny' | 'error' | 'duplicate';

/** 标准API响应结构 */
export interface ApiResponse<T = any> {
  /** 状态码 */
  status: ApiStatus;
  /** 响应消息 */
  msg?: string;
  /** 响应数据 */
  data?: T;
}

// ============================ 用户相关类型 ============================

/** 用户角色ID枚举 */
export enum UserRoleId {
  /** 超级管理员 */
  SUPER_ADMIN = 1,
  /** 管理员 */
  ADMIN = 2,
  /** 普通用户 */
  USER = 3,
}

/** 用户角色对象 */
export interface UserRole {
  /** 角色ID */
  id: UserRoleId;
}

/** 用户信息（API返回） */
export interface ApiUser {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 用户角色 */
  role: UserRole;
}

/** 用户信息（组件内使用） */
export interface User {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 用户角色（转换后的字符串） */
  role: string;
  /** 权限描述 */
  authority: string;
}

/** 用户登录请求 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/** 注册表单数据 */
export interface RegisterForm {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
}

/** 密码修改表单数据 */
export interface PasswordChangeForm {
  /** 原密码 */
  originPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/** 用户权限授予请求 */
export interface UserGrantRequest {
  /** 角色名称 */
  roleName: 'vip' | 'user'; // vip: 管理员, user: 普通用户
}

// ============================ 水质数据相关类型 ============================

/** 水质指标类型 */
export type WaterQualityIndicator = 'ph' | 'do' | 'nh3N';

/** 水质数据对象（API返回） */
export interface ApiWaterQuality {
  /** 数据ID */
  id: number;
  /** pH值 */
  phValue: number;
  /** 溶解氧 */
  doValue: number;
  /** 氨氮值 */
  nh3nValue: number;
  /** 采集时间（原始字符串） */
  date: string;
  /** 采集站点 */
  station: string;
}

/** 水质数据对象（组件内使用，日期已格式化） */
export interface WaterQuality extends Omit<ApiWaterQuality, 'date'> {
  /** 采集时间（格式化后） */
  date: string;
}

/** 水质数据添加/更新请求 */
export interface WaterQualityRequest {
  /** pH值 */
  phValue: number;
  /** 溶解氧 */
  doValue: number;
  /** 氨氮值 */
  nh3nValue: number;
  /** 采集时间（格式: yyyy-MM-dd） */
  date: string;
  /** 采集站点 */
  station: string;
}

/** 水质数据查询参数 */
export interface WaterQualityQueryParams {
  /** 站点（'-1'表示所有站点） */
  station?: string;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
  /** 数据数量（用于recent接口） */
  num?: number;
}

/** 趋势图查询参数 */
export interface TrendPlotParams {
  /** 站点 */
  station: string;
  /** 时间周期（'1':近1年, '3':近3年, '5':近5年） */
  period: '1' | '3' | '5';
  /** 水质指标 */
  indicator: WaterQualityIndicator;
}

/** 趋势图响应数据 */
export interface TrendPlotResponse {
  /** 水质数值数组 */
  waterquality: number[];
  /** 日期数组 */
  dates: string[];
}

// ============================ 模型相关类型 ============================

/** 模型类型枚举 */
export enum ModelType {
  /** 支持向量机 */
  SVM = 'SVM',
  /** Boosting算法 */
  ADABOOST = 'Adaboost',
  /** 长短时记忆网络 */
  LSTM = 'LSTM',
  /** 门控循环单元网络 */
  GRU = 'GRU',
  /** 双向循环神经网络 */
  BI_RNN = 'Bi-RNN',
}

/** 搜索算法类型 */
export type SearchAlgorithm = 'random' | 'bayesian';

/** 模型信息（API返回） */
export interface ApiModel {
  /** 模型ID */
  id: number;
  /** 模型类型 */
  method: string;
  /** 均方根误差 */
  rmse: number;
  /** 训练用户信息 */
  user: {
    username: string;
  };
  /** 训练日期（原始字符串） */
  date: string;
}

/** 模型信息（组件内使用） */
export interface Model {
  /** 模型ID */
  id: number;
  /** 模型类型 */
  method: string;
  /** 均方根误差 */
  rmse: number;
  /** 训练用户名 */
  user: string;
  /** 训练日期（格式化后） */
  date: string;
}

/** 模型训练请求参数 */
export interface ModelTrainingParams {
  /** 水质指标 */
  indicator: WaterQualityIndicator;
  /** 模型类型 */
  method: ModelType;
  /** 用户ID */
  uid: number;
}

/** 模型训练响应数据 */
export interface ModelTrainingResponse {
  /** 状态 */
  status: ApiStatus;
  /** 训练结果数据 */
  data?: {
    /** 均方根误差 */
    rmse: number;
    /** 预测值数组 */
    pred: number[];
    /** 真实值数组 */
    real: number[];
  };
}

/** 模型预测请求参数 */
export interface ModelPredictionParams {
  /** 模型ID */
  id: number;
  /** 水质指标 */
  indicator: WaterQualityIndicator;
}

/** 模型预测响应数据 */
export interface ModelPredictionResponse {
  /** 状态 */
  status: ApiStatus;
  /** 预测值 */
  pred?: number;
  /** 用于绘图的数据 */
  forPlot?: number[];
  /** 日期数组 */
  dates?: string[];
}

/** 模型调优参数 */
export interface TuningParams {
  /** 学习率 */
  learning_rate: number;
  /** 隐藏层大小 */
  hidden_size: number;
  /** 层数 */
  num_layers: number;
  /** 批次大小 */
  batch_size: number;
  /** 训练轮数 */
  epochs: number;
  /** Dropout概率 */
  dropout: number;
}

/** 模型调优请求参数 */
export interface ModelTuningParams {
  /** 模型ID */
  id: number;
  /** 搜索算法 */
  method: SearchAlgorithm;
}

/** 模型调优响应数据 */
export interface ModelTuningResponse {
  /** 状态 */
  status: ApiStatus;
  /** 错误消息 */
  msg?: string;
  /** 调优结果 */
  data?: {
    /** 最优RMSE */
    best_rmse: number;
    /** 最优参数 */
    best_params: TuningParams;
  };
}

// ============================ 表格配置类型 ============================

/** 表格列配置 */
export interface TableColumn {
  /** 列标题 */
  title: string;
  /** 数据字段名 */
  key?: string;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否可排序 */
  sortable?: boolean | string;
  /** 列宽 */
  width?: number;
  /** 插槽名称 */
  slot?: string;
  /** 过滤器配置 */
  filters?: Array<{
    label: string;
    value: any;
  }>;
  /** 是否支持多选过滤 */
  filterMultiple?: boolean;
}

// ============================ ECharts图表类型 ============================

/** ECharts基础配置 */
export interface EChartsOption {
  /** 图表标题 */
  title?: {
    /** 主标题 */
    text?: string;
    /** 副标题 */
    subtext?: string;
    /** 标题位置 */
    left?: string;
  };
  /** 图例配置 */
  legend?: {
    /** 图例数据 */
    data?: string[];
    /** 图例位置 */
    top?: string;
  };
  /** 提示框配置 */
  tooltip?: {
    /** 触发类型 */
    trigger?: 'item' | 'axis';
  };
  /** X轴配置 */
  xAxis?: {
    /** 轴类型 */
    type?: 'category' | 'value';
    /** 轴数据 */
    data?: (string | number)[];
    /** 轴标签配置 */
    axisLabel?: {
      /** 旋转角度 */
      rotate?: number;
      /** 显示间隔 */
      interval?: number;
    };
  };
  /** Y轴配置 */
  yAxis?: {
    /** 轴类型 */
    type?: 'category' | 'value';
    /** 是否缩放 */
    scale?: boolean;
  };
  /** 数据系列 */
  series?: Array<{
    /** 系列名称 */
    name?: string;
    /** 数据 */
    data?: (number | null)[];
    /** 图表类型 */
    type?: 'line' | 'bar';
    /** 线条样式 */
    lineStyle?: {
      /** 线条颜色 */
      color?: string;
    };
  }>;
}

// ============================ 表单验证类型 ============================

/** 表单验证规则 */
export interface FormRule {
  /** 是否必填 */
  required?: boolean;
  /** 错误消息 */
  message?: string;
  /** 触发时机 */
  trigger?: 'blur' | 'change';
  /** 验证类型 */
  type?: 'string' | 'number' | 'email';
  /** 最小长度/值 */
  min?: number;
  /** 最大长度/值 */
  max?: number;
  /** 正则表达式模式 */
  pattern?: RegExp;
  /** 自定义验证函数 */
  validator?: (value: any) => boolean;
}

/** 表单验证规则集合 */
export type FormRules = Record<string, FormRule[]>;

// ============================ 工具类型 ============================

/** 日期格式化选项 */
export type DateFormat = 'yyyy-MM-dd' | 'yyyy-MM-dd hh:mm:ss' | 'yyyy-MM';

// ============================ Vue相关类型重导出 ============================

export type {
  // Vue核心类型
  ComponentPublicInstance,
  Ref,
  ComputedRef,
  UnwrapRef,
} from 'vue';

export type {
  // Vue Router类型
  RouteRecordRaw,
  Router,
  RouteLocationNormalized,
} from 'vue-router';

export type {
  // Axios类型
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from 'axios';
