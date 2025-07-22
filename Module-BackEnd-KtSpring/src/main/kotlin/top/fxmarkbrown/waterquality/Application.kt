package top.fxmarkbrown.waterquality

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/**
* Module-BackEnd-KtSpring
* @author FxMarkBrown
* @since 2025/06/14
**/
@SpringBootApplication
class Application {
    companion object {
        @JvmStatic
        fun main(args: Array<String>) {
            runApplication<Application>(*args)
        }
    }
}