/**
 * 表单组合式函数
 * @author FxMarkBrown
 * @description 提供表单验证和管理的组合式函数
 */

import { ref, reactive, computed, readonly } from 'vue';
import type { FormRules } from '@/types';
import { validateForm } from '@/utils/validation';

/**
 * 表单验证组合式函数
 */
export function useForm<T extends Record<string, any>>(
  initialData: T,
  rules: FormRules
) {

  // ============================ 状态定义 ============================

  /** 表单数据 */
  const formData = reactive<T>({ ...initialData });

  /** 验证错误信息 */
  const errors = ref<Record<string, string>>({});

  /** 是否正在验证 */
  const isValidating = ref<boolean>(false);

  /** 是否已经提交过（用于显示验证错误） */
  const hasSubmitted = ref<boolean>(false);

  // ============================ 计算属性 ============================

  /** 表单是否有效 */
  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0;
  });

  /** 表单是否已修改 */
  const isDirty = computed(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  });

  /** 是否可以提交 */
  const canSubmit = computed(() => {
    return isValid.value && !isValidating.value;
  });

  // ============================ 公共方法 ============================

  /**
   * 验证所有字段
   * @returns 验证结果
   */
  const validateAll = async (): Promise<boolean> => {
    isValidating.value = true;

    try {
      const result = validateForm(formData, rules);
      errors.value = result.errors;
      return result.valid;
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * 获取字段错误信息
   * @param fieldName 字段名
   * @returns 错误信息
   */
  const getFieldError = (fieldName: string): string | undefined => {
    return errors.value[fieldName];
  };

  /**
   * 检查字段是否有错误
   * @param fieldName 字段名
   * @returns 是否有错误
   */
  const hasFieldError = (fieldName: string): boolean => {
    return !!errors.value[fieldName];
  };

  /**
   * 重置表单
   */
  const resetForm = (): void => {
    Object.assign(formData, initialData);
    errors.value = {};
    hasSubmitted.value = false;
  };

  // ============================ 返回值 ============================

  return {
    // 状态
    formData,
    errors: readonly(errors),
    isValidating: readonly(isValidating),
    hasSubmitted: readonly(hasSubmitted),

    // 计算属性
    isValid,
    isDirty,
    canSubmit,

    // 方法
    validateAll,
    getFieldError,
    hasFieldError,
    resetForm
  };
}
