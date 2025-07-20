package top.fxmarkbrown.waterquality.reponsitory

import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.Repository
import top.fxmarkbrown.waterquality.dto.WaterQualityDTO
import top.fxmarkbrown.waterquality.model.WaterQuality
import java.util.*

/**
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Suppress("JpaQlInspection")
interface WaterQualityRepository : JpaRepository<WaterQuality, Int> {
    fun findAllByOrderByDate(): List<WaterQuality>
    fun findAllByOrderByDateDesc(pageable: Pageable): List<WaterQuality>

    fun findByDateBetweenOrderByDate(start: Date, end: Date): List<WaterQuality>
    fun findByDateBetweenAndStationOrderByDate(start: Date, end: Date, station: Int): List<WaterQuality>

    @Query("SELECT DISTINCT station FROM WaterQuality")
    fun findAllStations(): List<Int>

    @Query(
        """
        SELECT FUNCTION('YEAR', w.date) as year, 
                FUNCTION('MONTH', w.date) as month, 
                CASE 
                   WHEN :indicator = 'PH' THEN AVG(w.phValue) 
                   WHEN :indicator = 'DO' THEN AVG(w.doValue) 
                   WHEN :indicator = 'NH3N' THEN AVG(w.nh3nValue)
                   ELSE NULL 
                END as avgIndicator 
                FROM WaterQuality w 
                WHERE w.station = :station 
                AND w.date >= :startDate 
                GROUP BY FUNCTION('YEAR', w.date), FUNCTION('MONTH', w.date) 
                ORDER BY year ASC, month ASC
        """
    )
    fun findMonthlyAverageByStationAndIndicator(station: Int, startDate: Date, indicator: String): List<Array<Any>>

    @Query(
        """
    SELECT DISTINCT FUNCTION('DATE_FORMAT', w.date, '%Y-%m-%d') AS puredate
    FROM WaterQuality w
    WHERE w.date >= :startDate
    ORDER BY FUNCTION('DATE_FORMAT', w.date, '%Y-%m-%d') ASC
        """
    )
    fun findLastDatesAsc(startDate: Date): List<String>

    @Query(
        """
        SELECT w FROM WaterQuality w
            WHERE w.date BETWEEN ?1 AND ?2
        """
    )
    fun findBySpecificDate(start: Date, end: Date): List<WaterQuality>
}