/**
 * 模型管理状态
 * @author sctpan, fxmarkbrown
 * @description 管理机器学习模型和相关操作
 */

import { defineStore } from 'pinia';
import {ref, computed, readonly} from 'vue';
import { ApiService } from '@/services/api';
import { ErrorHandler, showSuccess } from '@/utils/error-handler';
import { formatDate } from '@/utils/date';
import type {
  ApiModel,
  Model,
  ModelTrainingParams,
  ModelTrainingResponse,
  ModelPredictionParams,
  ModelPredictionResponse,
  ModelTuningParams,
  ModelTuningResponse,
  WaterQualityIndicator,
  ModelType
} from '@/types';
import {
  ALL_MODELS_VALUE,
  TUNABLE_MODELS,
  MODEL_TYPE_NAMES,
  WATER_QUALITY_INDICATOR_NAMES
} from '@/constants';

/**
 * 模型管理状态Store
 */
export const useModelStore = defineStore('model', () => {
  // ============================ 状态定义 ============================

  /** 可用模型列表 */
  const availableModels = ref<Model[]>([]);

  /** 模型方法列表 */
  const modelMethods = ref<string[]>([]);

  /** 当前选择的指标 */
  const currentIndicator = ref<WaterQualityIndicator>('ph');

  /** 当前选择的模型方法 */
  const currentMethod = ref<string>(ALL_MODELS_VALUE);

  /** 训练结果数据 */
  const trainingResult = ref<ModelTrainingResponse | null>(null);

  /** 预测结果数据 */
  const predictionResult = ref<ModelPredictionResponse | null>(null);

  /** 调优结果数据 */
  const tuningResult = ref<ModelTuningResponse | null>(null);

  /** 是否正在加载模型列表 */
  const isLoadingModels = ref<boolean>(false);

  /** 是否正在训练模型 */
  const isTraining = ref<boolean>(false);

  /** 是否正在预测 */
  const isPredicting = ref<boolean>(false);

  /** 是否正在调优 */
  const isTuning = ref<boolean>(false);

  // ============================ 计算属性 ============================

  /** 当前指标显示名称 */
  const currentIndicatorName = computed(() => {
    return WATER_QUALITY_INDICATOR_NAMES[currentIndicator.value] || currentIndicator.value;
  });

  /** 当前方法显示名称 */
  const currentMethodName = computed(() => {
    if (currentMethod.value === ALL_MODELS_VALUE) {
      return '所有';
    }
    return MODEL_TYPE_NAMES[currentMethod.value as ModelType] || currentMethod.value;
  });

  /** 可调优的模型列表 */
  const tunableModelList = computed(() => {
    return availableModels.value.filter(model =>
      TUNABLE_MODELS.includes(model.method as ModelType)
    );
  });

  /** 模型统计信息 */
  const modelStats = computed(() => {
    const total = availableModels.value.length;
    const byMethod = availableModels.value.reduce((stats, model) => {
      stats[model.method] = (stats[model.method] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    return {
      total,
      byMethod,
    };
  });

  // ============================ 私有方法 ============================

  /**
   * 转换API模型信息为本地模型信息
   * @param apiModel API返回的模型信息
   * @returns 转换后的模型信息
   */
  const transformApiModel = (apiModel: ApiModel): Model => {
    return {
      ...apiModel,
      user: apiModel.user.username,
      date: formatDate(apiModel.date),
    };
  };

  /**
   * 转换模型列表
   * @param apiModels API返回的模型列表
   * @returns 转换后的模型列表
   */
  const transformModelList = (apiModels: ApiModel[]): Model[] => {
    return apiModels.map(transformApiModel);
  };

  // ============================ 公共方法 ============================

  /**
   * 获取可用模型
   * @param indicator 指标类型
   * @param method 模型方法
   * @returns 是否获取成功
   */
  const getAvailableModels = async (
    indicator: WaterQualityIndicator,
    method: string
  ): Promise<boolean> => {
    try {
      isLoadingModels.value = true;
      currentIndicator.value = indicator;
      currentMethod.value = method;

      const apiModels = await ApiService.model.getAvailableModels(indicator, method);
      availableModels.value = transformModelList(apiModels);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取可用模型');
      return false;
    } finally {
      isLoadingModels.value = false;
    }
  };

  /**
   * 获取模型方法列表
   * @param indicator 指标类型
   * @returns 是否获取成功
   */
  const getModelMethods = async (indicator: WaterQualityIndicator): Promise<boolean> => {
    try {
      const methods = await ApiService.model.getModelMethods(indicator);
      modelMethods.value = methods;
      currentIndicator.value = indicator;

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取模型方法列表');
      return false;
    }
  };

  /**
   * 训练模型
   * @param trainingParams 训练参数
   * @returns 是否训练成功
   */
  const trainModel = async (trainingParams: ModelTrainingParams): Promise<boolean> => {
    try {
      isTraining.value = true;

      const result = await ApiService.model.trainModel(trainingParams);

      if (result.status === 'success') {
        trainingResult.value = result;
        showSuccess('模型训练成功');
        // 刷新可用模型列表
        await getAvailableModels(trainingParams.indicator, currentMethod.value);
        return true;
      } else if (result.status === 'deny') {
        ErrorHandler.handleApiError(result, '模型训练');
        return false;
      } else {
        ErrorHandler.handleApiError(result, '模型训练');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '模型训练');
      return false;
    } finally {
      isTraining.value = false;
    }
  };

  /**
   * 模型预测
   * @param predictionParams 预测参数
   * @returns 是否预测成功
   */
  const predictModel = async (predictionParams: ModelPredictionParams): Promise<boolean> => {
    try {
      isPredicting.value = true;

      const result = await ApiService.model.predictModel(predictionParams);

      if (result.status === 'success') {
        predictionResult.value = result;
        showSuccess('预测成功');
        return true;
      } else {
        ErrorHandler.handleApiError(result, '模型预测');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '模型预测');
      return false;
    } finally {
      isPredicting.value = false;
    }
  };

  /**
   * 删除模型
   * @param modelId 模型ID
   * @returns 是否删除成功
   */
  const deleteModel = async (modelId: number): Promise<boolean> => {
    try {
      const response = await ApiService.model.deleteModel(modelId);

      if (response.status === 'success') {
        showSuccess('模型删除成功');
        // 从本地列表中移除模型
        availableModels.value = availableModels.value.filter(model => model.id !== modelId);
        return true;
      } else {
        ErrorHandler.handleApiError(response, '删除模型');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '删除模型');
      return false;
    }
  };

  /**
   * 模型调优
   * @param tuningParams 调优参数
   * @returns 是否调优成功
   */
  const tuneModel = async (tuningParams: ModelTuningParams): Promise<boolean> => {
    try {
      isTuning.value = true;

      const result = await ApiService.model.tuneModel(tuningParams);

      if (result.status === 'success' && result.data) {
        tuningResult.value = result;
        showSuccess('模型调优成功');
        // 刷新可用模型列表
        await getAvailableModels(currentIndicator.value, currentMethod.value);
        return true;
      } else {
        ErrorHandler.handleApiError(result, '模型调优');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '模型调优');
      return false;
    } finally {
      isTuning.value = false;
    }
  };

  /**
   * 根据ID查找模型
   * @param modelId 模型ID
   * @returns 模型信息
   */
  const getModelById = (modelId: number): Model | undefined => {
    return availableModels.value.find(model => model.id === modelId);
  };

  /**
   * 根据方法筛选模型
   * @param method 模型方法
   * @returns 筛选后的模型列表
   */
  const getModelsByMethod = (method: string): Model[] => {
    if (method === ALL_MODELS_VALUE) {
      return availableModels.value;
    }
    return availableModels.value.filter(model => model.method === method);
  };

  /**
   * 检查模型是否可调优
   * @param modelMethod 模型方法
   * @returns 是否可调优
   */
  const isModelTunable = (modelMethod: string): boolean => {
    return TUNABLE_MODELS.includes(modelMethod as ModelType);
  };

  /**
   * 获取最优模型（按RMSE排序）
   * @param method 模型方法（可选）
   * @returns 最优模型
   */
  const getBestModel = (method?: string): Model | null => {
    let models = availableModels.value;

    if (method && method !== ALL_MODELS_VALUE) {
      models = getModelsByMethod(method);
    }

    if (models.length === 0) return null;

    // 按RMSE升序排序，取第一个
    return models.reduce((best, current) => {
      return current.rmse < best.rmse ? current : best;
    });
  };

  /**
   * 刷新模型数据
   */
  const refreshModels = async (): Promise<void> => {
    if (currentIndicator.value) {
      await Promise.allSettled([
        getModelMethods(currentIndicator.value),
        getAvailableModels(currentIndicator.value, currentMethod.value),
      ]);
    }
  };

  /**
   * 清除训练结果
   */
  const clearTrainingResult = (): void => {
    trainingResult.value = null;
  };

  /**
   * 清除预测结果
   */
  const clearPredictionResult = (): void => {
    predictionResult.value = null;
  };

  /**
   * 清除调优结果
   */
  const clearTuningResult = (): void => {
    tuningResult.value = null;
  };

  /**
   * 重置模型状态
   */
  const resetModelState = (): void => {
    availableModels.value = [];
    modelMethods.value = [];
    currentIndicator.value = 'ph';
    currentMethod.value = ALL_MODELS_VALUE;
    trainingResult.value = null;
    predictionResult.value = null;
    tuningResult.value = null;
    isLoadingModels.value = false;
    isTraining.value = false;
    isPredicting.value = false;
    isTuning.value = false;
  };

  /**
   * 初始化模型数据
   * @param indicator 初始指标
   */
  const initializeModels = async (indicator: WaterQualityIndicator = 'ph'): Promise<void> => {
    currentIndicator.value = indicator;
    await getModelMethods(indicator);
    await getAvailableModels(indicator, ALL_MODELS_VALUE);
  };

  // ============================ 返回状态和方法 ============================

  return {
    // 状态
    availableModels: readonly(availableModels),
    modelMethods: readonly(modelMethods),
    currentIndicator: readonly(currentIndicator),
    currentMethod: readonly(currentMethod),
    trainingResult: readonly(trainingResult),
    predictionResult: readonly(predictionResult),
    tuningResult: readonly(tuningResult),
    isLoadingModels: readonly(isLoadingModels),
    isTraining: readonly(isTraining),
    isPredicting: readonly(isPredicting),
    isTuning: readonly(isTuning),

    // 计算属性
    currentIndicatorName,
    currentMethodName,
    tunableModelList,
    modelStats,

    // 方法
    getAvailableModels,
    getModelMethods,
    trainModel,
    predictModel,
    deleteModel,
    tuneModel,
    getModelById,
    getModelsByMethod,
    isModelTunable,
    getBestModel,
    refreshModels,
    clearTrainingResult,
    clearPredictionResult,
    clearTuningResult,
    resetModelState,
    initializeModels,
  };
});
