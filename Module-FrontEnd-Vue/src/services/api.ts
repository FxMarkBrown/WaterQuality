/**
 * API服务封装
 * @author FxMarkBrown
 * @description 统一封装所有API调用
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import qs from 'qs';
import { configManager } from '@/config';
import { ErrorHandler } from '@/utils/error-handler';
import type {
  ApiResponse,
  ApiUser,
  LoginRequest,
  RegisterForm,
  UserGrantRequest,
  PasswordChangeForm,
  ApiWaterQuality,
  WaterQualityRequest,
  WaterQualityQueryParams,
  TrendPlotParams,
  TrendPlotResponse,
  ApiModel,
  ModelTrainingParams,
  ModelTrainingResponse,
  ModelPredictionParams,
  ModelPredictionResponse,
  ModelTuningParams,
  ModelTuningResponse,
} from '@/types';
import { API_ENDPOINTS } from '@/constants';

// ============================ HTTP客户端配置 ============================

/**
 * 创建Axios实例
 */
function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: configManager.getApiBaseUrl(),
    timeout: configManager.getRequestTimeout(),
    withCredentials: true,
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 在开发环境记录请求日志
      if (configManager.isDebugEnabled()) {
        console.log(`🚀 API 请求: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response) => {
      // 在开发环境记录响应日志
      if (configManager.isDebugEnabled()) {
        console.log(`✅ API 响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }
      return response;
    },
    (error) => {
      // 在开发环境记录错误日志
      if (configManager.isDebugEnabled()) {
        console.error(`❌ API 错误: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/** HTTP客户端实例 */
const httpClient = createHttpClient();

// ============================ 基础HTTP方法 ============================

/**
 * HTTP请求基础类
 */
export class HttpService {
  /**
   * GET请求
   * @param url 请求URL
   * @param params 查询参数
   * @param config 请求配置
   * @returns 响应数据
   */
  static async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await httpClient.get(url, {
        params,
        ...config,
      });
      return response.data;
    } catch (error) {
      ErrorHandler.handleHttpError(error as any, `GET ${url}`);
      throw error;
    }
  }

  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求体数据
   * @param config 请求配置
   * @returns 响应数据
   */
  static async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await httpClient.post(url, data, config);
      return response.data;
    } catch (error) {
      ErrorHandler.handleHttpError(error as any, `POST ${url}`);
      throw error;
    }
  }

  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求体数据
   * @param config 请求配置
   * @returns 响应数据
   */
  static async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await httpClient.put(url, data, config);
      return response.data;
    } catch (error) {
      ErrorHandler.handleHttpError(error as any, `PUT ${url}`);
      throw error;
    }
  }

  /**
   * DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  static async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await httpClient.delete(url, config);
      return response.data;
    } catch (error) {
      ErrorHandler.handleHttpError(error as any, `DELETE ${url}`);
      throw error;
    }
  }

  /**
   * PATCH请求
   * @param url 请求URL
   * @param data 请求体数据
   * @param config 请求配置
   * @returns 响应数据
   */
  static async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await httpClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      ErrorHandler.handleHttpError(error as any, `PATCH ${url}`);
      throw error;
    }
  }
}

// ============================ 用户认证服务 ============================

/**
 * 用户认证API服务
 */
export class AuthService {
  /**
   * 用户登录
   * @param credentials 登录凭据
   * @returns 登录响应
   */
  static async login(credentials: LoginRequest): Promise<ApiResponse> {
    return HttpService.post(API_ENDPOINTS.LOGIN, qs.stringify(credentials), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * 用户注册
   * @param userInfo 注册信息
   * @returns 注册响应
   */
  static async register(userInfo: RegisterForm): Promise<ApiResponse> {
    return HttpService.post(API_ENDPOINTS.REGISTER, {
      username: userInfo.username,
      password: userInfo.password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 获取当前用户信息
   * @returns 当前用户信息
   */
  static async getCurrentUser(): Promise<ApiUser> {
    return HttpService.get(API_ENDPOINTS.CURRENT_USER);
  }

  /**
   * 用户注销
   * @returns 注销响应
   */
  static async logout(): Promise<ApiResponse> {
    return HttpService.get(API_ENDPOINTS.LOGOUT);
  }
}

// ============================ 用户管理服务 ============================

/**
 * 用户管理API服务
 */
export class UserService {
  /**
   * 获取所有用户
   * @returns 用户列表
   */
  static async getAllUsers(): Promise<ApiUser[]> {
    return HttpService.get(API_ENDPOINTS.USER_ALL);
  }

  /**
   * 搜索用户
   * @param username 用户名
   * @returns 用户列表
   */
  static async searchUsers(username: string): Promise<ApiUser[]> {
    return HttpService.get(API_ENDPOINTS.USER_QUERY, { username });
  }

  /**
   * 授予用户权限
   * @param userId 用户ID
   * @param grantInfo 权限信息
   * @returns 操作响应
   */
  static async grantUserPermission(
    userId: number,
    grantInfo: UserGrantRequest
  ): Promise<ApiResponse> {
    return HttpService.post(`${API_ENDPOINTS.USER_GRANT}/${userId}`, grantInfo);
  }

  /**
   * 删除用户
   * @param userId 用户ID
   * @returns 操作响应
   */
  static async deleteUser(userId: number): Promise<ApiResponse> {
    return HttpService.post(`${API_ENDPOINTS.USER_DELETE}/${userId}`);
  }

  /**
   * 修改密码
   * @param userId 用户ID
   * @param passwordInfo 密码信息
   * @returns 操作响应
   */
  static async changePassword(
    userId: number,
    passwordInfo: PasswordChangeForm
  ): Promise<ApiResponse> {
    return HttpService.post(`${API_ENDPOINTS.USER_EDIT_PASSWORD}/${userId}`, {
      originPassword: passwordInfo.originPassword,
      newPassword: passwordInfo.newPassword,
    });
  }
}

// ============================ 水质数据服务 ============================

/**
 * 水质数据API服务
 */
export class WaterQualityService {
  /**
   * 获取所有水质数据
   * @returns 水质数据列表
   */
  static async getAllWaterQuality(): Promise<ApiWaterQuality[]> {
    return HttpService.get(API_ENDPOINTS.WATER_QUALITY_ALL);
  }

  /**
   * 查询水质数据
   * @param queryParams 查询参数
   * @returns 水质数据列表
   */
  static async queryWaterQuality(queryParams: WaterQualityQueryParams): Promise<ApiWaterQuality[]> {
    return HttpService.get(API_ENDPOINTS.WATER_QUALITY_QUERY, queryParams);
  }

  /**
   * 获取最近的水质数据
   * @param num 数据数量
   * @returns 水质数据列表
   */
  static async getRecentWaterQuality(num: number): Promise<ApiWaterQuality[]> {
    return HttpService.get(API_ENDPOINTS.WATER_QUALITY_RECENT, { num });
  }

  /**
   * 获取站点列表
   * @returns 站点名称列表
   */
  static async getStations(): Promise<string[]> {
    return HttpService.get(API_ENDPOINTS.WATER_QUALITY_STATION);
  }

  /**
   * 添加水质数据
   * @param waterQuality 水质数据
   * @returns 操作响应
   */
  static async addWaterQuality(waterQuality: WaterQualityRequest): Promise<ApiResponse> {
    return HttpService.post(API_ENDPOINTS.WATER_QUALITY_ADD, waterQuality);
  }

  /**
   * 更新水质数据
   * @param id 数据ID
   * @param waterQuality 水质数据
   * @returns 操作响应
   */
  static async updateWaterQuality(
    id: number,
    waterQuality: WaterQualityRequest
  ): Promise<ApiResponse> {
    return HttpService.post(`${API_ENDPOINTS.WATER_QUALITY_UPDATE}/${id}`, waterQuality);
  }

  /**
   * 删除水质数据
   * @param id 数据ID
   * @returns 操作响应
   */
  static async deleteWaterQuality(id: number): Promise<ApiResponse> {
    return HttpService.post(`${API_ENDPOINTS.WATER_QUALITY_DELETE}/${id}`);
  }

  /**
   * 获取趋势图数据
   * @param plotParams 绘图参数
   * @returns 趋势图数据
   */
  static async getTrendPlotData(plotParams: TrendPlotParams): Promise<TrendPlotResponse> {
    return HttpService.get(API_ENDPOINTS.WATER_QUALITY_PLOT, plotParams);
  }
}

// ============================ 模型管理服务 ============================

/**
 * 模型管理API服务
 */
export class ModelService {
  /**
   * 获取可用模型
   * @param indicator 水质指标
   * @param method 模型方法
   * @returns 模型列表
   */
  static async getAvailableModels(
    indicator: string,
    method: string
  ): Promise<ApiModel[]> {
    return HttpService.get(API_ENDPOINTS.MODEL_AVAILABLE, { indicator, method });
  }

  /**
   * 获取模型方法列表
   * @param indicator 水质指标
   * @returns 模型方法列表
   */
  static async getModelMethods(indicator: string): Promise<string[]> {
    return HttpService.get(API_ENDPOINTS.MODEL_LIST, { indicator });
  }

  /**
   * 模型预测
   * @param predictionParams 预测参数
   * @returns 预测结果
   */
  static async predictModel(predictionParams: ModelPredictionParams): Promise<ModelPredictionResponse> {
    return HttpService.get(API_ENDPOINTS.MODEL_PREDICTION, predictionParams);
  }

  /**
   * 删除模型
   * @param modelId 模型ID
   * @returns 操作响应
   */
  static async deleteModel(modelId: number): Promise<ApiResponse> {
    return HttpService.post(`${API_ENDPOINTS.MODEL_DELETE}/${modelId}`);
  }

  /**
   * 训练模型
   * @param trainingParams 训练参数
   * @returns 训练结果
   */
  static async trainModel(trainingParams: ModelTrainingParams): Promise<ModelTrainingResponse> {
    return HttpService.get(API_ENDPOINTS.MODEL_TRAINING, trainingParams);
  }

  /**
   * 模型调优
   * @param tuningParams 调优参数
   * @returns 调优结果
   */
  static async tuneModel(tuningParams: ModelTuningParams): Promise<ModelTuningResponse> {
    return HttpService.get(API_ENDPOINTS.MODEL_TUNING, tuningParams);
  }
}

// ============================ API聚合服务 ============================

/**
 * API服务聚合器
 * 提供所有API服务的统一入口
 */
export class ApiService {
  /** 认证服务 */
  static auth = AuthService;

  /** 用户服务 */
  static user = UserService;

  /** 水质数据服务 */
  static waterQuality = WaterQualityService;

  /** 模型服务 */
  static model = ModelService;

  /**
   * 获取HTTP客户端实例
   * @returns Axios实例
   */
  static getHttpClient(): AxiosInstance {
    return httpClient;
  }

  /**
   * 重新配置HTTP客户端
   * @param config 新的配置
   */
  static reconfigureHttpClient(config: Partial<AxiosRequestConfig>): void {
    Object.assign(httpClient.defaults, config);
  }
}

// ============================ 导出 ============================

export {
  httpClient,
};

export default ApiService;
