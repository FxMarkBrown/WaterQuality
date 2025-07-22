package top.fxmarkbrown.waterquality.service

import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import top.fxmarkbrown.waterquality.model.WaterQuality
import top.fxmarkbrown.waterquality.reponsitory.WaterQualityRepository
import java.math.BigDecimal
import java.math.RoundingMode
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.log

/**
 * 水质服务
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Service
class WaterQualityService(
    private val waterQualityRepository: WaterQualityRepository
) {
    /** 用于粗略查询的日期格式 **/
    private val simpleDateFormat: SimpleDateFormat = SimpleDateFormat("yyyy-MM-dd")
    /** 用于详细查询的日期格式 **/
    private val standardDateFormat: SimpleDateFormat = SimpleDateFormat("yyyy-MM-dd hh:mm:ss")

    private val logger = LoggerFactory.getLogger(WaterQualityService::class.java)

    /**
     * 查询所有水质数据（按日期排序）日期
     */
    fun findAllWaterQualities(): List<WaterQuality> {
        return waterQualityRepository.findAllByOrderByDate()
    }

    /**
     * 按间隔日期和监测站查询水质数据
     */
    fun findQueriedWaterQualities(startDateStr: String, endDateStr: String, station: Int): List<WaterQuality> {
        return try {
            val startDate = simpleDateFormat.parse(startDateStr)
            val endDate = simpleDateFormat.parse(endDateStr)

            if (station == -1) {
                waterQualityRepository.findByDateBetweenOrderByDate(startDate, endDate)
            } else {
                waterQualityRepository.findByDateBetweenAndStationOrderByDate(startDate, endDate, station)
            }
        } catch (e: ParseException) {
            logger.error("按日期间隔查询水质失败")
            e.printStackTrace()
            emptyList()
        }
    }

    /**
     * 更新水质数据
     */
    fun updateWaterQuality(waterQuality: WaterQuality): Boolean {
        return try {
            waterQualityRepository.save(waterQuality)
            true
        } catch (e: Exception) {
            logger.error("更新水质数据失败")
            e.printStackTrace()
            false
        }
    }

    /**
     * 删除水质数据
     */
    fun deleteWaterQuality(id: Int): Boolean {
        return try {
            waterQualityRepository.deleteById(id)
            true
        } catch (e: Exception) {
            logger.error("删除水质数据失败")
            e.printStackTrace()
            false
        }
    }

    /**
     * 添加水质数据
     */
    fun addWaterQuality(waterQuality: WaterQuality): Boolean {
        return try {
            waterQualityRepository.save(waterQuality)
            true
        } catch (e: Exception) {
            logger.error("添加水质数据失败")
            e.printStackTrace()
            false
        }
    }

    /**
     * 获取所有监测站编号
     */
    fun getAllStations(): List<Int> {
        return waterQualityRepository.findAllStations()
    }

    /**
     * 获取最近的水质数据
     */
    fun getRecentWaterQualities(num: Int): List<WaterQuality> {
        val pageable: Pageable = PageRequest.of(0, num)
        return waterQualityRepository.findAllByOrderByDateDesc(pageable)
    }

    /**
     * 获取特定日期的水质数据
     */
    private fun getWaterQualitiesBySpecificDate(dateStr: String): List<WaterQuality> {
        val startDateStr = "$dateStr 00:00:00"
        val endDateStr = "$dateStr 23:59:59"

        return try {
            val startDate = standardDateFormat.parse(startDateStr)
            val endDate = standardDateFormat.parse(endDateStr)
            waterQualityRepository.findBySpecificDate(startDate, endDate)
        } catch (e: ParseException) {
            logger.error("按特定日期查询水质失败")
            e.printStackTrace()
            emptyList()
        }
    }

    /**
     * 获取绘图数据
     * @return 近period年的数据，每个月的所有数据取平均
     */
    fun getDataForPlot(station: Int, period: Int, indicator: String): Map<String, Any> {
        val startDate = Calendar.getInstance().apply { add(Calendar.YEAR, -period) }.time
        val avgWaterQualities = waterQualityRepository.findMonthlyAverageByStationAndIndicator(station, startDate, indicator)

        val specWaterQualities = mutableListOf<Double>()
        val dates = mutableListOf<String>()

        avgWaterQualities.forEach { result ->
            val year = result[0] as Int
            val month = result[1] as Int
            val avgValue = (result[2] as Number?)?.toDouble() ?: return@forEach

            specWaterQualities.add(avgValue)
            dates.add("${year}-${month}")
        }

        return mapOf(
            "waterquality" to specWaterQualities,
            "dates" to dates
        )
    }

    /**
     * 获取下个月预测用的水质数据（暂时为6个月）
     */
    fun getPredictionDataByIndicator(indicator: String): Map<String, Any> {
        val calendar = Calendar.getInstance().apply { add(Calendar.MONTH, -6) }
        val dates = waterQualityRepository.findLastDatesAsc(calendar.time).toMutableList()
        val forPlot = mutableListOf<Float>()

        dates.forEach { dateStr ->
            val waterQualities = getWaterQualitiesBySpecificDate(dateStr)
            // 若同一天有多个则取平均
            val average = calculateAverageByIndicator(indicator, waterQualities)
            val bigDecimal = BigDecimal(average.toDouble()).setScale(2, RoundingMode.HALF_UP)
            forPlot.add(bigDecimal.toFloat())
        }

        return mapOf(
            "dates" to dates,
            "forPlot" to forPlot,
        )
    }

    /**
     * 计算指定指标的平均值
     */
    private fun calculateAverageByIndicator(indicator: String, waterQualities: List<WaterQuality>): Float {
        if (waterQualities.isEmpty()) return 0f

        return when (indicator.lowercase()) {
            "ph" -> (waterQualities.sumOf { it.phValue?.toDouble() ?: 0.0 } / waterQualities.size).toFloat()
            "do" -> (waterQualities.sumOf { it.doValue?.toDouble() ?: 0.0 } / waterQualities.size).toFloat()
            "nh3n" -> (waterQualities.sumOf { it.nh3nValue?.toDouble() ?: 0.0 } / waterQualities.size).toFloat()
            else -> 0f
        }
    }
}