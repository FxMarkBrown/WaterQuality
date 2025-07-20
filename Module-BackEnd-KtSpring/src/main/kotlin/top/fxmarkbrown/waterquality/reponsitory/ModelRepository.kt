package top.fxmarkbrown.waterquality.reponsitory

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.Repository
import top.fxmarkbrown.waterquality.model.Model

/**
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
interface ModelRepository : JpaRepository<Model, Int?> {
    fun findModelByTargetOrderByRmseAsc(target: String): List<Model>
    fun findModelByTargetAndMethodOrderByRmseAsc(target: String, method: String): List<Model>

    @Query("select distinct method from Model m where m.target = ?1")
    fun findAllModelsByTarget(target: String): List<String>

    fun findModelById(id: Int): Model?
}