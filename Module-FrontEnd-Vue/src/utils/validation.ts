/**
 * 表单验证工具
 * @author FxMarkBrown
 * @description 提供统一的表单验证规则和验证函数
 */

import type { FormRule, FormRules } from '@/types';
import {
  REGEX_PATTERNS
} from '@/constants';
import {showError} from "@/utils/error-handler.ts";

// ============================ 类型定义 ============================

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/** 表单验证结果 */
export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// ============================ 基础验证函数 ============================

/**
 * 验证必填项
 * @param value 值
 * @returns 验证结果
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * 验证字符串长度
 * @param value 字符串
 * @param min 最小长度
 * @param max 最大长度
 * @returns 验证结果
 */
export function validateLength(value: string, min: number, max: number): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * 验证数字范围
 * @param value 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 验证结果
 */
export function validateNumberRange(value: number, min: number, max: number): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * 验证正则表达式
 * @param value 值
 * @param pattern 正则表达式
 * @returns 验证结果
 */
export function validatePattern(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/**
 * 验证数组长度
 * @param value 数组
 * @param min 最小长度
 * @param max 最大长度
 * @returns 验证结果
 */
export function validateArrayLength(value: any[], min: number, max: number): boolean {
  if (!Array.isArray(value)) return false;
  return value.length >= min && value.length <= max;
}

// ============================ 预定义验证规则 ============================

/**
 * 用户名验证规则
 */
export const usernameRules: FormRule[] = [
  {
    required: true,
    message: '请输入用户名',
    trigger: 'blur'
  },
  {
    min: 3,
    max: 20,
    message: '用户名长度应为3-20位字符',
    trigger: 'blur'
  },
  {
    pattern: REGEX_PATTERNS.USERNAME,
    message: '用户名只能包含字母、数字和下划线',
    trigger: 'blur'
  }
];

/**
 * 密码验证规则
 */
export const passwordRules: FormRule[] = [
  {
    required: true,
    message: '请输入密码',
    trigger: 'blur'
  },
  {
    pattern: REGEX_PATTERNS.PASSWORD,
    message: '密码长度应为3-20位字符',
    trigger: 'blur'
  }
];

/**
 * PH值验证规则
 */
export const phValueRules: FormRule[] = [
  {
    required: true,
    message: '请输入PH值',
    trigger: 'blur'
  },
  {
    type: 'number',
    message: 'PH值必须是数字',
    trigger: 'blur'
  },
  {
    min: 0,
    max: 14,
    message: 'PH值范围应为0-14',
    trigger: 'blur'
  }
];

/**
 * 溶解氧值验证规则
 */
export const doValueRules: FormRule[] = [
  {
    required: true,
    message: '请输入溶解氧值',
    trigger: 'blur'
  },
  {
    type: 'number',
    message: '溶解氧值必须是数字',
    trigger: 'blur'
  },
  {
    min: 0,
    message: '溶解氧值不能为负数',
    trigger: 'blur'
  }
];

/**
 * 氨氮值验证规则
 */
export const nh3nValueRules: FormRule[] = [
  {
    required: true,
    message: '请输入氨氮值',
    trigger: 'blur'
  },
  {
    type: 'number',
    message: '氨氮值必须是数字',
    trigger: 'blur'
  },
  {
    min: 0,
    message: '氨氮值不能为负数',
    trigger: 'blur'
  }
];

/**
 * 站点名称验证规则
 */
export const stationRules: FormRule[] = [
  {
    required: true,
    message: '请选择或输入站点名称',
    trigger: 'blur'
  }
];

// ============================ 动态验证函数生成器 ============================

/**
 * 创建确认密码验证器
 * @returns 验证函数
 * @param originalPassword 原密码
 */
export function createConfirmPasswordValidator(originalPassword: string) {
  return (confirmPassword: string) => {
    if (!originalPassword || originalPassword.trim() === '') {
      showError('请输入密码')
      return false
    } else if (!confirmPassword || confirmPassword.trim() === '') {
      showError('请再次输入密码')
      return false
    } else if (originalPassword !== confirmPassword) {
      showError('两次输入的密码不一致')
      return false
    } else {
      return true
    }
  };
}

// ============================ 单字段验证函数 ============================

/**
 * 验证单个字段
 * @param value 字段值
 * @param rules 验证规则数组
 * @param fieldName 字段名称（用于错误消息）
 * @returns 验证结果
 */
export function validateField(
  value: any,
  rules: FormRule[],
  fieldName?: string
): ValidationResult {
  for (const rule of rules) {
    // 必填验证
    if (rule.required && !validateRequired(value)) {
      return {
        valid: false,
        message: rule.message || `${fieldName || '字段'}不能为空`
      };
    }

    // 跳过空值的非必填验证
    if (!validateRequired(value) && !rule.required) {
      continue;
    }

    // 长度验证
    if (rule.min !== undefined || rule.max !== undefined) {
      const min = rule.min || 0;
      const max = rule.max || Infinity;

      if (typeof value === 'string' && !validateLength(value, min, max)) {
        return {
          valid: false,
          message: rule.message || `${fieldName || '字段'}长度应为${min}-${max}个字符`
        };
      }

      if (typeof value === 'number' && !validateNumberRange(value, min, max)) {
        return {
          valid: false,
          message: rule.message || `${fieldName || '字段'}应在${min}-${max}范围内`
        };
      }

      if (Array.isArray(value) && !validateArrayLength(value, min, max)) {
        return {
          valid: false,
          message: rule.message || `${fieldName || '字段'}应选择${min}-${max}个项目`
        };
      }
    }

    // 正则验证
    if (rule.pattern && typeof value === 'string' && !validatePattern(value, rule.pattern)) {
      return {
        valid: false,
        message: rule.message || `${fieldName || '字段'}格式不正确`
      };
    }

    // 类型验证
    if (rule.type) {
      let isValidType = true;
      let typeErrorMessage = '';

      switch (rule.type) {
        case 'number':
          isValidType = !isNaN(Number(value));
          typeErrorMessage = '必须是数字';
          break;
        case 'string':
          isValidType = typeof value === 'string';
          typeErrorMessage = '必须是字符串';
          break;
        default:
          break;
      }

      if (!isValidType) {
        return {
          valid: false,
          message: rule.message || `${fieldName || '字段'}${typeErrorMessage}`
        };
      }
    }

    //自定义验证
    if (typeof rule.validator === 'function') {
      try {
        // 同步验证器
        const validationResult = rule.validator(value);

        if (!validationResult) {
          return {
            valid: false,
            message: rule.message || `${fieldName || '字段'}验证失败`
          };
        }
      } catch (error) {
        return {
          valid: false,
          message: (error instanceof Error) ? error.message : '验证过程发生错误'
        };
      }
    }
  }

  return { valid: true };
}

// ============================ 表单整体验证 ============================

/**
 * 验证整个表单数据
 * @param formData 表单数据
 * @param rules 验证规则
 * @returns 验证结果
 */
export function validateForm(
  formData: Record<string, any>,
  rules: FormRules
): FormValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = formData[field];
    const fieldResult = validateField(value, fieldRules as FormRule[], field);

    if (!fieldResult.valid) {
      errors[field] = fieldResult.message!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================ 常用验证规则创建器 ============================

/**
 * 创建必填验证规则
 * @param message 错误消息
 * @returns 验证规则
 */
export function createRequiredRule(message?: string): FormRule {
  return {
    required: true,
    message: message || '此字段为必填项',
    trigger: 'blur'
  };
}

/**
 * 创建长度验证规则
 * @param min 最小长度
 * @param max 最大长度
 * @param message 错误消息
 * @returns 验证规则
 */
export function createLengthRule(min: number, max: number, message?: string): FormRule {
  return {
    min,
    max,
    message: message || `长度应为${min}-${max}个字符`,
    trigger: 'blur'
  };
}
