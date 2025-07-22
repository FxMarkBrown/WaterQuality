/**
 * 图表组合式函数
 * @author FxMarkBrown
 * @description 提供ECharts图表管理的组合式函数
 */

import {markRaw, nextTick, onBeforeUnmount, onMounted, readonly, ref, type Ref, watch} from 'vue';
import type {EChartsOption} from '@/types';
import * as echarts from 'echarts';

/**
 * 单个图表管理组合式函数
 */
export function useChart(refValue: Ref<HTMLElement | null>) {
  const chartRef = refValue || ref<HTMLElement | null>(null);
  const chart = ref<any>(null);
  const isLoading = ref<boolean>(false);

  /**
   * 初始化图表
   * @param option 图表配置
   * @param theme 主题
   */
  const initChart = async (option?: EChartsOption, theme?: string): Promise<boolean> => {
    if (!chartRef.value) {
      console.warn('Chart container or echarts not available');
      return false;
    }

    try {
      // 如果已存在图表，先销毁
      if (chart.value) {
        chart.value.dispose();
        chart.value = null;
      }

      await nextTick();

      chart.value = markRaw(echarts.init(chartRef.value, theme));
      if (option) {
        chart.value.setOption(option);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize chart:', error);
      return false;
    }
  };

  /**
   * 更新图表配置
   * @param option 新的图表配置
   * @param notMerge 是否不合并
   */
  const updateChart = (option: EChartsOption, notMerge = false): boolean => {
    if (!chart.value) {
      console.warn('Chart not initialized');
      return false;
    }

    try {
      chart.value.setOption(option, notMerge);
      return true;
    } catch (error) {
      console.error('Failed to update chart:', error);
      return false;
    }
  };

  /**
   * 调整图表大小
   */
  const resizeChart = (): void => {
    try {
      if (chart.value && typeof chart.value.resize === 'function' && !chart.value.isDisposed()) {
        chart.value.resize();
      }
    } catch (error) {
      console.warn('Chart resize failed:', error);
    }
  };

  /**
   * 显示加载状态
   * @param text 加载文本
   */
  const showLoading = (text: string = '加载中...'): void => {
    if (chart.value) {
      chart.value.showLoading('default', {
        text,
        color: '#c23531',
        textColor: '#000',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        zlevel: 0,
      });
    }
    isLoading.value = true;
  };

  /**
   * 隐藏加载状态
   */
  const hideLoading = (): void => {
    if (chart.value) {
      chart.value.hideLoading();
    }
    isLoading.value = false;
  };

  /**
   * 销毁图表
   */
  const disposeChart = (): void => {
    if (chart.value) {
      chart.value.dispose();
      chart.value = null;
    }
  };

  /**
   * 获取图表实例
   */
  const getChartInstance = () => chart.value;

  // 处理窗口resize事件
  const handleResize = () => {
    resizeChart();
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    disposeChart();
  });

  return {
    chartRef,
    chart: readonly(chart),
    isLoading: readonly(isLoading),
    initChart,
    updateChart,
    resizeChart,
    showLoading,
    hideLoading,
    disposeChart,
    getChartInstance,
  };
}

/**
 * 图表数据处理组合式函数
 */
export function useChartData() {
  const isProcessing = ref<boolean>(false);

  /**
   * 处理时间序列数据
   * @param data 原始数据
   * @param dateField 日期字段名
   * @param valueField 数值字段名
   * @param formatDate 日期格式化函数
   */
  const processTimeSeriesData = async <T>(
    data: T[],
    dateField: keyof T,
    valueField: keyof T,
    formatDate?: (date: any) => string
  ) => {
    isProcessing.value = true;

    try {
      const result = {
        dates: [] as string[],
        values: [] as number[],
      };

      for (const item of data) {
        const date = item[dateField];
        const value = Number(item[valueField]);

        if (date && !isNaN(value)) {
          result.dates.push(formatDate ? formatDate(date) : String(date));
          result.values.push(value);
        }
      }

      return result;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 处理分组数据
   * @param data 原始数据
   * @param groupField 分组字段
   * @param valueField 数值字段
   */
  const processGroupedData = async <T>(
    data: T[],
    groupField: keyof T,
    valueField: keyof T
  ) => {
    isProcessing.value = true;

    try {
      const groups: Record<string, number[]> = {};

      for (const item of data) {
        const group = String(item[groupField]);
        const value = Number(item[valueField]);

        if (!groups[group]) {
          groups[group] = [];
        }

        if (!isNaN(value)) {
          groups[group].push(value);
        }
      }

      return groups;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * 计算统计信息
   * @param values 数值数组
   */
  const calculateStats = (values: number[]) => {
    if (values.length === 0) {
      return {
        count: 0,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
      };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: values.length,
      sum,
      average: Number(average.toFixed(2)),
      min,
      max,
    };
  };

  return {
    isProcessing: readonly(isProcessing),
    processTimeSeriesData,
    processGroupedData,
    calculateStats,
  };
}

/**
 * 响应式图表组合式函数
 * 结合状态管理和图表管理
 */
export function useResponsiveChart<T>(
  echarts: any,
  dataSource: Ref<T[]>,
  chartOptionGenerator: (data: T[]) => EChartsOption
) {
  const { chartRef, initChart, updateChart, showLoading, hideLoading, resizeChart } = useChart(echarts);
  const isInitialized = ref<boolean>(false);

  /**
   * 更新图表数据
   */
  const updateChartData = async (): Promise<void> => {
    if (!isInitialized.value) {
      return;
    }

    showLoading('更新中...');

    try {
      await nextTick();
      const option = chartOptionGenerator(dataSource.value);
      updateChart(option);
    } finally {
      hideLoading();
    }
  };

  /**
   * 初始化响应式图表
   */
  const initResponsiveChart = async (theme?: string): Promise<boolean> => {
    showLoading('初始化中...');

    try {
      const option = chartOptionGenerator(dataSource.value);
      const success = await initChart(option, theme);
      isInitialized.value = success;
      return success;
    } finally {
      hideLoading();
    }
  };

  // 监听数据变化
  watch(dataSource, updateChartData, { deep: true });

  return {
    chartRef,
    isInitialized: readonly(isInitialized),
    initResponsiveChart,
    updateChartData,
    resizeChart,
    showLoading,
    hideLoading,
  };
}
