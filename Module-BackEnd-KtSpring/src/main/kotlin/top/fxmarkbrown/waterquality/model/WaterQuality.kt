package top.fxmarkbrown.waterquality.model

import jakarta.persistence.*
import java.io.Serializable
import java.util.*

/**
 * 水质
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Entity
@Table(name = "waterquality")
open class WaterQuality : Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Int? = null

    @Column(name = "PH")
    open var phValue: Float? = null
    @Column(name = "DO")
    open var doValue: Float? = null
    @Column(name = "NH3N")
    open var nh3nValue: Float? = null
    open var date: Date? = null
    open var station: Int? = null

    override fun toString(): String {
        return "WaterQuality(id=$id, ph=$phValue, do=$doValue, nh3n=$nh3nValue, date=$date, station=$station)"
    }
}