/**
 * Convierte un valor heterogéneo a Date.
 * Acepta Firestore Timestamp, Date nativa, o ISO string.
 * Retorna null si no se puede convertir.
 */
export function toDate(valor) {
  if (!valor) return null
  if (valor?.toDate) return valor.toDate()
  if (valor instanceof Date) return valor
  if (typeof valor === 'string') {
    const d = new Date(valor)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/**
 * Lunes de la semana actual a las 00:00 hs (hora local).
 * Domingo cuenta como último día de la semana anterior.
 */
export function getLunesSemanaActual() {
  const hoy = new Date()
  const dia = hoy.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() + diff)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

/**
 * Formatea una fecha a dd/mm/yyyy (es-AR).
 * Acepta Firestore Timestamp, Date, o ISO string ('YYYY-MM-DD').
 */
export function formatFecha(valor) {
  if (!valor) return '—'
  if (valor?.toDate) {
    return valor.toDate().toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }
  if (valor instanceof Date) {
    return valor.toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }
if (typeof valor === 'string') {
    const [y, m, d] = valor.split('-')
    if (!y || !m || !d) return '—'
    return `${d}/${m}/${y}`
  }
  return '—'
}

/**
 * Devuelve el rango temporal { desde, hasta } correspondiente al período seleccionado.
 * `desde` es inclusive, `hasta` es exclusive (último día + 1 a las 00:00).
 *
 * @param {'hoy'|'semana'|'mes'|'anio'|'todo'} periodo
 * @returns {{desde: Date|null, hasta: Date|null}}
 */
export function getRangoPeriodo(periodo) {
  const ahora = new Date()
  ahora.setHours(0, 0, 0, 0)

  switch (periodo) {
    case 'hoy': {
      const desde = new Date(ahora)
      const hasta = new Date(ahora)
      hasta.setDate(hasta.getDate() + 1)
      return { desde, hasta }
    }
    case 'semana': {
      const desde = getLunesSemanaActual()
      const hasta = new Date(desde)
      hasta.setDate(hasta.getDate() + 7)
      return { desde, hasta }
    }
    case 'mes': {
      const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      const hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
      return { desde, hasta }
    }
    case 'anio': {
      const desde = new Date(ahora.getFullYear(), 0, 1)
      const hasta = new Date(ahora.getFullYear() + 1, 0, 1)
      return { desde, hasta }
    }
    case 'todo':
    default:
      return { desde: null, hasta: null }
  }
}