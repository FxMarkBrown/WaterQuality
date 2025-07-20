package top.fxmarkbrown.waterquality.controller

import org.springframework.web.bind.annotation.*
import top.fxmarkbrown.waterquality.dto.PasswordEditRequestDTO
import top.fxmarkbrown.waterquality.dto.RegistrationRequestDTO
import top.fxmarkbrown.waterquality.dto.RoleRequestDTO
import top.fxmarkbrown.waterquality.model.User
import top.fxmarkbrown.waterquality.service.UserService

/**
 * 用户控制器
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@RestController
@RequestMapping("/user")
class UserController(
    private val userService: UserService
) {
    /**
     * 获取当前用户
     */
    @GetMapping("/current")
    fun getCurrentUser(): User {
        return userService.getCurrentUser()
    }

    /**
     * 更改密码
     */
    @PostMapping("/editPassword/{id}")
    fun editPassword(
        @RequestBody request: PasswordEditRequestDTO,
        @PathVariable id: Int
    ): Map<String, String> {
        return when {
            !userService.checkPassword(request.originPassword, id) -> mapOf("status" to "error")
            !userService.editPassword(request.newPassword, id) -> mapOf("status" to "failure")
            else -> mapOf("status" to "success")
        }
    }

    /**
     * 获取所有用户
     */
    @GetMapping("/all")
    fun getAllUsers(): List<User> {
        return userService.getAllUsers()
    }

    /**
     * 鉴权
     */
    @PostMapping("/grant/{id}")
    fun grantAuthority(
        @PathVariable id: Int,
        @RequestBody request: RoleRequestDTO
    ): Map<String, String> {
        return if (userService.grantAuthority(id, request.roleName)) {
            mapOf("status" to "success")
        } else {
            mapOf("status" to "failure")
        }
    }

    /**
     * 删除用户
     */
    @PostMapping("/delete/{id}")
    fun delete(@PathVariable id: Int): Map<String, String> {
        return if (userService.delete(id)) {
            mapOf("status" to "success")
        } else {
            mapOf("status" to "failure")
        }
    }

    /**
     * 注册
     */
    @PostMapping("/register")
    fun register(@RequestBody request: RegistrationRequestDTO): Map<String, String> {
        return when {
            userService.exists(request.username) -> mapOf("status" to "duplicate")
            !userService.register(request.username, request.password) -> mapOf("status" to "failure")
            else -> mapOf("status" to "success")
        }
    }

    /**
     * 查询用户
     */
    @GetMapping("/query")
    fun getQueriedUsers(@RequestParam username: String): List<User> {
        return userService.getQueriedUsers(username)
    }
}