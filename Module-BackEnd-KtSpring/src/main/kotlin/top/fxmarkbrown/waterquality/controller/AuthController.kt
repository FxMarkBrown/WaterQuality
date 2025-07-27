package top.fxmarkbrown.waterquality.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import top.fxmarkbrown.waterquality.service.AuthService

/**
 * 认证控制器
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/07/27
 **/
@RestController
@CrossOrigin(originPatterns = ["*"], allowCredentials = "true")
class AuthController(
    private val authService: AuthService
) {

    /**
     * 登录
     */
    @PostMapping("/login")
    fun login(@RequestParam username: String, @RequestParam password: String): ResponseEntity<Map<String, String>> {
        return if (authService.login(username, password)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
        }
    }

    /**
     * 注销
     */
    @GetMapping("/logout")
    fun logout(): ResponseEntity<Map<String, String>> {
        authService.logout()
        return ResponseEntity.ok(mapOf("status" to "success"))
    }
}