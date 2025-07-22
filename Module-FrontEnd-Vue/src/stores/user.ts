/**
 * 用户管理状态
 * @author FxMarkBrown
 * @description 管理用户列表和用户管理相关操作
 */

import { defineStore } from 'pinia';
import {readonly, ref} from 'vue';
import { ApiService } from '@/services/api';
import { ErrorHandler, showSuccess } from '@/utils/error-handler';
import { debounce } from '@/utils';
import type { ApiUser, User, UserGrantRequest, PasswordChangeForm } from '@/types';
import {USER_ROLE_NAMES, USER_AUTHORITY_DESCRIPTIONS, USER_ROLES} from '@/constants';

/**
 * 用户管理状态Store
 */
export const useUserStore = defineStore('user', () => {
  // ============================ 状态定义 ============================

  /** 用户列表 */
  const users = ref<User[]>([]);

  /** 搜索结果用户列表 */
  const searchResults = ref<User[]>([]);

  /** 是否正在加载用户列表 */
  const isLoadingUsers = ref<boolean>(false);

  /** 是否正在搜索 */
  const isSearching = ref<boolean>(false);

  /** 当前搜索关键词 */
  const searchKeyword = ref<string>('');

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
   * 转换用户列表
   * @param apiUsers API返回的用户列表
   * @returns 转换后的用户列表
   */
  const transformUsers = (apiUsers: ApiUser[]): User[] => {
    return apiUsers.map(transformApiUser);
  };

  // ============================ 公共方法 ============================

  /**
   * 获取所有用户
   * @returns 是否获取成功
   */
  const getAllUsers = async (): Promise<boolean> => {
    try {
      isLoadingUsers.value = true;

      const apiUsers = await ApiService.user.getAllUsers();
      users.value = transformUsers(apiUsers);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '获取用户列表');
      return false;
    } finally {
      isLoadingUsers.value = false;
    }
  };

  /**
   * 搜索用户
   * @param username 用户名关键词
   * @returns 是否搜索成功
   */
  const searchUsers = async (username: string): Promise<boolean> => {
    try {
      isSearching.value = true;
      searchKeyword.value = username;

      if (!username.trim()) {
        // 如果搜索关键词为空，返回所有用户
        searchResults.value = [...users.value];
        return true;
      }

      const apiUsers = await ApiService.user.searchUsers(username);
      searchResults.value = transformUsers(apiUsers);

      return true;
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '搜索用户');
      return false;
    } finally {
      isSearching.value = false;
    }
  };

  /**
   * 防抖搜索用户
   */
  const debouncedSearchUsers = debounce(searchUsers, 300);

  /**
   * 授予用户权限
   * @param userId 用户ID
   * @param grantInfo 权限信息
   * @returns 是否操作成功
   */
  const grantUserPermission = async (
    userId: number,
    grantInfo: UserGrantRequest
  ): Promise<boolean> => {
    try {
      const response = await ApiService.user.grantUserPermission(userId, grantInfo);

      if (response.status === 'success') {
        showSuccess('权限修改成功');
        // 刷新用户列表
        await getAllUsers();
        // 如果有搜索结果，也需要刷新
        if (searchKeyword.value) {
          await searchUsers(searchKeyword.value);
        }
        return true;
      } else {
        ErrorHandler.handleApiError(response, '权限修改');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '权限修改');
      return false;
    }
  };

  /**
   * 删除用户
   * @param userId 用户ID
   * @returns 是否删除成功
   */
  const deleteUser = async (userId: number): Promise<boolean> => {
    try {
      const response = await ApiService.user.deleteUser(userId);

      if (response.status === 'success') {
        showSuccess('用户删除成功');
        // 从本地列表中移除用户
        users.value = users.value.filter(user => user.id !== userId);
        searchResults.value = searchResults.value.filter(user => user.id !== userId);
        return true;
      } else {
        ErrorHandler.handleApiError(response, '删除用户');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '删除用户');
      return false;
    }
  };

  /**
   * 修改密码
   * @param userId 用户ID
   * @param passwordInfo 密码信息
   * @returns 是否修改成功
   */
  const changePassword = async (
    userId: number,
    passwordInfo: PasswordChangeForm
  ): Promise<boolean> => {
    try {
      const response = await ApiService.user.changePassword(userId, passwordInfo);

      if (response.status === 'success') {
        showSuccess('密码修改成功');
        return true;
      } else {
        ErrorHandler.handleApiError(response, '密码修改');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleGenericError(error as Error, '密码修改');
      return false;
    }
  };

  /**
   * 根据ID查找用户
   * @param userId 用户ID
   * @returns 用户信息
   */
  const getUserById = (userId: number): User | undefined => {
    return users.value.find(user => user.id === userId);
  };

  /**
   * 根据用户名查找用户
   * @param username 用户名
   * @returns 用户信息
   */
  const getUserByUsername = (username: string): User | undefined => {
    return users.value.find(user => user.username === username);
  };

  /**
   * 筛选指定角色的用户
   * @param role 角色名称
   * @returns 筛选后的用户列表
   */
  const getUsersByRole = (role: string): User[] => {
    return users.value.filter(user => user.role === role);
  };

  /**
   * 获取用户统计信息
   * @returns 用户统计
   */
  const getUserStats = () => {
    const total = users.value.length;
    const adminCount = getUsersByRole(USER_ROLE_NAMES[USER_ROLES.ADMIN]).length;
    const superAdminCount = getUsersByRole(USER_ROLE_NAMES[USER_ROLES.SUPER_ADMIN]).length;
    const userCount = getUsersByRole(USER_ROLE_NAMES[USER_ROLES.USER]).length;

    return {
      total,
      adminCount,
      superAdminCount,
      userCount,
    };
  };

  /**
   * 刷新用户列表
   */
  const refreshUsers = async (): Promise<void> => {
    await getAllUsers();
    // 如果有搜索关键词，重新搜索
    if (searchKeyword.value) {
      await searchUsers(searchKeyword.value);
    }
  };

  /**
   * 清空搜索结果
   */
  const clearSearch = (): void => {
    searchKeyword.value = '';
    searchResults.value = [];
  };

  /**
   * 重置用户状态
   */
  const resetUserState = (): void => {
    users.value = [];
    searchResults.value = [];
    searchKeyword.value = '';
    isLoadingUsers.value = false;
    isSearching.value = false;
  };

  // ============================ 返回状态和方法 ============================

  return {
    // 状态
    users: readonly(users),
    searchResults: readonly(searchResults),
    isLoadingUsers: readonly(isLoadingUsers),
    isSearching: readonly(isSearching),
    searchKeyword: readonly(searchKeyword),

    // 方法
    getAllUsers,
    searchUsers,
    debouncedSearchUsers,
    grantUserPermission,
    deleteUser,
    changePassword,
    getUserById,
    getUserByUsername,
    getUsersByRole,
    getUserStats,
    refreshUsers,
    clearSearch,
    resetUserState,
  };
});
