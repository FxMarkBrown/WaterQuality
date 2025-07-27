package top.fxmarkbrown.waterquality.service

import cn.dev33.satoken.stp.StpUtil
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import top.fxmarkbrown.waterquality.model.User
import top.fxmarkbrown.waterquality.reponsitory.UserRepository

/**
 * 认证服务
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/07/27
 **/
@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder
) {
    
    private val logger = LoggerFactory.getLogger(AuthService::class.java)

    /**
     * 用户登录
     */
    fun login(username: String, password: String): Boolean {
        return try {
            val user = userRepository.findUserByName(username)
            if (user != null && user.pass != null && passwordEncoder.matches(password, user.pass!!)) {
                // 使用Sa-Token登录
                StpUtil.login(user.id)
                // 设置角色
                val roleList = mutableListOf<String>()
                user.role?.name?.let { roleName ->
                    roleList.add(roleName.uppercase())
                }
                StpUtil.getSession().set("role-list", roleList)
                true
            } else false
        } catch (e: Exception) {
            logger.error("用户登录失败: $username", e)
            false
        }
    }

    /**
     * 用户登出
     */
    fun logout() {
        StpUtil.logout()
    }

    /**
     * 获取当前登录用户
     */
    fun getCurrentUser(): User? {
        return if (StpUtil.isLogin()) {
            val userId = StpUtil.getLoginIdAsInt()
            userRepository.findUserById(userId)
        } else null
    }
}