package top.fxmarkbrown.waterquality.config

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.MediaType
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.AccessDeniedHandler
import org.springframework.security.web.authentication.AuthenticationFailureHandler
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler
import org.springframework.web.cors.CorsConfiguration
import top.fxmarkbrown.waterquality.service.UserService

/**
 * 网站安全性配置
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val userService: UserService,
    private val objectMapper: ObjectMapper,
    private val passwordEncoder: PasswordEncoder
) {
    @Bean
    fun authenticationManager(http: HttpSecurity): AuthenticationManager {
        val authenticationManagerBuilder = http.getSharedObject(
            AuthenticationManagerBuilder::class.java
        )
        authenticationManagerBuilder.userDetailsService(userService)
            .passwordEncoder(passwordEncoder)
        return authenticationManagerBuilder.build()
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { cors ->
                // 使用内置CORS配置，不再依赖自定义Filter
                cors.configurationSource {
                    val config = CorsConfiguration()
                    config.allowCredentials = true
                    config.addAllowedOriginPattern("*") // 生产环境应限制具体域名
                    config.addAllowedMethod("*")
                    config.addAllowedHeader("*")
                    config.maxAge = 1800L
                    config
                }
            }
            .csrf { it.disable() }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            }
            .authorizeHttpRequests { auth ->
                auth.requestMatchers("/status/**", "/user/register").permitAll()
                auth.requestMatchers(
                    "/waterquality/add",
                    "/waterquality/delete/*",
                    "/waterquality/update/*",
                    "/model/delete/*",
                    "/model/training"
                ).hasAnyRole("ADMIN", "VIP")
                auth.requestMatchers(
                    "/user/delete/*",
                    "/user/grant/*",
                    "/user/query"
                ).hasRole("ADMIN")
                auth.anyRequest().authenticated()
            }
            .formLogin { login ->
                login.loginPage("/status/noLogin")
                    .loginProcessingUrl("/login")
                    .usernameParameter("username")
                    .passwordParameter("password")
                    .successHandler(authenticationSuccessHandler())
                    .failureHandler(authenticationFailureHandler())
                    .permitAll()
            }
            .logout { logout ->
                logout.logoutSuccessHandler(logoutSuccessHandler())
                    .permitAll()
            }
            .exceptionHandling { exceptions ->
                exceptions.accessDeniedHandler(accessDeniedHandler())
            }

        return http.build()
    }

    private fun authenticationSuccessHandler() = AuthenticationSuccessHandler { _, response, _ ->
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.writer.write(objectMapper.writeValueAsString(mapOf("status" to "success")))
    }

    private fun authenticationFailureHandler() = AuthenticationFailureHandler { _, response, _ ->
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.status = HttpServletResponse.SC_UNAUTHORIZED
        response.writer.write(objectMapper.writeValueAsString(mapOf("status" to "failure")))
    }

    private fun logoutSuccessHandler() = LogoutSuccessHandler { _, response, _ ->
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.writer.write(objectMapper.writeValueAsString(mapOf("status" to "success")))
    }

    private fun accessDeniedHandler() = AccessDeniedHandler { _, response, _ ->
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.status = HttpServletResponse.SC_FORBIDDEN
        response.writer.write(objectMapper.writeValueAsString(mapOf("status" to "deny")))
    }
}