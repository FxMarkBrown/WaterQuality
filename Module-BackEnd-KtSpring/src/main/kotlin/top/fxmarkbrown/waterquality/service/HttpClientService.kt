package top.fxmarkbrown.waterquality.service

import cn.zhxu.okhttps.HTTP
import cn.zhxu.okhttps.jackson.JacksonMsgConvertor
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import top.fxmarkbrown.waterquality.config.ApiConfig

/**
 * 统一 HTTP 客户端(OkHttps 4.x)
 * @author FxMarkBrown
 * @since 2025/11/2
 */
@Service
class HttpClientService(
    apiConfig: ApiConfig
) {
    private val logger = LoggerFactory.getLogger(HttpClientService::class.java)

    private val http: HTTP = HTTP.builder()
        .addMsgConvertor(JacksonMsgConvertor())
        .baseUrl(apiConfig.baseUrl)
        .build()

    private val httpPlain: HTTP = HTTP.builder()
        .addMsgConvertor(JacksonMsgConvertor())
        .build()

    @Suppress("UNCHECKED_CAST")
    fun getJson(url: String): Map<String, Any>? {
        return try {
            val call = if (url.startsWith("http://") || url.startsWith("https://")) {
                httpPlain.sync(url)
            } else {
                http.sync(url)
            }
            val resp = call.get()
            if (!resp.isSuccessful) {
                logger.warn("HTTP 非成功响应, URL: {}", url)
                null
            } else {
                resp.body.toBean(Map::class.java) as Map<String, Any>?
            }
        } catch (e: Exception) {
            logger.error("发送HTTP请求错误 URL: $url", e)
            null
        }
    }
}

