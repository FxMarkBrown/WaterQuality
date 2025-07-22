/**
 * 认证状态管理
 * @author FxMarkBrown
 * @description 管理用户认证状态和相关操作
 */

import { defineStore } from 'pinia';
import {ref, computed, readonly} from 'vue';
import { ApiService } from '@/services/api';
import { ErrorHandler, showSuccess } from '@/utils/error-handler';
import { LocalStorage } from '@/utils';
import type { ApiUser, User, LoginRequest, RegisterForm } from '@/types';
import {USER_ROLE_NAMES, USER_AUTHORITY_DESCRIPTIONS, USER_ROLES} from '@/constants';

/**
 * 认证状态管理Store
 */
export const useAuthStore = defineStore('auth', () => {
  // ============================ 状态定义 ============================

  /** 当前用户信息 */
  const currentUser = ref<User | null>(null);

  /** 是否已登录 */
  const isLoggedIn = ref<boolean>(false);

  /** 登录状态加载中 */
  const isLoading = ref<boolean>(false);

  /** 是否正在初始化（检查登录状态） */
  const isInitializing = ref<boolean>(true);

  // ============================ 计算属性 ============================

  /** 当前用户角色 */
  const userRole = computed(() => currentUser.value?.role || '');

  /** 当前用户权限描述 */
  const userAuthority = computed(() => currentUser.value?.authority || '');

  /** 是否为超级管理员 */
  const isSuperAdmin = computed(() => userRole.value === USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN]);

  /** 是否为管理员 */
  const isAdmin = computed(() => userRole.value === USER_ROLE_NAMES[USER_ROLES.ADMIN] || isSuperAdmin.value);

  /** 是否为普通用户 */
  const isUser = computed(() => userRole.value === USER_ROLE_NAMES[USER_ROLES.USER]);

  // ============================ 私有方法 ============================

  /**
   * 转换API用户信息为本地用户信息
   * @param apiUser API返回的用户信息
   * @returns 转换后的用户信息
   */
  const transformApiUser = (apiUser: ApiUser): User => {
    const roleName = USER_ROLE_NAMES[apiUser.role.id] || '未知角色';
    const authority = USER_AUTHORITY_DESCRIPTIONS[apiUser.role.id] || '无权限';

    return {
      id: apiUser.id,
      username: apiUser.username,
      role: roleName,
      authority,
    };
  };

  /**
   * 设置当前用户信息
   * @param user 用户信息
   */
  const setCurrentUser = (user: User | null): void => {
    currentUser.value = user;
    isLoggedIn.value = !!user;

    // 持久化登录状态
    if (user) {
      LocalStorage.set('currentUser', user);
      LocalStorage.set('isLoggedIn', true);
    } else {
      LocalStorage.remove('currentUser');
      LocalStorage.remove('isLoggedIn');
    }
  };

  // ============================ 公共方法 ============================

  /**
   * 用户登录
   * @param credentials 登录凭据
   * @returns 登录是否成功
   */
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await ApiService.auth.login(credentials);

      if (response.status === 'success') {
        // 登录成功后获取用户信息
        await getCurrentUser();
        showSuccess('登录成功');
        return true;
      } else {
        ErrorHandler.handleApiError(response, '用户登录');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '用户登录');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 用户注册
   * @param userInfo 注册信息
   * @returns 注册是否成功
   */
  const register = async (userInfo: RegisterForm): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await ApiService.auth.register(userInfo);

      if (response.status === 'success') {
        showSuccess('注册成功，请登录');
        return true;
      } else {
        ErrorHandler.handleApiError(response, '用户注册');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '用户注册');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取当前用户信息
   * @returns 是否获取成功
   */
  const getCurrentUser = async (): Promise<boolean> => {
    try {
      const apiUser = await ApiService.auth.getCurrentUser();
      const user = transformApiUser(apiUser);
      setCurrentUser(user);
      return true;
    } catch (error) {
      // 获取用户信息失败，可能是未登录
      setCurrentUser(null);
      return false;
    }
  };

  /**
   * 用户注销
   * @returns 注销是否成功
   */
  const logout = async (): Promise<boolean> => {
    try {
      isLoading.value = true;

      const response = await ApiService.auth.logout();

      if (response.status === 'success') {
        setCurrentUser(null);
        showSuccess('注销成功');
        return true;
      } else {
        // 即使注销失败，也清除本地状态
        setCurrentUser(null);
        ErrorHandler.handleApiError(response, '用户注销', false);
        return false;
      }
    } catch (error) {
      // 即使注销失败，也清除本地状态
      setCurrentUser(null);
      ErrorHandler.handleGenericError(error as Error, '用户注销', false);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 初始化认证状态
   * 从本地存储恢复登录状态，并验证服务器端状态
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      isInitializing.value = true;

      // 从本地存储恢复状态
      const savedUser = LocalStorage.get<User>('currentUser', null);
      const savedLoginStatus = LocalStorage.get<boolean>('isLoggedIn', false);

      if (savedUser && savedLoginStatus) {
        // 验证服务器端登录状态
        const isValid = await getCurrentUser();
        if (!isValid) {
          // 服务器端已注销，清除本地状态
          setCurrentUser(null);
        }
      }
    } catch (error) {
      // 初始化失败，清除本地状态
      setCurrentUser(null);
      console.warn('Failed to initialize auth state:', error);
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * 检查用户权限
   * @param requiredRole 需要的角色（可选）
   * @returns 是否有权限
   */
  const checkPermission = (requiredRole?: 'admin' | 'user'): boolean => {
    if (!isLoggedIn.value) return false;

    if (!requiredRole) return true;

    if (requiredRole === 'admin') {
      return isAdmin.value;
    }

    if (requiredRole === 'user') {
      return isUser.value || isAdmin.value;
    }

    return false;
  };

  /**
   * 刷新用户信息
   */
  const refreshUser = async (): Promise<void> => {
    if (isLoggedIn.value) {
      await getCurrentUser();
    }
  };

  /**
   * 清除认证状态
   */
  const clearAuth = (): void => {
    setCurrentUser(null);
  };

  // ============================ 返回状态和方法 ============================

  return {
    // 状态
    currentUser: readonly(currentUser),
    isLoggedIn: readonly(isLoggedIn),
    isLoading: readonly(isLoading),
    isInitializing: readonly(isInitializing),

    // 计算属性
    userRole,
    userAuthority,
    isSuperAdmin,
    isAdmin,
    isUser,

    // 方法
    login,
    register,
    logout,
    getCurrentUser,
    initializeAuth,
    checkPermission,
    refreshUser,
    clearAuth,
  };
});
