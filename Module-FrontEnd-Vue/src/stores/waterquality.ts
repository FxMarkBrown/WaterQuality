/**
 * 水质数据状态管理
 * @author FxMarkBrown
 * @description 管理水质数据和相关操作
 */

import {defineStore} from 'pinia';
import {computed, readonly, ref} from 'vue';
import {ApiService} from '@/services/api';
import {ErrorHandler, showSuccess} from '@/utils/error-handler';
import {cloneObj} from '@/utils/clone';
import {formatDate} from '@/utils/date';
import type {
  ApiWaterQuality,
  TrendPlotParams,
  TrendPlotResponse,
  WaterQuality,
  WaterQualityQueryParams,
  WaterQualityRequest
} from '@/types';
import {ALL_STATIONS_VALUE} from '@/constants';

/**
 * 水质数据状态管理Store
 */
export const useWaterQualityStore = defineStore('waterQuality', () => {
  // ============================ 状态定义 ============================

  /** 水质数据列表 */
  const waterQualities = ref<WaterQuality[]>([]);

  /** 最近水质数据 */
  const recentWaterQualities = ref<WaterQuality[]>([]);

  /** 站点列表 */
  const stations = ref<string[]>([]);

  /** 趋势图数据 */
  const trendData = ref<TrendPlotResponse | null>(null);

  /** 是否正在加载数据 */
  const isLoading = ref<boolean>(false);

  /** 是否正在加载最近数据 */
  const isLoadingRecent = ref<boolean>(false);

  /** 是否正在加载站点 */
  const isLoadingStations = ref<boolean>(false);

  /** 是否正在加载趋势数据 */
  const isLoadingTrend = ref<boolean>(false);

  /** 当前查询参数 */
  const currentQuery = ref<WaterQualityQueryParams>({});

  // ============================ 计算属性 ============================

  /** 水质数据总数 */
  const totalCount = computed(() => waterQualities.value.length);

  /** 最新的水质数据 */
  const latestWaterQuality = computed(() => {
    if (waterQualities.value.length === 0) return null;
    // 假设数据按时间排序，取第一个
    return waterQualities.value[0];
  });

  /** 水质统计信息 */
  const waterQualityStats = computed(() => {
    const data = waterQualities.value;
    if (data.length === 0) {
      return {
        avgPh: 0,
        avgDo: 0,
        avgNh3n: 0,
        count: 0,
      };
    }

    const totalPh = data.reduce((sum, item) => sum + item.phValue, 0);
    const totalDo = data.reduce((sum, item) => sum + item.doValue, 0);
    const totalNh3n = data.reduce((sum, item) => sum + item.nh3nValue, 0);

    return {
      avgPh: Number((totalPh / data.length).toFixed(2)),
      avgDo: Number((totalDo / data.length).toFixed(2)),
      avgNh3n: Number((totalNh3n / data.length).toFixed(2)),
      count: data.length,
    };
  });

  // ============================ 私有方法 ============================

  /**
   * 转换API水质数据为本地数据
   * @param apiData API返回的水质数据
   * @returns 转换后的水质数据
   */
  const transformApiWaterQuality = (apiData: ApiWaterQuality): WaterQuality => {
    return {
      ...apiData,
      date: formatDate(apiData.date),
    };
  };

  /**
   * 转换水质数据列表
   * @param apiDataList API返回的水质数据列表
   * @returns 转换后的水质数据列表
   */
  const transformWaterQualityList = (apiDataList: ApiWaterQuality[]): WaterQuality[] => {
    return apiDataList.map(transformApiWaterQuality);
  };

  // ============================ 公共方法 ============================

  /**
   * 获取所有水质数据
   * @returns 是否获取成功
   */
  const getAllWaterQuality = async (): Promise<boolean> => {
    try {
      isLoading.value = true;

      const apiData = await ApiService.waterQuality.getAllWaterQuality();
      waterQualities.value = transformWaterQualityList(apiData);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取水质数据');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 查询水质数据
   * @param queryParams 查询参数
   * @returns 是否查询成功
   */
  const queryWaterQuality = async (queryParams: WaterQualityQueryParams): Promise<boolean> => {
    try {
      isLoading.value = true;
      currentQuery.value = { ...queryParams };

      const apiData = await ApiService.waterQuality.queryWaterQuality(queryParams);
      waterQualities.value = transformWaterQualityList(apiData);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '查询水质数据');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取最近的水质数据
   * @param num 数据数量
   * @returns 是否获取成功
   */
  const getRecentWaterQuality = async (num: number): Promise<boolean> => {
    try {
      isLoadingRecent.value = true;

      const apiData = await ApiService.waterQuality.getRecentWaterQuality(num);
      recentWaterQualities.value = transformWaterQualityList(apiData);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取最近水质数据');
      return false;
    } finally {
      isLoadingRecent.value = false;
    }
  };

  /**
   * 获取站点列表
   * @returns 是否获取成功
   */
  const getStations = async (): Promise<boolean> => {
    try {
      isLoadingStations.value = true;
      stations.value = await ApiService.waterQuality.getStations();

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取站点列表');
      return false;
    } finally {
      isLoadingStations.value = false;
    }
  };

  /**
   * 添加水质数据
   * @param waterQuality 水质数据
   * @returns 是否添加成功
   */
  const addWaterQuality = async (waterQuality: WaterQualityRequest): Promise<boolean> => {
    try {
      const response = await ApiService.waterQuality.addWaterQuality(waterQuality);

      if (response.status === 'success') {
        showSuccess('添加成功');
        // 刷新数据列表
        await refreshWaterQuality();
        return true;
      } else {
        ErrorHandler.handleApiError(response, '添加水质数据');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '添加水质数据');
      return false;
    }
  };

  /**
   * 更新水质数据
   * @param id 数据ID
   * @param waterQuality 水质数据
   * @returns 是否更新成功
   */
  const updateWaterQuality = async (
    id: number,
    waterQuality: WaterQualityRequest
  ): Promise<boolean> => {
    try {
      const response = await ApiService.waterQuality.updateWaterQuality(id, waterQuality);

      if (response.status === 'success') {
        showSuccess('更新成功');
        // 刷新数据列表
        await refreshWaterQuality();
        return true;
      } else {
        ErrorHandler.handleApiError(response, '更新水质数据');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '更新水质数据');
      return false;
    }
  };

  /**
   * 删除水质数据
   * @param id 数据ID
   * @returns 是否删除成功
   */
  const deleteWaterQuality = async (id: number): Promise<boolean> => {
    try {
      const response = await ApiService.waterQuality.deleteWaterQuality(id);

      if (response.status === 'success') {
        showSuccess('删除成功');
        // 从本地列表中移除
        waterQualities.value = waterQualities.value.filter(item => item.id !== id);
        recentWaterQualities.value = recentWaterQualities.value.filter(item => item.id !== id);
        return true;
      } else {
        ErrorHandler.handleApiError(response, '删除水质数据');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '删除水质数据');
      return false;
    }
  };

  /**
   * 获取趋势图数据
   * @param plotParams 绘图参数
   * @returns 是否获取成功
   */
  const getTrendData = async (plotParams: TrendPlotParams): Promise<boolean> => {
    try {
      isLoadingTrend.value = true;
      trendData.value = await ApiService.waterQuality.getTrendPlotData(plotParams);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取趋势数据');
      return false;
    } finally {
      isLoadingTrend.value = false;
    }
  };

  /**
   * 根据ID查找水质数据
   * @param id 数据ID
   * @returns 水质数据
   */
  const getWaterQualityById = (id: number): WaterQuality | undefined => {
    return waterQualities.value.find(item => item.id === id);
  };

  /**
   * 根据站点筛选水质数据
   * @param station 站点名称
   * @returns 筛选后的数据列表
   */
  const getWaterQualityByStation = (station: string): WaterQuality[] => {
    if (station === ALL_STATIONS_VALUE) {
      return waterQualities.value;
    }
    return waterQualities.value.filter(item => item.station === station);
  };

  /**
   * 克隆水质数据对象（用于编辑）
   * @param data 水质数据
   * @returns 克隆的数据对象
   */
  const cloneWaterQuality = (data: WaterQuality): WaterQuality => {
    return cloneObj(data);
  };

  /**
   * 刷新水质数据
   * 根据当前查询参数重新获取数据
   */
  const refreshWaterQuality = async (): Promise<void> => {
    if (Object.keys(currentQuery.value).length > 0) {
      await queryWaterQuality(currentQuery.value);
    } else {
      await getAllWaterQuality();
    }
  };


  /**
   * 排序水质数据
   * @param key 排序字段
   * @param order 排序方向
   */
  const sortWaterQualities = async (key: string, order: string): Promise<void> => {
    waterQualities.value.sort((a, b) => {
      let aVal = (a as any)[key];
      let bVal = (b as any)[key];

      // 处理数值类型字段
      if (key === 'phValue' || key === 'doValue' || key === 'nh3nValue') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      // 处理日期字段
      if (key === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // 处理字符串字段（如station）
      if (key === 'station') {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (order === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  };


  /**
   * 重置水质数据状态
   */
  const resetWaterQualityState = (): void => {
    waterQualities.value = [];
    recentWaterQualities.value = [];
    stations.value = [];
    trendData.value = null;
    currentQuery.value = {};
    isLoading.value = false;
    isLoadingRecent.value = false;
    isLoadingStations.value = false;
    isLoadingTrend.value = false;
  };

  /**
   * 初始化水质数据
   * 获取基础数据
   */
  const initializeWaterQuality = async (): Promise<void> => {
    // 并行获取基础数据
    await Promise.allSettled([
      getStations(),
      getAllWaterQuality(), // 获取最近10条数据
    ]);
  };

  // ============================ 返回状态和方法 ============================

  return {
    // 状态
    waterQualities: readonly(waterQualities),
    recentWaterQualities: readonly(recentWaterQualities),
    stations: readonly(stations),
    trendData: readonly(trendData),
    isLoading: readonly(isLoading),
    isLoadingRecent: readonly(isLoadingRecent),
    isLoadingStations: readonly(isLoadingStations),
    isLoadingTrend: readonly(isLoadingTrend),
    currentQuery: readonly(currentQuery),

    // 计算属性
    totalCount,
    latestWaterQuality,
    waterQualityStats,

    // 方法
    getAllWaterQuality,
    queryWaterQuality,
    getRecentWaterQuality,
    getStations,
    addWaterQuality,
    updateWaterQuality,
    deleteWaterQuality,
    getTrendData,
    getWaterQualityById,
    getWaterQualityByStation,
    cloneWaterQuality,
    refreshWaterQuality,
    sortWaterQualities,
    resetWaterQualityState,
    initializeWaterQuality,
  };
});
