package top.fxmarkbrown.waterquality.model

import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.*

/**
 * 角色
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Entity
@Table(name = "role")
open class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Int? = null

    open var name: String? = null

    @JsonIgnore
    @OneToMany(cascade = [CascadeType.ALL], mappedBy = "role")
    open var users: MutableSet<User> = mutableSetOf()

    fun addUser(user: User) {
        users.add(user)
        user.role = this
    }

    fun removeUser(user: User) {
        users.remove(user)
        user.role = null
    }

    override fun toString(): String {
        return "Role(id=$id, name=$name)"
    }
}