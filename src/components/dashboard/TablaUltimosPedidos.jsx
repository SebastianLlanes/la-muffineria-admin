import { formatFecha } from '../../utils/dateUtils'
import { ESTADOS, ESTADO_COLOR } from '../../constants/pedidos'
import styles from './TablaUltimosPedidos.module.css'

/**
 * Tabla con los últimos N pedidos.
 *
 * @param {Object} props
 * @param {Array} props.pedidos
 * @param {Function} [props.onVerTodos] - Callback del botón "Ver todos"
 */
export default function TablaUltimosPedidos({ pedidos, onVerTodos }) {
  if (!pedidos || pedidos.length === 0) return null

  return (
    <section className={styles.seccion}>
      <header className={styles.header}>
        <h3 className={styles.titulo}>Últimos pedidos</h3>
        {onVerTodos && (
          <button className={styles.verTodosBtn} onClick={onVerTodos}>
            Ver todos →
          </button>
        )}
      </header>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Ganancia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p => {
              const ganancia = p.totalGanancia ?? 0
              const estadoClass = styles[ESTADO_COLOR[p.estado] ?? 'estadoPendiente']
              return (
                <tr key={p.id}>
                  <td className={styles.clienteNombre}>{p.cliente}</td>
                  <td>{formatFecha(p.fecha)}</td>
                  <td>${(p.totalVenta ?? p.total ?? 0).toFixed(2)}</td>
                  <td className={ganancia >= 0 ? styles.positivo : styles.negativo}>
                    ${ganancia.toFixed(2)}
                  </td>
                  <td>
                    <span className={`${styles.estadoBadge} ${estadoClass}`}>
                      {ESTADOS[p.estado] ?? 'Nuevo (web)'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}