import styles from './MetricaCard.module.css'

const TONOS = {
  normal:    styles.tonoNormal,
  destacada: styles.tonoDestacada,
  alerta:    styles.tonoAlerta,
}

/**
 * Card de métrica reutilizable.
 *
 * @param {Object} props
 * @param {string} props.label       - Etiqueta superior (puede incluir emoji)
 * @param {string|number} props.valor - Valor principal a mostrar
 * @param {'normal'|'destacada'|'alerta'} [props.tono='normal']
 * @param {string} [props.icon]      - Emoji opcional al lado del label
 * @param {Function} [props.onClick] - Si está, la card se renderiza como <button>
 * @param {Object} [props.delta]     - Reservado para Día 5 (deltas vs período anterior). No se renderiza todavía.
 */
export default function MetricaCard({ label, valor, tono = 'normal', icon, onClick, delta }) {
  const className = `${styles.card} ${TONOS[tono] ?? TONOS.normal}`

  const contenido = (
    <>
      <span className={styles.label}>
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
        {label}
      </span>
      <span className={styles.valor}>{valor}</span>
      {/* delta: reservado para Día 5 */}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {contenido}
      </button>
    )
  }

  return <div className={className}>{contenido}</div>
}