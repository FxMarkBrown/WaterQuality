package top.fxmarkbrown.waterquality.reponsitory

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.Repository
import top.fxmarkbrown.waterquality.model.Role

/**
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
interface RoleRepository : JpaRepository<Role, Int> {
    fun findRoleByName(name: String): Role?
}