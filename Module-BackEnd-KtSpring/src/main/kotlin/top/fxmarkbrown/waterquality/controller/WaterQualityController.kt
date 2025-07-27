package top.fxmarkbrown.waterquality.controller

import cn.dev33.satoken.annotation.SaCheckLogin
import cn.dev33.satoken.annotation.SaCheckRole
import cn.dev33.satoken.annotation.SaMode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import top.fxmarkbrown.waterquality.dto.WaterQualityDTO
import top.fxmarkbrown.waterquality.model.WaterQuality
import top.fxmarkbrown.waterquality.service.WaterQualityService

/**
 * 水质控制器
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@RestController
@RequestMapping("/waterquality")
@CrossOrigin(originPatterns = ["*"], allowCredentials = "true")
class WaterQualityController(
    private val waterQualityService: WaterQualityService
) {

    /**
     * 查询水质
     * @param station 地点
     * @param startDate 开始时间
     * @param endDate 结束时间
     */
    @GetMapping("/query")
    @SaCheckLogin
    fun getQueriedWaterQualities(
        @RequestParam station: Int,
        @RequestParam startDate: String,
        @RequestParam endDate: String
    ): List<WaterQuality> {
        return waterQualityService.findQueriedWaterQualities(startDate, endDate, station)
    }

    /**
     * 查询所有信息
     */
    @GetMapping("/all")
    @SaCheckLogin
    fun getAllWaterQualities(): List<WaterQuality> {
        return waterQualityService.findAllWaterQualities()
    }

    /**
     * 更新信息
     */
    @PostMapping("/update/{id}")
    @SaCheckRole(value = ["ADMIN", "VIP"], mode = SaMode.OR)
    fun updateWaterQuality(
        @RequestBody waterQualityDTO: WaterQualityDTO,
        @PathVariable id: Int
    ): ResponseEntity<Map<String, String>> {
        val waterQuality = WaterQuality().apply {
            this.id = id
            this.phValue = waterQualityDTO.phValue
            this.doValue = waterQualityDTO.doValue
            this.nh3nValue = waterQualityDTO.nh3nValue
            this.date = waterQualityDTO.date
            this.station = waterQualityDTO.station
        }
        return if (waterQualityService.updateWaterQuality(waterQuality)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "fail"))
        }
    }

    /**
     * 删除信息
     */
    @PostMapping("/delete/{id}")
    @SaCheckRole(value = ["ADMIN", "VIP"], mode = SaMode.OR)
    fun deleteWaterQuality(@PathVariable id: Int): ResponseEntity<Map<String, String>> {
        return if (waterQualityService.deleteWaterQuality(id)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "fail"))
        }
    }

    /**
     * 获取所有地点
     */
    @GetMapping("/station")
    @SaCheckLogin
    fun getAllStations(): List<Int> {
        return waterQualityService.getAllStations()
    }

    /**
     * 获取绘图所需的信息
     *
     * @return 两键Map ("waterquality" -> 水质信息, "dates" -> 日期)
     */
    @GetMapping("/plot")
    @SaCheckLogin
    fun getDataForPlot(
        @RequestParam station: Int,
        @RequestParam period: Int,
        @RequestParam indicator: String
    ): ResponseEntity<Map<String, Any>> {
        return ResponseEntity.ok(waterQualityService.getDataForPlot(station, period, indicator))
    }

    /**
     * 获取近期信息
     * @param num 查询个数
     */
    @GetMapping("/recent")
    @SaCheckLogin
    fun getRecentWaterQualities(@RequestParam num: Int): List<WaterQuality> {
        return waterQualityService.getRecentWaterQualities(num)
    }

    /**
     * 增加信息
     */
    @PostMapping("/add")
    @SaCheckRole(value = ["ADMIN", "VIP"], mode = SaMode.OR)
    fun addWaterQuality(@RequestBody waterQualityDTO: WaterQualityDTO): ResponseEntity<Map<String, String>> {
        val waterQuality = WaterQuality().apply {
            this.phValue = waterQualityDTO.phValue
            this.doValue = waterQualityDTO.doValue
            this.nh3nValue = waterQualityDTO.nh3nValue
            this.date = waterQualityDTO.date
            this.station = waterQualityDTO.station
        }
        return if (waterQualityService.addWaterQuality(waterQuality)) {
            ResponseEntity.ok(mapOf("status" to "success"))
        } else {
            ResponseEntity.internalServerError().body(mapOf("status" to "failure"))
        }
    }
}