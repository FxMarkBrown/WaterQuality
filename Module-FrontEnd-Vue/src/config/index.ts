/**
 * 应用配置文件
 * @author FxMarkBrown
 * @description 应用的配置管理
 */

import { API_BASE_URL, API_TIMEOUT } from '@/constants';

// ============================ 配置接口定义 ============================

/** 应用配置接口 */
export interface AppConfig {
  /** API基础URL */
  apiBaseUrl: string;
  /** 请求超时时间（毫秒） */
  requestTimeout: number;
  /** 是否启用调试模式 */
  debug: boolean;
}

// ============================ 环境配置 ============================

/** 开发环境配置 */
const developmentConfig: AppConfig = {
  apiBaseUrl: API_BASE_URL,
  requestTimeout: API_TIMEOUT,
  debug: true
};

/** 生产环境配置 */
const productionConfig: AppConfig = {
  apiBaseUrl: API_BASE_URL,
  requestTimeout: API_TIMEOUT,
  debug: false
};

/** 测试环境配置 */
const testConfig: AppConfig = {
  apiBaseUrl: 'http://localhost:8080',
  requestTimeout: 5000,
  debug: true
};

// ============================ 配置获取 ============================

/**
 * 获取当前环境
 * @returns 当前环境名称
 */
function getCurrentEnvironment(): 'development' | 'production' {
  if (import.meta.env.MODE === 'development') {
    return 'development';
  } else {
    return 'production';
  }
}

/**
 * 根据环境获取配置
 * @param env 环境名称
 * @returns 对应环境的配置
 */
function getConfigByEnvironment(env: string): AppConfig {
  switch (env) {
    case 'development':
      return developmentConfig;
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    default:
      return developmentConfig;
  }
}

/** 当前环境 */
export const CURRENT_ENV = getCurrentEnvironment();

/** 当前应用配置 */
export const config: AppConfig = getConfigByEnvironment(CURRENT_ENV);

// ============================ 配置管理类 ============================

/**
 * 配置管理器
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private currentConfig: AppConfig;

  private constructor() {
    this.currentConfig = { ...config };
  }

  /**
   * 获取配置管理器实例
   * @returns 配置管理器实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 获取完整配置
   * @returns 当前配置对象
   */
  getConfig(): AppConfig {
    return { ...this.currentConfig };
  }

  /**
   * 获取指定配置项
   * @param key 配置项键名
   * @returns 配置项值
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.currentConfig[key];
  }

  /**
   * 设置指定配置项
   * @param key 配置项键名
   * @param value 配置项值
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.currentConfig[key] = value;
  }

  /**
   * 批量更新配置
   * @param updates 要更新的配置项
   */
  update(updates: Partial<AppConfig>): void {
    Object.assign(this.currentConfig, updates);
  }

  /**
   * 重置配置为默认值
   */
  reset(): void {
    this.currentConfig = { ...config };
  }

  /**
   * 获取API基础URL
   * @returns API基础URL
   */
  getApiBaseUrl(): string {
    return this.currentConfig.apiBaseUrl;
  }

  /**
   * 获取请求超时时间
   * @returns 请求超时时间（毫秒）
   */
  getRequestTimeout(): number {
    return this.currentConfig.requestTimeout;
  }

  /**
   * 是否启用调试模式
   * @returns 是否启用调试模式
   */
  isDebugEnabled(): boolean {
    return this.currentConfig.debug;
  }
}

// ============================ 配置实例 ============================

/** 全局配置管理器实例 */
export const configManager = ConfigManager.getInstance();

// ============================ 环境信息 ============================

/** 环境信息 */
export const ENV_INFO = {
  /** 当前环境 */
  current: CURRENT_ENV,
  /** 是否开发环境 */
  isDevelopment: CURRENT_ENV === 'development',
  /** 是否生产环境 */
  isProduction: CURRENT_ENV === 'production'
} as const;

// ============================ 调试信息 ============================

// 在开发环境下打印配置信息
if (ENV_INFO.isDevelopment) {
  console.group('🔧 应用配置信息');
  console.log('环境:', CURRENT_ENV);
  console.log('配置:', config);
  console.log('环境信息:', ENV_INFO);
  console.groupEnd();
}

// ============================ 导出 ============================

export default config;
