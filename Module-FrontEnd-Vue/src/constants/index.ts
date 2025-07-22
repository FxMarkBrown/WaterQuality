/**
 * 应用常量定义
 * @author FxMarkBrown
 * @description 常量定义
 */

import {
  WaterQualityIndicator,
  ModelType,
  SearchAlgorithm,
  TableColumn, UserRoleId
} from '@/types';

// ============================ API配置常量 ============================

/** API基础URL */
export const API_BASE_URL = 'http://localhost:8080';

/** API请求超时时间（毫秒） */
export const API_TIMEOUT = 10000;

/** API端点路径 */
export const API_ENDPOINTS = {
  // 用户认证相关
  LOGIN: '/login',
  LOGOUT: '/logout',
  REGISTER: '/user/register',
  CURRENT_USER: '/user/current',

  // 用户管理相关
  USER_ALL: '/user/all',
  USER_QUERY: '/user/query',
  USER_GRANT: '/user/grant',
  USER_DELETE: '/user/delete',
  USER_EDIT_PASSWORD: '/user/editPassword',

  // 水质数据相关
  WATER_QUALITY_ALL: '/waterquality/all',
  WATER_QUALITY_QUERY: '/waterquality/query',
  WATER_QUALITY_RECENT: '/waterquality/recent',
  WATER_QUALITY_STATION: '/waterquality/station',
  WATER_QUALITY_ADD: '/waterquality/add',
  WATER_QUALITY_UPDATE: '/waterquality/update',
  WATER_QUALITY_DELETE: '/waterquality/delete',
  WATER_QUALITY_PLOT: '/waterquality/plot',

  // 模型相关
  MODEL_AVAILABLE: '/model/available',
  MODEL_LIST: '/model/list',
  MODEL_PREDICTION: '/model/prediction',
  MODEL_DELETE: '/model/delete',
  MODEL_TRAINING: '/model/training',
  MODEL_TUNING: '/model/tuning',
} as const;

// ============================ 用户角色常量 ============================

/** 用户角色ID */
export const USER_ROLES = {
  SUPER_ADMIN: 1 as UserRoleId,
  ADMIN: 2 as UserRoleId,
  USER: 3 as UserRoleId,
} as const;

/** 用户角色显示名称 */
export const USER_ROLE_NAMES = {
  [USER_ROLES.SUPER_ADMIN]: '超级管理员' as const,
  [USER_ROLES.ADMIN]: '管理员' as const,
  [USER_ROLES.USER]: '普通用户' as const,
} as const;

/** 用户权限描述 */
export const USER_AUTHORITY_DESCRIPTIONS = {
  [USER_ROLES.SUPER_ADMIN]: '所有权限' as const,
  [USER_ROLES.ADMIN]: '查询, 创建, 修改, 删除水质数据; 预测水质; 训练模型' as const,
  [USER_ROLES.USER]: '查询水质数据; 预测水质' as const,
} as const;

/** 权限授予选项 */
export const GRANT_ROLE_OPTIONS = {
  VIP: 'vip' as const,     // 管理员权限
  USER: 'user' as const,   // 普通用户权限
} as const;

// ============================ 水质数据常量 ============================

/** 水质指标类型 */
export const WATER_QUALITY_INDICATORS = {
  PH: 'ph' as WaterQualityIndicator,
  DO: 'do' as WaterQualityIndicator,
  NH3N: 'nh3N' as WaterQualityIndicator,
} as const;

/** 水质指标显示名称 */
export const WATER_QUALITY_INDICATOR_NAMES = {
  [WATER_QUALITY_INDICATORS.PH]: 'PH' as const,
  [WATER_QUALITY_INDICATORS.DO]: '溶解氧' as const,
  [WATER_QUALITY_INDICATORS.NH3N]: '氨氮' as const,
} as const;

/** 水质指标单位 */
export const WATER_QUALITY_INDICATOR_UNITS = {
  [WATER_QUALITY_INDICATORS.PH]: '',
  [WATER_QUALITY_INDICATORS.DO]: 'mg/L',
  [WATER_QUALITY_INDICATORS.NH3N]: 'mg/L',
} as const;

/** 水质数据默认值 */
export const DEFAULT_WATER_QUALITY = {
  phValue: 0,
  doValue: 0,
  nh3nValue: 0,
  date: '',
  station: '',
} as const;

/** 所有站点选项值 */
export const ALL_STATIONS_VALUE = '-1';

/** 趋势图时间周期选项 */
export const TREND_PERIODS = {
  ONE_YEAR: '1',
  THREE_YEARS: '3',
  FIVE_YEARS: '5',
} as const;

/** 趋势图时间周期显示名称 */
export const TREND_PERIOD_NAMES = {
  [TREND_PERIODS.ONE_YEAR]: '近1年',
  [TREND_PERIODS.THREE_YEARS]: '近3年',
  [TREND_PERIODS.FIVE_YEARS]: '近5年',
} as const;

// ============================ 模型相关常量 ============================

