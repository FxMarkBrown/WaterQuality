package top.fxmarkbrown.waterquality.service

import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import top.fxmarkbrown.waterquality.model.User
import top.fxmarkbrown.waterquality.reponsitory.RoleRepository
import top.fxmarkbrown.waterquality.reponsitory.UserRepository

/**
 * 用户服务
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Service
class UserService(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(UserService::class.java)
    /**
     * 修改密码
     */
    @Transactional
    fun editPassword(newPassword: String, userId: Int): Boolean {
        return try {
            val user = userRepository.findUserById(userId) ?: return false
            user.pass = passwordEncoder.encode(newPassword)
            userRepository.save(user)
            true
        } catch (e: Exception) {
            logger.error("修改用户密码失败 UID: $userId")
            e.printStackTrace()
            false
        }
    }

    /**
     * 检查密码是否正确
     */
    fun checkPassword(password: String, userId: Int): Boolean {
        val user = userRepository.findUserById(userId) ?: return false
        return user.pass != null && passwordEncoder.matches(password, user.pass!!)
    }

    /**
     * 获取所有用户
     */
    fun getAllUsers(): List<User> {
        return userRepository.findAll()
    }

    /**
     * 授予用户权限
     */
    @Transactional
    fun grantAuthority(uid: Int, roleName: String): Boolean {
        return try {
            val role = roleRepository.findRoleByName(roleName) ?: return false
            val user = userRepository.findUserById(uid) ?: return false
            user.role = role
            userRepository.save(user)
            true
        } catch (e: Exception) {
            logger.error("授予用户权限失败 UID: $uid")
            e.printStackTrace()
            false
        }
    }

    /**
     * 检查用户名是否已存在
     */
    fun exists(username: String): Boolean {
        return userRepository.existsUserByName(username)
    }

    /**
     * 用户注册
     */
    @Transactional
    fun register(username: String, password: String): Boolean {
        return try {
            // 检查用户名是否已存在
            if (exists(username)) {
                return false
            }

            // 获取默认用户角色
            val defaultRole = roleRepository.findRoleByName("user") ?: return false

            // 创建用户并加密密码
            val user = User().apply {
                this.name = username
                this.pass = passwordEncoder.encode(password)
                this.role = defaultRole
            }

            userRepository.save(user)
            true
        } catch (e: Exception) {
            logger.error("用户注册失败 用户名: $username")
            e.printStackTrace()
            false
        }
    }

    /**
     * 删除用户
     */
    @Transactional
    fun delete(id: Int): Boolean {
        return try {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            logger.error("删除用户失败 UID: $id")
            e.printStackTrace()
            false
        }
    }

    /**
     * 搜索用户
     */
    fun getQueriedUsers(username: String): List<User> {
        return userRepository.findByNameContaining(username)
    }
}