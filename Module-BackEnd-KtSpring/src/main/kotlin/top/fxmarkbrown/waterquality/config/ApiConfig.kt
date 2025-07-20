package top.fxmarkbrown.waterquality.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration

/**
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/20
 **/
@Configuration
class ApiConfig {
    @Value("\${api.base-url}")
    lateinit var baseUrl: String
}