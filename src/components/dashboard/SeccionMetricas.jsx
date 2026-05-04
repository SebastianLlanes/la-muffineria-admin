import styles from './SeccionMetricas.module.css'

/**
 * Wrapper de una sección con título y grilla de métricas.
 *
 * @param {Object} props
 * @param {string} props.titulo
 * @param {React.ReactNode} props.children       - Cards de la grilla
 * @param {React.ReactNode} [props.accion]       - Slot opcional al lado del título (botones tipo "Ver todos")
 * @param {boolean} [props.vacia=false]          - Si true, renderiza emptyState en vez de la grilla
 * @param {React.ReactNode} [props.emptyState]   - Contenido a mostrar cuando vacia es true
 */
export default function SeccionMetricas({ titulo, children, accion, vacia = false, emptyState }) {
  return (
    <section className={styles.seccion}>
      <header className={styles.header}>
        <h3 className={styles.titulo}>{titulo}</h3>
        {accion}
      </header>
      {vacia ? emptyState : <div className={styles.grid}>{children}</div>}
    </section>
  )
}