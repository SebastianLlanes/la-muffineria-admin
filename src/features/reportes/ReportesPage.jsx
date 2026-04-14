import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { usePedidos } from '../../contexts/PedidosContext'
import { usePartidas } from '../../contexts/PartidasContext'
import styles from './ReportesPage.module.css'

function getLunesSemana(fecha) {
  const d = new Date(fecha + 'T00:00:00')
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function getInicioFin(periodo) {
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]

  if (periodo === 'semana') {
    const inicio = getLunesSemana(hoyStr)
    const fin = hoyStr
    return { inicio, fin }
  }

  if (periodo === 'mes') {
    const inicio = hoyStr.slice(0, 7) + '-01'
    const fin = hoyStr
    return { inicio, fin }
  }

  if (periodo === 'trimestre') {
    const d = new Date(hoy)
    d.setMonth(d.getMonth() - 3)
    return { inicio: d.toISOString().split('T')[0], fin: hoyStr }
  }

  return { inicio: '', fin: hoyStr }
}

function semanaLabel(lunesStr) {
  const [y, m, d] = lunesStr.split('-')
  return `${d}/${m}`
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FDFAF4',
  border: '1px solid #E2D5C3',
  borderRadius: 8,
  fontSize: 13,
}

export default function ReportesPage() {
  const { pedidos } = usePedidos()
  const { partidas } = usePartidas()
  const [periodo, setPeriodo] = useState('mes')

  const { inicio, fin } = getInicioFin(periodo)

  const pedidosFiltrados = useMemo(() =>
    pedidos.filter(p => p.fecha >= inicio && p.fecha <= fin),
    [pedidos, inicio, fin]
  )

  const partidasFiltradas = useMemo(() =>
    partidas.filter(p => p.fecha >= inicio && p.fecha <= fin),
    [partidas, inicio, fin]
  )

  // Métricas generales
  const totalVenta = pedidosFiltrados.reduce((a, p) => a + (p.totalVenta || 0), 0)
  const totalCosto = pedidosFiltrados.reduce((a, p) => a + (p.totalCosto || 0), 0)
  const totalGanancia = pedidosFiltrados.reduce((a, p) => a + (p.totalGanancia || 0), 0)
  const margenPromedio = totalVenta > 0 ? (totalGanancia / totalVenta) * 100 : 0
  const totalUnidades = partidasFiltradas.reduce((a, p) => a + (p.cantidadProducida || 0), 0)

  // Por tipo de cliente
  const particulares = pedidosFiltrados.filter(p => (p.tipoCliente || 'particular') === 'particular')
  const revendedores = pedidosFiltrados.filter(p => p.tipoCliente === 'revendedor')

  const ventaParticulares = particulares.reduce((a, p) => a + (p.totalVenta || 0), 0)
  const gananciaParticulares = particulares.reduce((a, p) => a + (p.totalGanancia || 0), 0)
  const margenParticulares = ventaParticulares > 0
    ? (gananciaParticulares / ventaParticulares) * 100 : 0

  const ventaRevendedores = revendedores.reduce((a, p) => a + (p.totalVenta || 0), 0)
  const gananciaRevendedores = revendedores.reduce((a, p) => a + (p.totalGanancia || 0), 0)
  const margenRevendedores = ventaRevendedores > 0
    ? (gananciaRevendedores / ventaRevendedores) * 100 : 0

  // Ganancia por semana
  const gananciaPorSemana = useMemo(() => {
    const mapa = {}
    pedidosFiltrados.forEach(p => {
      const lunes = getLunesSemana(p.fecha)
      if (!mapa[lunes]) mapa[lunes] = { semana: semanaLabel(lunes), ganancia: 0, venta: 0 }
      mapa[lunes].ganancia += p.totalGanancia || 0
      mapa[lunes].venta += p.totalVenta || 0
    })
    return Object.values(mapa).sort((a, b) => a.semana.localeCompare(b.semana))
  }, [pedidosFiltrados])

  // Productos más vendidos
  const productosMasVendidos = useMemo(() => {
    const mapa = {}
    pedidosFiltrados.forEach(p => {
      p.items?.forEach(it => {
        const nombre = it.recetaNombre || 'Sin nombre'
        if (!mapa[nombre]) mapa[nombre] = { nombre, unidades: 0, venta: 0 }
        mapa[nombre].unidades += it.cantidad || 0
        mapa[nombre].venta += (it.cantidad || 0) * (it.precioUnitario || 0)
      })
    })
    return Object.values(mapa)
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 6)
  }, [pedidosFiltrados])

  // Partidas por semana
  const partidasPorSemana = useMemo(() => {
    const mapa = {}
    partidasFiltradas.forEach(p => {
      const lunes = getLunesSemana(p.fecha)
      if (!mapa[lunes]) mapa[lunes] = { semana: semanaLabel(lunes), unidades: 0, partidas: 0 }
      mapa[lunes].unidades += p.cantidadProducida || 0
      mapa[lunes].partidas += 1
    })
    return Object.values(mapa).sort((a, b) => a.semana.localeCompare(b.semana))
  }, [partidasFiltradas])

  const periodos = [
    { key: 'semana',    label: 'Esta semana' },
    { key: 'mes',       label: 'Este mes' },
    { key: 'trimestre', label: 'Últimos 3 meses' },
  ]

  const hayDatos = pedidosFiltrados.length > 0

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Reportes</h2>
          <p className={styles.subtitle}>
            {pedidosFiltrados.length} pedidos en el período seleccionado
          </p>
        </div>
        <div className={styles.periodos}>
          {periodos.map(p => (
            <button
              key={p.key}
              className={`${styles.periodoBtn} ${periodo === p.key ? styles.periodoActivo : ''}`}
              onClick={() => setPeriodo(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hayDatos ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📊</span>
          <p>No hay pedidos registrados en este período.</p>
        </div>
      ) : (
        <>
          {/* Métricas generales */}
          <div className={styles.seccion}>
            <h3 className={styles.seccionTitle}>Resumen del período</h3>
            <div className={styles.metricasGrid}>
              <div className={styles.metricaCard}>
                <span className={styles.metricaLabel}>Pedidos</span>
                <span className={styles.metricaValor}>{pedidosFiltrados.length}</span>
              </div>
              <div className={styles.metricaCard}>
                <span className={styles.metricaLabel}>Total facturado</span>
                <span className={styles.metricaValor}>${totalVenta.toFixed(2)}</span>
              </div>
              <div className={styles.metricaCard}>
                <span className={styles.metricaLabel}>Costo total</span>
                <span className={styles.metricaValor}>${totalCosto.toFixed(2)}</span>
              </div>
              <div className={`${styles.metricaCard} ${styles.metricaDestacada}`}>
                <span className={styles.metricaLabel}>Ganancia total</span>
                <span className={styles.metricaValor}>${totalGanancia.toFixed(2)}</span>
              </div>
              <div className={styles.metricaCard}>
                <span className={styles.metricaLabel}>Margen promedio</span>
                <span className={styles.metricaValor}>{margenPromedio.toFixed(1)}%</span>
              </div>
              <div className={styles.metricaCard}>
                <span className={styles.metricaLabel}>Unidades horneadas</span>
                <span className={styles.metricaValor}>{totalUnidades}</span>
              </div>
            </div>
          </div>

          {/* Particular vs Revendedor */}
          <div className={styles.seccion}>
            <h3 className={styles.seccionTitle}>Por tipo de cliente</h3>
            <div className={styles.canalesGrid}>
              <div className={`${styles.canalCard} ${styles.canalParticular}`}>
                <div className={styles.canalHeader}>
                  <span className={styles.canalIcon}>👤</span>
                  <span className={styles.canalLabel}>Particulares</span>
                  <span className={styles.canalCount}>{particulares.length} pedidos</span>
                </div>
                <div className={styles.canalMetricas}>
                  <div className={styles.canalMetrica}>
                    <span>Facturado</span>
                    <strong>${ventaParticulares.toFixed(2)}</strong>
                  </div>
                  <div className={styles.canalMetrica}>
                    <span>Ganancia</span>
                    <strong>${gananciaParticulares.toFixed(2)}</strong>
                  </div>
                  <div className={styles.canalMetrica}>
                    <span>Margen</span>
                    <strong>{margenParticulares.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              <div className={`${styles.canalCard} ${styles.canalRevendedor}`}>
                <div className={styles.canalHeader}>
                  <span className={styles.canalIcon}>🏪</span>
                  <span className={styles.canalLabel}>Revendedores</span>
                  <span className={styles.canalCount}>{revendedores.length} pedidos</span>
                </div>
                <div className={styles.canalMetricas}>
                  <div className={styles.canalMetrica}>
                    <span>Facturado</span>
                    <strong>${ventaRevendedores.toFixed(2)}</strong>
                  </div>
                  <div className={styles.canalMetrica}>
                    <span>Ganancia</span>
                    <strong>${gananciaRevendedores.toFixed(2)}</strong>
                  </div>
                  <div className={styles.canalMetrica}>
                    <span>Margen</span>
                    <strong>{margenRevendedores.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ganancia por semana */}
          {gananciaPorSemana.length > 0 && (
            <div className={styles.seccion}>
              <h3 className={styles.seccionTitle}>Facturación y ganancia por semana</h3>
              <div className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={gananciaPorSemana}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D5C3" />
                    <XAxis
                      dataKey="semana"
                      tick={{ fontSize: 12, fill: '#8A7A70' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8A7A70' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => '$' + v}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => ['$' + value.toFixed(2)]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#8A7A70' }}
                    />
                    <Bar
                      dataKey="venta"
                      name="Facturado"
                      fill="#D4A853"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ganancia"
                      name="Ganancia"
                      fill="#6B7C45"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Productos más vendidos */}
          {productosMasVendidos.length > 0 && (
            <div className={styles.seccion}>
              <h3 className={styles.seccionTitle}>Productos más vendidos</h3>
              <div className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    layout="vertical"
                    data={productosMasVendidos}
                    margin={{ top: 0, right: 40, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D5C3" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#8A7A70' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      tick={{ fontSize: 12, fill: '#5C3D2E' }}
                      axisLine={false}
                      tickLine={false}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [value + ' unidades']}
                    />
                    <Bar
                      dataKey="unidades"
                      name="Unidades vendidas"
                      fill="#C4897A"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Producción por semana */}
          {partidasPorSemana.length > 0 && (
            <div className={styles.seccion}>
              <h3 className={styles.seccionTitle}>Producción por semana</h3>
              <div className={styles.chartCard}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={partidasPorSemana}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D5C3" />
                    <XAxis
                      dataKey="semana"
                      tick={{ fontSize: 12, fill: '#8A7A70' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8A7A70' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [
                        value,
                        name === 'unidades' ? 'Unidades horneadas' : 'Partidas'
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8A7A70' }} />
                    <Bar
                      dataKey="unidades"
                      name="Unidades"
                      fill="#5C3D2E"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="partidas"
                      name="Partidas"
                      fill="#C4897A"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}