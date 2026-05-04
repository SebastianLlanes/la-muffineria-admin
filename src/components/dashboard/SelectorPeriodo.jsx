import styles from './SelectorPeriodo.module.css'

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes' },
  { id: 'anio',   label: 'Año' },
  { id: 'todo',   label: 'Todo' },
]

/**
 * Pills para seleccionar el período de las métricas.
 *
 * @param {Object} props
 * @param {'hoy'|'semana'|'mes'|'anio'|'todo'} props.value
 * @param {(periodo: string) => void} props.onChange
 */
export default function SelectorPeriodo({ value, onChange }) {
  return (
    <div className={styles.contenedor} role="tablist" aria-label="Período">
      {PERIODOS.map(p => {
        const activo = p.id === value
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activo}
            className={`${styles.pill} ${activo ? styles.pillActiva : ''}`}
            onClick={() => onChange(p.id)}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}