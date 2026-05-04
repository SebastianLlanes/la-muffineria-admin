// src/hooks/useTendenciaSemanal.js
import { useMemo } from 'react'
import { toDate } from '../utils/dateUtils'

const SEMANAS_DEFAULT = 8

/**
 * Agrupa venta y ganancia por semana, hacia atrás desde hoy.
 *
 * @param {Array} pedidos
 * @param {number} [semanas=8] - Cantidad de semanas a generar (incluida la actual).
 * @returns {Array<{label: string, venta: number, ganancia: number}>}
 */
export function useTendenciaSemanal(pedidos, semanas = SEMANAS_DEFAULT) {
  return useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const buckets = []

    // Generar los lunes de las últimas N semanas
    for (let i = semanas - 1; i >= 0; i--) {
      const lunes = new Date(hoy)
      const dia = lunes.getDay()
      const diff = dia === 0 ? -6 : 1 - dia
      lunes.setDate(lunes.getDate() + diff - i * 7)
      lunes.setHours(0, 0, 0, 0)

      const proximoLunes = new Date(lunes)
      proximoLunes.setDate(proximoLunes.getDate() + 7)

      const dd = String(lunes.getDate()).padStart(2, '0')
      const mm = String(lunes.getMonth() + 1).padStart(2, '0')

      buckets.push({
        lunes,
        proximoLunes,
        label: `${dd}/${mm}`,
        venta: 0,
        ganancia: 0,
      })
    }

    if (Array.isArray(pedidos)) {
      for (const p of pedidos) {
        const f = toDate(p.fecha)
        if (!f) continue
        const semana = buckets.find(s => f >= s.lunes && f < s.proximoLunes)
        if (!semana) continue
        semana.venta    += p.totalVenta ?? p.total ?? 0
        semana.ganancia += p.totalGanancia ?? 0
      }
    }

    return buckets.map(({ label, venta, ganancia }) => ({ label, venta, ganancia }))
  }, [pedidos, semanas])
}