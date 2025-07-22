/**
 * Pinia状态管理入口
 * @author FxMarkBrown
 * @description 统一导出所有状态管理模块
 */

import { createPinia } from 'pinia';

// 创建Pinia实例
export const pinia = createPinia();

// 导出所有stores
export { useAuthStore } from './auth.ts';
export { useUserStore } from './user.ts';
export { useWaterQualityStore } from './waterquality.ts';
export { useModelStore } from './model.ts';

export default pinia;
