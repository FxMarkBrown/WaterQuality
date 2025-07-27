package top.fxmarkbrown.waterquality.controller

import cn.dev33.satoken.annotation.SaCheckLogin
import cn.dev33.satoken.annotation.SaCheckRole
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import top.fxmarkbrown.waterquality.dto.PasswordEditRequestDTO
import top.fxmarkbrown.waterquality.dto.RegistrationRequestDTO
import top.fxmarkbrown.waterquality.dto.RoleRequestDTO
import top.fxmarkbrown.waterquality.model.User
import top.fxmarkbrown.waterquality.service.UserService
import top.fxmarkbrown.waterquality.service.AuthService

/**
 * 用户控制器
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@RestController
@RequestMapping("/user")
@CrossOrigin(originPatterns = ["*"], allowCredentials = "true")
class UserController(
    private val userService: UserService,
    private val authService: AuthService
) {
    /**
     * 获取当前用户
     */
    @GetMapping("/current")
    @SaCheckLogin
    fun getCurrentUser(): User? {
        return authService.getCurrentUser()
    }

    /**
     * 更改密码
     */
    @PostMapping("/editPassword/{id}")
    @SaCheckLogin
    fun editPassword(
        @RequestBody request: PasswordEditRequestDTO,
        @PathVariable id: Int
    ): ResponseEntity<Map<String, String>> {
        return when {
            !userService.checkPassword(request.originPassword, id) -> ResponseEntity.badRequest().body(mapOf("status" to "error"))
            !userService.editPassword(request.newPassword, id) -> ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
            else -> ResponseEntity.ok(mapOf("status" to "success"))
        }
    }

    /**
     * 获取所有用户
     */
    @GetMapping("/all")
    @SaCheckLogin
    fun getAllUsers(): List<User> {
        return userService.getAllUsers()
    }

    /**
     * 鉴权
     */
    @PostMapping("/grant/{id}")
    @SaCheckRole("ADMIN")
    fun grantAuthority(
        @PathVariable id: Int,
        @RequestBody request: RoleRequestDTO
    ): ResponseEntity<Map<String, String>> {
        return if (userService.grantAuthority(id, request.roleName)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
        }
    }

    /**
     * 删除用户
     */
    @PostMapping("/delete/{id}")
    @SaCheckRole("ADMIN")
    fun delete(@PathVariable id: Int): ResponseEntity<Map<String, String>> {
        return if (userService.delete(id)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
        }
    }

    /**
     * 注册
     */
    @PostMapping("/register")
    fun register(@RequestBody request: RegistrationRequestDTO): ResponseEntity<Map<String, String>> {
        return when {
            userService.exists(request.username) -> ResponseEntity.badRequest().body(mapOf("status" to "duplicate"))
            !userService.register(request.username, request.password) -> ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
            else -> ResponseEntity.ok(mapOf("status" to "success"))
        }
    }

    /**
     * 查询用户
     */
    @GetMapping("/query")
    @SaCheckRole("ADMIN")
    fun getQueriedUsers(@RequestParam username: String): List<User> {
        return userService.getQueriedUsers(username)
    }
}