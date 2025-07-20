package top.fxmarkbrown.waterquality.controller

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
    fun getAllWaterQualities(): List<WaterQuality> {
        return waterQualityService.findAllWaterQualities()
    }

    /**
     * 更新信息
     */
    @PostMapping("/update/{id}")
    fun updateWaterQuality(
        @RequestBody waterQualityDTO: WaterQualityDTO,
        @PathVariable id: Int
    ): Map<String, String> {
        val waterQuality = WaterQuality().apply {
            this.id = id
            this.phValue = waterQualityDTO.phValue
            this.doValue = waterQualityDTO.doValue
            this.nh3nValue = waterQualityDTO.nh3nValue
            this.date = waterQualityDTO.date
            this.station = waterQualityDTO.station
        }
        return if (waterQualityService.updateWaterQuality(waterQuality)) {
            mapOf("status" to "success")
        } else {
            mapOf("status" to "fail")
        }
    }

    /**
     * 删除信息
     */
    @PostMapping("/delete/{id}")
    fun deleteWaterQuality(@PathVariable id: Int): Map<String, String> {
        return if (waterQualityService.deleteWaterQuality(id)) {
            mapOf("status" to "success")
        } else {
            mapOf("status" to "fail")
        }
    }

    /**
     * 获取所有地点
     */
    @GetMapping("/station")
    fun getAllStations(): List<Int> {
        return waterQualityService.getAllStations()
    }

    /**
     * 获取绘图所需的信息
     *
     * @return 两键Map ("waterquality" -> 水质信息, "dates" -> 日期)
     */
    @GetMapping("/plot")
    fun getDataForPlot(
        @RequestParam station: Int,
        @RequestParam period: Int,
        @RequestParam indicator: String
    ): Map<String, Any> {
        return waterQualityService.getDataForPlot(station, period, indicator)
    }

    /**
     * 获取近期信息
     * @param num 查询个数
     */
    @GetMapping("/recent")
    fun getRecentWaterQualities(@RequestParam num: Int): List<WaterQuality> {
        return waterQualityService.getRecentWaterQualities(num)
    }

    /**
     * 增加信息
     */
    @PostMapping("/add")
    fun addWaterQuality(@RequestBody waterQualityDTO: WaterQualityDTO): Map<String, String> {
        val waterQuality = WaterQuality().apply {
            this.phValue = waterQualityDTO.phValue
            this.doValue = waterQualityDTO.doValue
            this.nh3nValue = waterQualityDTO.nh3nValue
            this.date = waterQualityDTO.date
            this.station = waterQualityDTO.station
        }
        return if (waterQualityService.addWaterQuality(waterQuality)) {
            mapOf("status" to "success")
        } else {
            mapOf("status" to "failure")
        }
    }
}