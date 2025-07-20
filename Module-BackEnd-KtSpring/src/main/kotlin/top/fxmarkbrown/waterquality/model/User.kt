package top.fxmarkbrown.waterquality.model

import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.*
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.io.Serializable

/**
 * 用户
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Entity
@Table(name = "user")
open class User : Serializable, UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Int? = null

    open var name: String? = null

    @JsonIgnore
    open var pass: String? = null

    @JsonIgnore
    @OneToMany(cascade = [CascadeType.ALL], mappedBy = "user")
    open var models: MutableSet<Model> = mutableSetOf()

    @ManyToOne
    @JoinColumn(name = "rid")
    open var role: Role? = null

    override fun getAuthorities(): Collection<GrantedAuthority> {
        return if (role != null) {
            listOf(SimpleGrantedAuthority("ROLE_${role!!.name}"))
        } else {
            emptyList()
        }
    }

    override fun getPassword(): String? = pass

    override fun getUsername(): String? = name

    override fun isAccountNonExpired(): Boolean = true

    override fun isAccountNonLocked(): Boolean = true

    override fun isCredentialsNonExpired(): Boolean = true

    override fun isEnabled(): Boolean = true

    fun addModel(model: Model) {
        models.add(model)
        model.user = this
    }

    fun removeModel(model: Model) {
        models.remove(model)
        model.user = null
    }

    override fun toString(): String {
        return "User(id=$id, username=$name)"
    }
}