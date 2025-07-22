package top.fxmarkbrown.waterquality.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.apache.hc.client5.http.impl.classic.HttpClients
import org.apache.hc.core5.http.io.entity.EntityUtils
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import top.fxmarkbrown.waterquality.config.ApiConfig
import top.fxmarkbrown.waterquality.model.Model
import top.fxmarkbrown.waterquality.reponsitory.ModelRepository
import top.fxmarkbrown.waterquality.reponsitory.UserRepository
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

/**
 * 模型服务
 * @author FxMarkBrown
 * @since 2025/06/14
 */
@Service
class ModelService(
    private val modelRepository: ModelRepository,
    private val userRepository: UserRepository,
    private val waterQualityService: WaterQualityService,
    private val apiConfig: ApiConfig
) {
    private val logger = LoggerFactory.getLogger(ModelService::class.java)
    private val objectMapper = ObjectMapper()
    private val httpClient = HttpClients.createDefault()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd")

    /********************************************** 训练 **********************************************/

    /**
     * 训练模型
     */
    @Suppress("UNCHECKED_CAST")
    fun trainModel(indicator: String, method: String, uid: Int): Map<String, Any> {
        val modelName = "${indicator}_${method}"
        val user = userRepository.findUserById(uid) ?: run {
            logger.error("未找到UID为 $uid 的用户")
            return mapOf("status" to "failure")
        }

        val model = Model().apply {
            this.date = Date()
            this.name = modelName
            this.target = indicator
            this.method = method
            this.user = user
        }

        return try {
            val savedModel = modelRepository.save(model)
            val modelId = savedModel.id ?: throw IllegalStateException("Model ID在保存后为空")

            val resp = requestTraining(modelId)
            if (resp["status"] == "failure") {
                logger.warn("训练失败，删除模型 $modelId")
                modelRepository.delete(savedModel)
                resp
            } else {
                val data = resp["data"] as Map<String, Any>
                val rmse = data["rmse"] as Double
                modelRepository.save(savedModel.apply { this.rmse = rmse.toFloat() })
                resp
            }
        } catch (e: Exception) {
            logger.error("训练模型时发生错误", e)
            modelRepository.delete(model)
            mapOf("status" to "failure")
        }
    }

    /**
     * 发送训练请求
     */
    private fun requestTraining(modelId: Int): Map<String, Any> {
        val url = "${apiConfig.baseUrl}training?model_id=$modelId"
        return parseTrainingResponse(sendFastAPIRequest(url))
    }

    /**
     * 解析训练响应结果
     */
    @Suppress("UNCHECKED_CAST")
    private fun parseTrainingResponse(response: String?): Map<String, Any> {
        if (response == null) {
            logger.error("训练返回为null")
            return mapOf("status" to "failure")
        }

        return try {
            val root = objectMapper.readValue<Map<String, Any>>(response)
            if (root["status"] == "failure") {
                logger.warn("训练失败: $response")
                mapOf("status" to "failure")
            } else {
                val data = root["data"] as Map<String, Any>
                mapOf(
                    "status" to "success",
                    "data" to mapOf(
                        "rmse" to data["rmse"] as Double,
                        "pred" to (data["pred"] as List<Any>).map { it as Double },
                        "real" to (data["real"] as List<Any>).map { it as Double }
                    )
                )
            }
        } catch (e: IOException) {
            logger.error("解析训练结果时发生错误", e)
            mapOf("status" to "failure")
        }
    }

    /********************************************** 预测 **********************************************/

    /**
     * 预测下个月数据
     */
    fun predictNextMonth(modelId: Int, indicator: String): Map<String, Any> {
        return requestPrediction(modelId, indicator)
    }

    /**
     * 发送下个月的水质预测请求
     */
    @Suppress("UNCHECKED_CAST")
    private fun requestPrediction(modelId: Int, indicator: String): Map<String, Any> {
        val dataMap = waterQualityService.getPredictionDataByIndicator(indicator)
        val forPlot = dataMap["forPlot"] as MutableList<Double>
        val dates = dataMap["dates"] as MutableList<String>

        // 向后顺延一个月
        val calendar = Calendar.getInstance().apply { add(Calendar.MONTH, 1) }
        // 转换为1-12
        val predictionMonth = calendar.get(Calendar.MONTH) + 1

        val url = "${apiConfig.baseUrl}prediction?model_id=$modelId&month=$predictionMonth"

        val jsonResp = sendFastAPIRequest(url)
        val resp = parsePredictionResponse(jsonResp).toMutableMap()

        if (resp["status"] == "success") {
            val data = resp["data"] as Map<String, Any>
            val prediction = data["pred"] as Double

            //向回传的数据添加下个月的预测值和日期
            forPlot.add(prediction)
            dates.add(dateFormat.format(calendar.time))

            return mapOf(
                "status" to "success",
                "forPlot" to forPlot,
                "pred" to prediction,
                "dates" to dates
            )
        }

        return mapOf(
            "status" to "failure"
        )
    }

    /**
     * 解析预测响应结果
     */
    private fun parsePredictionResponse(response: String?): Map<String, Any> {
        if (response == null) {
            logger.error("预测返回为null")
            return mapOf("status" to "failure")
        }

        return try {
            val resp = objectMapper.readValue<Map<String, Any>>(response)
            if (resp["status"] == "failure") {
                logger.warn("预测失败: $response")
                mapOf("status" to "failure")
            } else resp
        } catch (e: IOException) {
            logger.error("解析预测结果时发生错误", e)
            mapOf("status" to "failure")
        }
    }

    /********************************************** 调优 **********************************************/

    fun tuneModel(modelId: Int, method: String): Map<String, Any> {
       return requestTuning(modelId, method)
    }

    /**
     * 发送调优请求
     */
    private fun requestTuning(modelId: Int, method: String): Map<String, Any> {
        val url = "${apiConfig.baseUrl}tuning?model_id=$modelId&method=$method"
        val jsonResp = sendFastAPIRequest(url)
        return parseTuningResponse(jsonResp).toMutableMap()
    }

    /**
     * 解析调优响应结果
     */
    private fun parseTuningResponse(response: String?): Map<String, Any> {
        if (response == null) {
            logger.error("调优返回为null")
            return mapOf("status" to "failure")
        }

        return try {
            val resp = objectMapper.readValue<Map<String, Any>>(response)
            if (resp["status"] == "failure") {
                logger.warn("调优失败: $response")
                mapOf("status" to "failure")
            } else resp
        } catch (e: IOException) {
            logger.error("解析调优结果时发生错误", e)
            mapOf("status" to "failure")
        }
    }

    /********************************************** 其他 **********************************************/

    /**
     * 发送HTTP请求
     */
    private fun sendFastAPIRequest(url: String): String? {
        logger.info("向Python FastAPI发送请求 URL: $url")
        val httpGet = HttpGet(url)
        return try {
            httpClient.execute(httpGet) { response ->
                val statusCode = response.code
                if (statusCode !in 200..299) {
                    logger.warn("HTTP 错误: $statusCode, URL: $url")
                    null
                } else {
                    val entity = response.entity
                    EntityUtils.toString(entity, "UTF-8").trim()
                }
            }
        } catch (e: Exception) {
            logger.error("发送HTTP请求错误 URL: $url", e)
            null
        } finally {
            httpGet.abort()
        }
    }

    /**
     * 获取可用模型（按目标指标）
     */
    fun getAvailableModel(indicator: String): List<Model> {
        return modelRepository.findModelByTargetOrderByRmseAsc(indicator)
    }

    /**
     * 获取可用模型（按目标指标和方法）
     */
    fun getAvailableModel(indicator: String, method: String): List<Model> {
        return modelRepository.findModelByTargetAndMethodOrderByRmseAsc(indicator, method)
    }

    /**
     * 删除模型
     */
    fun deleteModel(id: Int): Boolean {
        try {
            modelRepository.findModelById(id)?.apply {
                modelRepository.delete(this)
                return true
            }
        } catch (_: Exception) {
            return false
        }

        return false
    }

    /**
     * 获取指定目标的所有模型方法
     */
    fun getAllModelsByTarget(target: String): List<String> {
        return modelRepository.findAllModelsByTarget(target)
    }
}