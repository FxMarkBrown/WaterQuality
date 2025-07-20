package top.fxmarkbrown.waterquality.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import top.fxmarkbrown.waterquality.service.UserService

/**
 * 未登入错误控制器
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@RestController
@RequestMapping("/status")
class ErrorController(
    private val userService: UserService
) {
    @GetMapping("/noLogin")
    fun noLogin(): Map<String, Any> {
        return mapOf(
            "status" to "noLogin"
        )
    }
}