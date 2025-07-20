package top.fxmarkbrown.waterquality.model

import jakarta.persistence.*
import java.io.Serializable
import java.util.*

/**
 * 模型
 * Module-BackEnd-KtSpring
 * @author FxMarkBrown
 * @since 2025/06/14
 **/
@Entity
@Table(name = "model")
open class Model : Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Int? = null

    @ManyToOne
    @JoinColumn(name = "uid")
    open var user: User? = null

    open var name: String? = null
    open var target: String? = null
    open var method: String? = null
    open var date: Date? = null
    open var rmse: Float? = null

    override fun toString(): String {
        return "Model(id=$id, name=$name, target=$target, method=$method, date=$date, rmse=$rmse)"
    }
}