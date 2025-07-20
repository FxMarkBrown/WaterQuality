package top.fxmarkbrown.waterquality.reponsitory

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.Repository
import top.fxmarkbrown.waterquality.model.User

/**
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
interface UserRepository : JpaRepository<User, Int> {
    fun findUserByName(name: String): User?
    fun findByNameContaining(name: String): List<User>

    fun findUserById(id: Int?): User?

    fun existsUserByName(username: String): Boolean
}