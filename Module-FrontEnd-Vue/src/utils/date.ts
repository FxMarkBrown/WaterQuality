// noinspection JSUnusedGlobalSymbols

/**
 * 日期工具函数
 * @author sctpan, FxMarkBrown
 * @description 提供日期格式化和相关工具函数，TypeScript重构
 */

import { DATE_FORMATS, DEFAULT_DATE_FORMAT } from '@/constants';
import type { DateFormat } from '@/types';

// ============================ 日期格式化 ============================

/**
 * 日期格式化函数
 * @param date 要格式化的日期（Date对象、字符串或数字时间戳）
 * @param fmt 格式化模板，默认为 'yyyy-MM-dd hh:mm:ss'
 * @returns 格式化后的日期字符串
 *
 * @example
 * formatDate(new Date()) // '2024-01-01 12:00:00'
 * formatDate('2024-01-01', 'yyyy-MM-dd') // '2024-01-01'
 * formatDate(1704067200000, 'yyyy年MM月dd日') // '2024年01月01日'
 */
export function formatDate(
  date: Date | string | number,
  fmt: DateFormat | string = DEFAULT_DATE_FORMAT
): string {
  try {
    // 处理输入参数，确保是有效的Date对象
    let dateObj: Date;

    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('输入错误');
    }

    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      console.warn('错误的格式:', date);
      return String(date); // 返回原始值的字符串形式
    }

    // 日期组件对象
    const dateComponents = {
      'M+': dateObj.getMonth() + 1,                // 月份 (1-12)
      'd+': dateObj.getDate(),                     // 日期 (1-31)
      'h+': dateObj.getHours(),                    // 小时 (0-23)
      'm+': dateObj.getMinutes(),                  // 分钟 (0-59)
      's+': dateObj.getSeconds(),                  // 秒 (0-59)
      'q+': Math.floor((dateObj.getMonth() + 3) / 3), // 季度 (1-4)
      'S': dateObj.getMilliseconds()               // 毫秒 (0-999)
    };

    let result = fmt;

    // 处理年份
    const yearMatch = /(y+)/.exec(result);
    if (yearMatch) {
      const yearStr = String(dateObj.getFullYear());
      const yearPattern = yearMatch[1];
      const yearLength = yearPattern.length;
      const yearValue = yearLength === 4 ? yearStr : yearStr.substring(4 - yearLength);
      result = result.replace(yearPattern, yearValue);
    }

    // 处理其他日期组件
    for (const [pattern, value] of Object.entries(dateComponents)) {
      const regex = new RegExp(`(${pattern})`);
      const match = regex.exec(result);
      if (match) {
        const matchedPattern = match[1];
        const paddedValue = matchedPattern.length === 1
          ? String(value)
          : String(value).padStart(matchedPattern.length, '0');
        result = result.replace(matchedPattern, paddedValue);
      }
    }

    return result;
  } catch (error) {
    console.error('Error formatting date:', error, { date, fmt });
    return String(date); // 出错时返回原始值
  }
}

// ============================ 日期解析 ============================

/**
 * 解析日期字符串为Date对象
 * @param dateStr 日期字符串
 * @returns Date对象，如果解析失败返回null
 *
 * @example
 * parseDate('2024-01-01') // Date对象
 * parseDate('invalid') // null
 */
export function parseDate(dateStr: string): Date | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * 安全的日期解析，返回有效日期或当前日期
 * @param dateStr 日期字符串
 * @returns 有效的Date对象
 */
export function safePaseDate(dateStr: string): Date {
  const parsed = parseDate(dateStr);
  return parsed || new Date();
}

// ============================ 日期验证 ============================

/**
 * 验证日期是否有效
 * @param date 要验证的日期
 * @returns 是否为有效日期
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 验证日期字符串是否有效
 * @param dateStr 日期字符串
 * @returns 是否为有效日期字符串
 */
export function isValidDateString(dateStr: string): boolean {
  return parseDate(dateStr) !== null;
}

// ============================ 日期比较 ============================

/**
 * 比较两个日期的大小
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 比较结果：-1(date1<date2), 0(相等), 1(date1>date2)
 */
export function compareDates(date1: Date, date2: Date): number {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  return time1 < time2 ? -1 : time1 > time2 ? 1 : 0;
}

/**
 * 检查日期是否在指定范围内
 * @param date 要检查的日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 是否在范围内
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const time = date.getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
}

// ============================ 日期计算 ============================

/**
 * 在日期基础上添加天数
 * @param date 基础日期
 * @param days 要添加的天数（可以是负数）
 * @returns 新的日期
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 在日期基础上添加月份
 * @param date 基础日期
 * @param months 要添加的月份数（可以是负数）
 * @returns 新的日期
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 在日期基础上添加年份
 * @param date 基础日期
 * @param years 要添加的年份数（可以是负数）
 * @returns 新的日期
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * 计算两个日期之间的天数差
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数差（date2 - date1）
 */
export function daysDifference(date1: Date, date2: Date): number {
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// ============================ 日期格式化快捷方法 ============================

/**
 * 格式化为日期字符串（yyyy-MM-dd）
 * @param date 日期
 * @returns 日期字符串
 */
export function formatDateOnly(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.DATE_ONLY);
}

/**
 * 格式化为完整日期时间字符串（yyyy-MM-dd hh:mm:ss）
 * @param date 日期
 * @returns 日期时间字符串
 */
export function formatDateTime(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.FULL);
}

/**
 * 格式化为月份字符串（yyyy-MM）
 * @param date 日期
 * @returns 月份字符串
 */
export function formatMonth(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.MONTH_ONLY);
}

/**
 * 格式化为时间字符串（hh:mm:ss）
 * @param date 日期
 * @returns 时间字符串
 */
export function formatTimeOnly(date: Date | string | number): string {
  return formatDate(date, DATE_FORMATS.TIME_ONLY);
}

// ============================ 特殊日期获取 ============================

/**
 * 获取今天的开始时间（00:00:00）
 * @returns 今天开始的Date对象
 */
export function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 获取今天的结束时间（23:59:59.999）
 * @returns 今天结束的Date对象
 */
export function getEndOfToday(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * 获取当前月份的第一天
 * @returns 当前月份第一天的Date对象
 */
export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * 获取当前月份的最后一天
 * @returns 当前月份最后一天的Date对象
 */
export function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * 获取指定年份前的日期
 * @param years 年份数
 * @returns 指定年份前的Date对象
 */
export function getYearsAgo(years: number): Date {
  const now = new Date();
  return addYears(now, -years);
}
// ============================ 相对时间 ============================

/**
 * 获取相对时间描述
 * @param date 目标日期
 * @param baseDate 基准日期，默认为当前时间
 * @returns 相对时间描述
 *
 * @example
 * getRelativeTime(new Date(Date.now() - 60000)) // '1分钟前'
 * getRelativeTime(new Date(Date.now() + 3600000)) // '1小时后'
 */
export function getRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffMs = date.getTime() - baseDate.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const suffix = isPast ? '前' : '后';

  if (years > 0) return `${years}年${suffix}`;
  if (months > 0) return `${months}个月${suffix}`;
  if (days > 0) return `${days}天${suffix}`;
  if (hours > 0) return `${hours}小时${suffix}`;
  if (minutes > 0) return `${minutes}分钟${suffix}`;
  return `${seconds}秒${suffix}`;
}

// ============================ 导出默认格式化函数（保持兼容性） ============================

// 为了保持与原有代码的兼容性，导出原有的函数名
export { formatDate as default };
