// src/hooks/useUltimosPedidos.js
import { useMemo } from 'react'
import { toDate } from '../utils/dateUtils'

const CANTIDAD_DEFAULT = 5

/**
 * Devuelve los últimos N pedidos ordenados por fecha de creación
 * (con fallback a fecha del pedido) descendente.
 *
 * @param {Array} pedidos
 * @param {number} [n=5]
 * @returns {Array}
 */
export function useUltimosPedidos(pedidos, n = CANTIDAD_DEFAULT) {
  return useMemo(() => {
    if (!Array.isArray(pedidos) || pedidos.length === 0) return []

    return [...pedidos]
      .sort((a, b) => {
        const ta = toDate(a.creadoEn)?.getTime() ?? toDate(a.fecha)?.getTime() ?? 0
        const tb = toDate(b.creadoEn)?.getTime() ?? toDate(b.fecha)?.getTime() ?? 0
        return tb - ta
      })
      .slice(0, n)
  }, [pedidos, n])
}