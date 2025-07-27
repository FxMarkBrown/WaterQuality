package top.fxmarkbrown.waterquality.controller

import cn.dev33.satoken.annotation.SaCheckLogin
import cn.dev33.satoken.annotation.SaCheckRole
import cn.dev33.satoken.annotation.SaMode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import top.fxmarkbrown.waterquality.model.Model
import top.fxmarkbrown.waterquality.service.ModelService

/**
 * 模型控制器
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@RestController
@RequestMapping("/model")
@CrossOrigin(originPatterns = ["*"], allowCredentials = "true")
class ModelController (
    private val modelService: ModelService
) {
    /**
     * 训练模型
     * @param indicator 指标
     * @param method 模型
     * @param uid 用户ID
     */
    @GetMapping("/training")
    @SaCheckRole(value = ["ADMIN", "VIP"], mode = SaMode.OR)
    fun trainModel(
        @RequestParam indicator: String,
        @RequestParam method: String,
        @RequestParam uid: Int
    ): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(modelService.trainModel(indicator.uppercase(), method.uppercase(), uid))
    }

    /**
     * 预测下个月
     */
    @GetMapping("/prediction")
    @SaCheckLogin
    fun predictNextMonth(
        @RequestParam id: Int,
        @RequestParam indicator: String
    ): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(modelService.predictNextMonth(id, indicator))
    }

    /**
     * 调优模型
     */
    @GetMapping("/tuning")
    @SaCheckLogin
    fun tuneModel(
        @RequestParam id: Int,
        @RequestParam method: String
    ): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(modelService.tuneModel(id, method))
    }

    /**
     * 获取可用模型
     */
    @GetMapping("/available")
    @SaCheckLogin
    fun getAvailableModel(
        @RequestParam indicator: String,
        @RequestParam method: String
    ): List<Model> {
        return if (method.equals("all", ignoreCase = true)) {
            modelService.getAvailableModel(indicator)
        } else {
            modelService.getAvailableModel(indicator, method)
        }
    }

    /**
     * 获取某个指标的所有可用模型
     */
    @GetMapping("/list")
    @SaCheckLogin
    fun getAllModelsByTarget(@RequestParam indicator: String): List<String> {
        return modelService.getAllModelsByTarget(indicator)
    }

    /**
     * 删除模型
     */
    @PostMapping("/delete/{id}")
    @SaCheckRole(value = ["ADMIN", "VIP"], mode = SaMode.OR)
    fun deleteModel(@PathVariable id: Int): ResponseEntity<Map<String, Any>> {
        return if (modelService.deleteModel(id)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
        }
    }
}