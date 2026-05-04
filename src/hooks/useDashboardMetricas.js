// src/hooks/useDashboardMetricas.js
import { useMemo } from 'react'
import { toDate } from '../utils/dateUtils'

const ESTADO_COBRADO = 'cobrado'
const ESTADO_ENTREGADO = 'entregado'
const ESTADO_NUEVO = 'nuevo'
const ORIGEN_WEB = 'web'
const SIZE_GRANDE = 'grande'
const SIZE_MEDIANO = 'mediano'

const METRICAS_VACIAS = {
  pedidosDelPeriodo: [],
  ventaPeriodo: 0,
  gananciaPeriodo: 0,
  ticketPromedio: 0,
  margenPorcentaje: 0,
  itemsPorPedido: 0,
  muffinsGrandesPeriodo: 0,
  muffinsMedianosPeriodo: 0,
  mixGrandePorcentaje: 0,
  mixMedianoPorcentaje: 0,
  pedidosActivos: [],
  pedidosWebSinAtender: [],
  muffinsTotal: 0,
  muffinsGrandes: 0,
  muffinsMedianos: 0,
}

/**
 * Calcula todas las métricas del dashboard en una sola pasada sobre `pedidos`.
 *
 * @param {Array} pedidos - Lista completa de pedidos del context.
 * @param {Object} [rango] - Rango temporal para las métricas del período.
 * @param {Date} [rango.desde] - Inicio del período (inclusive). Si no viene, no acota por abajo.
 * @param {Date} [rango.hasta] - Fin del período (exclusive). Si no viene, no acota por arriba.
 * @returns {{
 *   pedidosDelPeriodo: Array, ventaPeriodo: number, gananciaPeriodo: number,
 *   ticketPromedio: number, margenPorcentaje: number, itemsPorPedido: number,
 *   pedidosActivos: Array, pedidosWebSinAtender: Array,
 *   muffinsTotal: number, muffinsGrandes: number, muffinsMedianos: number,
 * }}
 */
export function useDashboardMetricas(pedidos, rango) {
  const desde = rango?.desde
  const hasta = rango?.hasta

  return useMemo(() => {
    if (!Array.isArray(pedidos) || pedidos.length === 0) {
      return METRICAS_VACIAS
    }

    const pedidosDelPeriodo = []
    const pedidosActivos = []
    const pedidosWebSinAtender = []

    let ventaPeriodo = 0
    let gananciaPeriodo = 0
    let muffinsPeriodo = 0
    let muffinsGrandesPeriodo = 0
    let muffinsMedianosPeriodo = 0

    let muffinsTotal = 0
    let muffinsGrandes = 0
    let muffinsMedianos = 0

    for (const p of pedidos) {
      // --- Métricas del período (acotadas por desde/hasta) ---
      const f = toDate(p.fecha);
      const enRango = f && (!desde || f >= desde) && (!hasta || f < hasta);

      if (enRango) {
        pedidosDelPeriodo.push(p);
        ventaPeriodo += p.totalVenta || 0;
        gananciaPeriodo += p.totalGanancia || 0;
      }

      // --- Métricas globales (no dependen del rango) ---
      if (p.estado !== ESTADO_COBRADO && p.estado !== ESTADO_ENTREGADO) {
        pedidosActivos.push(p);
      }

      if (p.origen === ORIGEN_WEB && p.estado === ESTADO_NUEVO) {
        pedidosWebSinAtender.push(p);
      }

      // Iteración única sobre items: contadores históricos + muffins del período
// Iteración única sobre items: contadores históricos + del período
      const items = p.items || [];
      for (const item of items) {
        const cantidad = item.cantidad || 0;
        muffinsTotal += cantidad;
        if (item.size === SIZE_GRANDE) muffinsGrandes += cantidad;
        else if (item.size === SIZE_MEDIANO) muffinsMedianos += cantidad;
        if (enRango) {
          muffinsPeriodo += cantidad;
          if (item.size === SIZE_GRANDE) muffinsGrandesPeriodo += cantidad;
          else if (item.size === SIZE_MEDIANO) muffinsMedianosPeriodo += cantidad;
        }
      }
    }

const cantidadPeriodo = pedidosDelPeriodo.length;
    const ticketPromedio    = cantidadPeriodo > 0 ? ventaPeriodo / cantidadPeriodo : 0
    const margenPorcentaje  = ventaPeriodo > 0 ? (gananciaPeriodo / ventaPeriodo) * 100 : 0
    const itemsPorPedido    = cantidadPeriodo > 0 ? muffinsPeriodo / cantidadPeriodo : 0

    // Mix de tamaños: % sobre el total de muffins clasificados (grandes + medianos) del período
    const muffinsClasificadosPeriodo = muffinsGrandesPeriodo + muffinsMedianosPeriodo
    const mixGrandePorcentaje   = muffinsClasificadosPeriodo > 0
      ? (muffinsGrandesPeriodo / muffinsClasificadosPeriodo) * 100
      : 0
    const mixMedianoPorcentaje  = muffinsClasificadosPeriodo > 0
      ? (muffinsMedianosPeriodo / muffinsClasificadosPeriodo) * 100
      : 0

    return {
      pedidosDelPeriodo,
      ventaPeriodo,
      gananciaPeriodo,
      ticketPromedio,
      margenPorcentaje,
      itemsPorPedido,
      muffinsGrandesPeriodo,
      muffinsMedianosPeriodo,
      mixGrandePorcentaje,
      mixMedianoPorcentaje,
      pedidosActivos,
      pedidosWebSinAtender,
      muffinsTotal,
      muffinsGrandes,
      muffinsMedianos,
    }
  }, [pedidos, desde?.getTime(), hasta?.getTime()])
}