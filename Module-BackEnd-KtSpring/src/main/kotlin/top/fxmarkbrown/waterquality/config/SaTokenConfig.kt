package top.fxmarkbrown.waterquality.config

import cn.dev33.satoken.interceptor.SaInterceptor
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/**
 * Sa-Token 配置类
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/07/27
 **/
@Configuration
class SaTokenConfig : WebMvcConfigurer {

    /**
     * Sa-Token拦截器
     */
    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(SaInterceptor())
            .addPathPatterns("/**")
            // 开放访问权限
            .excludePathPatterns("/status/**", "/user/register", "/login", "/logout")
    }

    /**
     * 全局CORS配置
     */
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600)
    }
}