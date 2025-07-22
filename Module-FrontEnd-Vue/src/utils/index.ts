/**
 * 工具函数集合
 * @author sctpan, FxMarkBrown
 * @description 提供项目中使用的各种工具函数
 */

export * from './date';
export * from './error-handler';

// ============================ 防抖和节流 ============================

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 *
 * @example
 * const debouncedSearch = debounce((query) => searchAPI(query), 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 节流间隔（毫秒）
 * @returns 节流后的函数
 *
 * @example
 * const throttledScroll = throttle(() => handleScroll(), 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// ============================ 数据验证 ============================

/**
 * 验证用户名格式
 * @param username 用户名
 * @returns 是否有效
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 是否符合要求
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 20;
}

/**
 * 验证邮箱格式
 * @param email 邮箱
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否有效
 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证数字格式
 * @param value 数值
 * @returns 是否为有效数字
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value));
}

/**
 * 验证正数格式
 * @param value 数值
 * @returns 是否为有效正数
 */
export function isValidPositiveNumber(value: any): boolean {
  const num = Number(value);
  return isValidNumber(value) && num > 0;
}

/**
 * 验证水质数据值的范围
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在有效范围内
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isValidNumber(value) && value >= min && value <= max;
}

/**
 * 验证PH值范围
 * @param phValue PH值
 * @returns 是否有效
 */
export function isValidPhValue(phValue: number): boolean {
  return isInRange(phValue, 0, 14);
}

/**
 * 验证溶解氧值范围
 * @param doValue 溶解氧值
 * @returns 是否有效
 */
export function isValidDoValue(doValue: number): boolean {
  return isInRange(doValue, 0, 50); // 一般范围
}

/**
 * 验证氨氮值范围
 * @param nh3nValue 氨氮值
 * @returns 是否有效
 */
export function isValidNh3nValue(nh3nValue: number): boolean {
  return isInRange(nh3nValue, 0, 100); // 一般范围
}

// ============================ 数组和对象工具 ============================

/**
 * 检查数组是否为空
 * @param arr 数组
 * @returns 是否为空
 */
export function isEmpty(arr: any[]): boolean {
  return !Array.isArray(arr) || arr.length === 0;
}

/**
 * 检查对象是否为空
 * @param obj 对象
 * @returns 是否为空
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return !obj || Object.keys(obj).length === 0;
}

/**
 * 获取对象的深层属性值
 * @param obj 对象
 * @param path 属性路径，如 'a.b.c'
 * @param defaultValue 默认值
 * @returns 属性值
 */
export function getObjectProperty(obj: any, path: string, defaultValue: any = undefined): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
}

/**
 * 设置对象的深层属性值
 * @param obj 对象
 * @param path 属性路径，如 'a.b.c'
 * @param value 要设置的值
 */
export function setObjectProperty(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * 数组去重
 * @param arr 数组
 * @param key 对象数组的去重键名
 * @returns 去重后的数组
 */
export function uniqueArray<T>(arr: T[], key?: keyof T): T[] {
  if (!Array.isArray(arr)) return [];

  if (key) {
    const seen = new Set();
    return arr.filter(item => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }

  return [...new Set(arr)];
}

/**
 * 数组分组
 * @param arr 数组
 * @param keyOrFn 分组键或分组函数
 * @returns 分组后的对象
 */
export function groupBy<T>(
  arr: T[],
  keyOrFn: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  if (!Array.isArray(arr)) return {};

  return arr.reduce((groups, item) => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
    const groupKey = String(key);

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);

    return groups;
  }, {} as Record<string, T[]>);
}

// ============================ 字符串工具 ============================

/**
 * 截断字符串
 * @param str 字符串
 * @param length 最大长度
 * @param suffix 省略号后缀
 * @returns 截断后的字符串
 */
export function truncateString(str: string, length: number, suffix = '...'): string {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * 首字母大写
 * @param str 字符串
 * @returns 首字母大写的字符串
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 驼峰命名转连字符命名
 * @param str 驼峰命名字符串
 * @returns 连字符命名字符串
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * 连字符命名转驼峰命名
 * @param str 连字符命名字符串
 * @returns 驼峰命名字符串
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// ============================ 数字工具 ============================

/**
 * 格式化数字，添加千分位分隔符
 * @param num 数字
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number, decimals = 2): string {
  if (!isValidNumber(num)) return '0';

  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 生成随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机数
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机字符串
 * @param length 长度
 * @param chars 字符集
 * @returns 随机字符串
 */
export function randomString(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================ URL和查询参数工具 ============================

/**
 * 解析URL查询参数
 * @param url URL字符串
 * @returns 查询参数对象
 */
export function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlObj = new URL(url, window.location.origin);

  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * 构建URL查询字符串
 * @param params 参数对象
 * @returns 查询字符串
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

// ============================ 浏览器工具 ============================

/**
 * 检查是否为移动设备
 * @returns 是否为移动设备
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 检查是否支持WebP格式
 * @returns Promise<boolean>
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean>
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch {
    return false;
  }
}

// ============================ 存储工具 ============================

/**
 * localStorage工具类
 */
export class LocalStorage {
  /**
   * 设置存储项
   * @param key 键名
   * @param value 值
   */
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage set error:', error);
    }
  }

  /**
   * 获取存储项
   * @param key 键名
   * @param defaultValue 默认值
   * @returns 存储的值
   */
  static get<T = any>(key: string, defaultValue: T | null): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 移除存储项
   * @param key 键名
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
  }

  /**
   * 清空所有存储
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
  }

  /**
   * 检查是否存在指定键
   * @param key 键名
   * @returns 是否存在
   */
  static has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}

/**
 * sessionStorage工具类
 */
export class SessionStorage {
  /**
   * 设置存储项
   * @param key 键名
   * @param value 值
   */
  static set(key: string, value: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('SessionStorage set error:', error);
    }
  }

  /**
   * 获取存储项
   * @param key 键名
   * @param defaultValue 默认值
   * @returns 存储的值
   */
  static get<T = any>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('SessionStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 移除存储项
   * @param key 键名
   */
  static remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SessionStorage remove error:', error);
    }
  }

  /**
   * 清空所有存储
   */
  static clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('SessionStorage clear error:', error);
    }
  }

  /**
   * 检查是否存在指定键
   * @param key 键名
   * @returns 是否存在
   */
  static has(key: string): boolean {
    return sessionStorage.getItem(key) !== null;
  }
}
