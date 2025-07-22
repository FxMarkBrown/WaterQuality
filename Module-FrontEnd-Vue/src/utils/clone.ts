/**
 * 对象克隆函数
 * @author sctpan, FxMarkBrown
 * @description 提供日期格式化和相关工具函数，TypeScript重构
 */
// ============================ 对象克隆工具 ============================

/**
 * 深度克隆对象，特殊处理水质数据中的数值字段
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 *
 * @description
 * 此函数专门用于克隆水质数据对象，会将特定字段转换为数字类型
 * 保留原有的特殊逻辑以保持向后兼容性
 */
export function cloneObj<T = any>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 处理Date对象
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => cloneObj(item)) as T;
  }

  // 处理普通对象
  const newObj: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];

      // 特殊处理水质数据的数值字段（保持原有逻辑）
      if (key === 'phValue' || key === 'doValue' || key === 'nh3nValue') {
        newObj[key] = parseFloat(String(val)) || 0;
      } else if (key === 'station') {
        // station字段保持字符串类型，不转换为数字
        newObj[key] = String(val);
      } else if (typeof val === 'object' && val !== null) {
        newObj[key] = cloneObj(val);
      } else {
        newObj[key] = val;
      }
    }
  }

  return newObj as T;
}

/**
 * 标准深度克隆函数（不包含特殊的水质数据处理逻辑）
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepClone(obj[key]);
    }
  }

  return newObj as T;
}
