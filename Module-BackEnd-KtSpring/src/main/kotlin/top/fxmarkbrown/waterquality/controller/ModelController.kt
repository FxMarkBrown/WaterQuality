package top.fxmarkbrown.waterquality.controller

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
    fun trainModel(
        @RequestParam indicator: String,
        @RequestParam method: String,
        @RequestParam uid: Int
    ): Map<String, Any> {
        return modelService.trainModel(indicator.uppercase(), method.uppercase(), uid)
    }

    /**
     * 预测下个月
     */
    @GetMapping("/prediction")
    fun predictNextMonth(
        @RequestParam id: Int,
        @RequestParam indicator: String
    ): Map<String, Any> {
        return modelService.predictNextMonth(id, indicator)
    }

    /**
     * 调优模型
     */
    @GetMapping("/tuning")
    fun tuneModel(
        @RequestParam id: Int,
        @RequestParam method: String
    ): Map<String, Any> {
        return modelService.tuneModel(id, method)
    }

    /**
     * 获取可用模型
     */
    @GetMapping("/available")
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
    fun getAllModelsByTarget(@RequestParam indicator: String): List<String> {
        return modelService.getAllModelsByTarget(indicator)
    }

    /**
     * 删除模型
     */
    @PostMapping("/delete/{id}")
    fun deleteModel(@PathVariable id: Int): Map<String, Any> {
        return if (modelService.deleteModel(id)) {
            mapOf("status" to "success")
        } else {
            mapOf("status" to "failure")
        }
    }
}