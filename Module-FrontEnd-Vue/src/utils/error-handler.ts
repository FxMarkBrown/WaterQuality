/**
 * 统一错误处理系统
 * @author FxMarkBrown
 * @description 提供统一的错误处理、日志记录和用户提示
 */

import { Message } from 'view-ui-plus';
import type { ApiResponse, ApiStatus } from '@/types';
import type { AxiosError } from 'axios';

// ============================ 错误类型定义 ============================

/** 错误级别枚举 */
export enum ErrorLevel {
  /** 信息提示 */
  INFO = 'info',
  /** 警告 */
  WARNING = 'warning',
  /** 错误 */
  ERROR = 'error',
  /** 严重错误 */
  CRITICAL = 'critical',
}

/** 错误代码枚举 */
export enum ErrorCode {
  // 网络相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',

  // 认证相关错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // 业务相关错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  OPERATION_FAILED = 'OPERATION_FAILED',

  // 系统相关错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/** 应用错误接口 */
export interface AppError {
  /** 错误代码 */
  code: ErrorCode;
  /** 错误消息 */
  message: string;
  /** 错误级别 */
  level: ErrorLevel;
  /** 错误详情 */
  details?: any;
  /** 错误堆栈 */
  stack?: string;
  /** 发生时间 */
  timestamp: Date;
  /** 用户操作上下文 */
  context?: string;
}

// ============================ 错误消息映射 ============================

/** 默认错误消息映射 */
const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误，请联系管理员',
  [ErrorCode.UNAUTHORIZED]: '未授权访问，请重新登录',
  [ErrorCode.FORBIDDEN]: '权限不足，无法执行此操作',
  [ErrorCode.LOGIN_FAILED]: '登录失败，请检查用户名和密码',
  [ErrorCode.VALIDATION_ERROR]: '数据验证失败，请检查输入',
  [ErrorCode.PERMISSION_DENIED]: '权限不足，无法执行此操作',
  [ErrorCode.RESOURCE_NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.OPERATION_FAILED]: '操作失败，请稍后重试',
  [ErrorCode.UNKNOWN_ERROR]: '未知错误，请稍后重试',
};

/** 业务状态码错误消息映射 */
const API_STATUS_MESSAGES: Record<ApiStatus, string> = {
  success: '操作成功',
  deny: '权限不足，无法执行此操作',
  error: '操作失败，请稍后重试',
  duplicate: '数据已存在，请勿重复操作',
};