/** 模型类型 */
export const MODEL_TYPES = {
  SVM: 'SVM' as ModelType,
  ADABOOST: 'Adaboost' as ModelType,
  LSTM: 'LSTM' as ModelType,
  GRU: 'GRU' as ModelType,
  BI_RNN: 'Bi-RNN' as ModelType,
} as const;

/** 模型类型显示名称 */
export const MODEL_TYPE_NAMES = {
  [MODEL_TYPES.SVM]: '支持向量机(SVM)',
  [MODEL_TYPES.ADABOOST]: 'Boosting(Adaboost)',
  [MODEL_TYPES.LSTM]: '长短时记忆网络(LSTM)',
  [MODEL_TYPES.GRU]: '门控循环单元网络(GRU)',
  [MODEL_TYPES.BI_RNN]: '双向循环神经网络(Bi-RNN)',
} as const;

/** 可调优的模型类型 */
export const TUNABLE_MODELS: ModelType[] = [
  MODEL_TYPES.LSTM,
  MODEL_TYPES.GRU,
  MODEL_TYPES.BI_RNN,
];

/** 搜索算法类型 */
export const SEARCH_ALGORITHMS = {
  RANDOM: 'random' as SearchAlgorithm,
  BAYESIAN: 'bayesian' as SearchAlgorithm,
} as const;

/** 搜索算法显示名称 */
export const SEARCH_ALGORITHM_NAMES = {
  [SEARCH_ALGORITHMS.RANDOM]: '随机搜索',
  [SEARCH_ALGORITHMS.BAYESIAN]: '贝叶斯搜索',
} as const;

/** 模型方法选择的"所有"选项 */
export const ALL_MODELS_VALUE = 'all';

// ============================ 表格配置常量 ============================

/** 用户管理表格列配置 */
export const USER_TABLE_COLUMNS: TableColumn[] = [
  {
    title: 'ID',
    key: 'id',
    align: 'center',
  },
  {
    title: '用户名',
    key: 'username',
    align: 'center',
  },
  {
    title: '角色',
    key: 'role',
    align: 'center',
    filters: [
      {label: 'Admin', value: 1},
      {label: 'User', value: 2},
    ],
    filterMultiple: false,
  },
  {
    title: '操作',
    slot: 'action',
    align: 'center',
  },
];

/** 水质数据表格列配置 */
export const WATER_QUALITY_TABLE_COLUMNS: TableColumn[] = [
  {
    title: WATER_QUALITY_INDICATOR_NAMES[WATER_QUALITY_INDICATORS.PH] + ' ' + WATER_QUALITY_INDICATOR_UNITS[WATER_QUALITY_INDICATORS.PH],
    key: 'phValue',
    align: 'center',
    sortable: true
  },
  {
    title: WATER_QUALITY_INDICATOR_NAMES[WATER_QUALITY_INDICATORS.DO] + ' ' + WATER_QUALITY_INDICATOR_UNITS[WATER_QUALITY_INDICATORS.DO],
    key: 'doValue',
    align: 'center',
    sortable: true,
  },
  {
    title: WATER_QUALITY_INDICATOR_NAMES[WATER_QUALITY_INDICATORS.NH3N] + ' ' + WATER_QUALITY_INDICATOR_UNITS[WATER_QUALITY_INDICATORS.NH3N],
    key: 'nh3nValue',
    align: 'center',
    sortable: true,
  },
  {
    title: '时间',
    key: 'date',
    align: 'center',
    sortable: 'custom',
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
    width: 200,
  },
];

/** 模型管理表格列配置 */
export const MODEL_TABLE_COLUMNS: TableColumn[] = [
  {
    title: '类型',
    key: 'method',
    align: 'center',
  },
  {
    title: 'RMSE',
    key: 'rmse',
    align: 'center',
    sortable: 'true',
  },
  {
    title: '用户',
    key: 'user',
    align: 'center',
  },
  {
    title: '训练日期',
    key: 'date',
    align: 'center',
    sortable: 'true',
  },
  {
    title: '操作',
    slot: 'action',
    align: 'center',
  },
];

// ============================ UI相关常量 ============================

/** 默认页面大小 */
export const DEFAULT_PAGE_SIZE = 20;

// ============================ 日期格式常量 ============================

/** 日期格式 */
export const DATE_FORMATS = {
  FULL: 'yyyy-MM-dd hh:mm:ss',
  DATE_ONLY: 'yyyy-MM-dd',
  MONTH_ONLY: 'yyyy-MM',
  TIME_ONLY: 'hh:mm:ss',
} as const;

/** 默认日期格式 */
export const DEFAULT_DATE_FORMAT = DATE_FORMATS.FULL;

// ============================ 正则表达式常量 ============================

/** 常用正则表达式 */
export const REGEX_PATTERNS = {
  /** 用户名：3-20位字母数字下划线 */
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  /** 密码：3-20位字符 */
  PASSWORD: /^.{3,20}$/,
  /** 数字格式（包含小数） */
  NUMBER: /^-?\d+(\.\d+)?$/,
  /** 正数格式 */
  POSITIVE_NUMBER: /^\d+(\.\d+)?$/,
} as const;
