package top.fxmarkbrown.waterquality.dto

import com.fasterxml.jackson.annotation.JsonFormat
import java.util.Date

data class WaterQualityDTO(
    val phValue: Float,
    val doValue: Float,
    val nh3nValue: Float,
    @JsonFormat(pattern = "yyyy-MM-dd hh:mm:ss", timezone = "GMT+8")
    val date: Date,
    val station: Int
)