// ============================ 错误处理类 ============================

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  /** 是否启用控制台日志 */
  private static enableConsoleLog = true;

  /** 是否启用用户提示 */
  private static enableUserNotification = true;

  /**
   * 创建应用错误对象
   * @param code 错误代码
   * @param message 自定义错误消息
   * @param level 错误级别
   * @param details 错误详情
   * @param context 用户操作上下文
   * @returns 应用错误对象
   */
  static createError(
    code: ErrorCode,
    message?: string,
    level: ErrorLevel = ErrorLevel.ERROR,
    details?: any,
    context?: string
  ): AppError {
    return {
      code,
      message: message || DEFAULT_ERROR_MESSAGES[code],
      level,
      details,
      stack: new Error().stack,
      timestamp: new Date(),
      context,
    };
  }

  /**
   * 处理应用错误
   * @param error 应用错误对象
   * @param showNotification 是否显示用户提示
   */
  static handleError(error: AppError, showNotification = true): void {
    // 记录错误日志
    this.logError(error);

    // 显示用户提示
    if (showNotification && this.enableUserNotification) {
      this.showUserNotification(error);
    }
  }

  /**
   * 处理API响应错误
   * @param response API响应对象
   * @param context 操作上下文
   * @param showNotification 是否显示用户提示
   * @returns 处理后的错误对象
   */
  static handleApiError(
    response: ApiResponse,
    context?: string,
    showNotification = true
  ): AppError {
    let errorCode: ErrorCode;
    let message: string;

    // 根据API状态确定错误类型
    switch (response.status) {
      case 'deny':
        errorCode = ErrorCode.PERMISSION_DENIED;
        message = response.msg || API_STATUS_MESSAGES.deny;
        break;
      case 'error':
        errorCode = ErrorCode.OPERATION_FAILED;
        message = response.msg || API_STATUS_MESSAGES.error;
        break;
      case 'duplicate':
        errorCode = ErrorCode.VALIDATION_ERROR;
        message = response.msg || API_STATUS_MESSAGES.duplicate;
        break;
      default:
        errorCode = ErrorCode.UNKNOWN_ERROR;
        message = response.msg || DEFAULT_ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
    }

    const error = this.createError(
      errorCode,
      message,
      ErrorLevel.ERROR,
      response,
      context
    );

    this.handleError(error, showNotification);
    return error;
  }

  /**
   * 处理Axios HTTP错误
   * @param axiosError Axios错误对象
   * @param context 操作上下文
   * @param showNotification 是否显示用户提示
   * @returns 处理后的错误对象
   */
  static handleHttpError(
    axiosError: AxiosError,
    context?: string,
    showNotification = true
  ): AppError {
    let errorCode: ErrorCode;
    let message: string;
    let level = ErrorLevel.ERROR;

    // 根据HTTP状态码确定错误类型
    if (axiosError.code === 'ECONNABORTED') {
      errorCode = ErrorCode.TIMEOUT_ERROR;
      message = DEFAULT_ERROR_MESSAGES[ErrorCode.TIMEOUT_ERROR];
    } else if (!axiosError.response) {
      errorCode = ErrorCode.NETWORK_ERROR;
      message = DEFAULT_ERROR_MESSAGES[ErrorCode.NETWORK_ERROR];
    } else {
      const status = axiosError.response.status;
      switch (status) {
        case 401:
          errorCode = ErrorCode.UNAUTHORIZED;
          message = DEFAULT_ERROR_MESSAGES[ErrorCode.UNAUTHORIZED];
          break;
        case 403:
          errorCode = ErrorCode.FORBIDDEN;
          message = DEFAULT_ERROR_MESSAGES[ErrorCode.FORBIDDEN];
          break;
        case 404:
          errorCode = ErrorCode.RESOURCE_NOT_FOUND;
          message = DEFAULT_ERROR_MESSAGES[ErrorCode.RESOURCE_NOT_FOUND];
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorCode = ErrorCode.SERVER_ERROR;
          message = DEFAULT_ERROR_MESSAGES[ErrorCode.SERVER_ERROR];
          level = ErrorLevel.CRITICAL;
          break;
        default:
          errorCode = ErrorCode.UNKNOWN_ERROR;
          message = `HTTP错误 ${status}: ${axiosError.message}`;
      }
    }

    const error = this.createError(
      errorCode,
      message,
      level,
      {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        url: axiosError.config?.url,
        method: axiosError.config?.method,
      },
      context
    );

    this.handleError(error, showNotification);
    return error;
  }

  /**
   * 处理通用JavaScript错误
   * @param error JavaScript错误对象
   * @param context 操作上下文
   * @param showNotification 是否显示用户提示
   * @returns 处理后的错误对象
   */
  static handleGenericError(
    error: Error,
    context?: string,
    showNotification = true
  ): AppError {
    const appError = this.createError(
      ErrorCode.UNKNOWN_ERROR,
      `系统错误: ${error.message}`,
      ErrorLevel.ERROR,
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context
    );

    this.handleError(appError, showNotification);
    return appError;
  }

  /**
   * 记录错误日志
   * @param error 应用错误对象
   */
  private static logError(error: AppError): void {
    if (!this.enableConsoleLog) return;

    const logMessage = `[${error.level.toUpperCase()}] ${error.code}: ${error.message}`;
    const logDetails = {
      timestamp: error.timestamp,
      context: error.context,
      details: error.details,
      stack: error.stack,
    };

    switch (error.level) {
      case ErrorLevel.INFO:
        console.info(logMessage, logDetails);
        break;
      case ErrorLevel.WARNING:
        console.warn(logMessage, logDetails);
        break;
      case ErrorLevel.ERROR:
        console.error(logMessage, logDetails);
        break;
      case ErrorLevel.CRITICAL:
        console.error(`🚨 ${logMessage}`, logDetails);
        break;
    }
  }

  /**
   * 显示用户提示
   * @param error 应用错误对象
   */
  private static showUserNotification(error: AppError): void {
    switch (error.level) {
      case ErrorLevel.INFO:
        Message.info(error.message);
        break;
      case ErrorLevel.WARNING:
        Message.warning(error.message);
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.CRITICAL:
        Message.error(error.message);
        break;
    }
  }

  /**
   * 设置错误处理器配置
   * @param config 配置选项
   */
  static configure(config: {
    enableConsoleLog?: boolean;
    enableUserNotification?: boolean;
  }): void {
    if (config.enableConsoleLog !== undefined) {
      this.enableConsoleLog = config.enableConsoleLog;
    }
    if (config.enableUserNotification !== undefined) {
      this.enableUserNotification = config.enableUserNotification;
    }
  }
}

// ============================ 便捷函数 ============================

/**
 * 显示成功消息
 * @param message 成功消息
 */
export function showSuccess(message: string): void {
  Message.success(message);
}

/**
 * 显示信息消息
 * @param message 信息消息
 */
export function showInfo(message: string): void {
  Message.info(message);
}

/**
 * 显示警告消息
 * @param message 警告消息
 */
export function showWarning(message: string): void {
  Message.warning(message);
}

/**
 * 显示错误消息
 * @param message 错误消息
 */
export function showError(message: string): void {
  Message.error(message);
}

// ============================ 导出 ============================

export default ErrorHandler;
