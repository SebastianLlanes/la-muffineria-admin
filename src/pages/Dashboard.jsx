import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePedidos } from '../contexts/PedidosContext'
import { usePartidas } from '../contexts/PartidasContext'
import { useRecetas } from '../contexts/RecetasContext'
import { useIngredientes } from '../contexts/IngredientesContext'
import { toDate, getRangoPeriodo } from '../utils/dateUtils'
import { useDashboardMetricas } from '../hooks/useDashboardMetricas'
import { useTendenciaSemanal } from '../hooks/useTendenciaSemanal'
import { useUltimosPedidos } from '../hooks/useUltimosPedidos'
import SelectorPeriodo from '../components/dashboard/SelectorPeriodo'
import SeccionMetricas from '../components/dashboard/SeccionMetricas'
import MetricaCard from '../components/dashboard/MetricaCard'
import TablaUltimosPedidos from '../components/dashboard/TablaUltimosPedidos'
import ChartTendencia from '../components/dashboard/ChartTendencia'
import styles from './Dashboard.module.css'

const LABELS_PERIODO = {
  hoy:    'Hoy',
  semana: 'Esta semana',
  mes:    'Este mes',
  anio:   'Este año',
  todo:   'Histórico',
}

export default function Dashboard() {
  const { pedidos, loading, error: pedidosError } = usePedidos()
  const { partidas } = usePartidas()
  const { recetas } = useRecetas()
  const { ingredientes } = useIngredientes()
  const navigate = useNavigate()

  const [periodo, setPeriodo] = useState('semana')
  const rango = useMemo(() => getRangoPeriodo(periodo), [periodo])

  const m = useDashboardMetricas(pedidos, rango)
  const tendencia = useTendenciaSemanal(pedidos)
  const ultimosPedidos = useUltimosPedidos(pedidos)
  const hayTendencia = tendencia.some(s => s.venta > 0)

  const unidadesPeriodo = useMemo(() => {
    if (!Array.isArray(partidas)) return 0
    return partidas.reduce((acc, p) => {
      const f = toDate(p.fecha)
      if (!f) return acc
      if (rango.desde && f < rango.desde) return acc
      if (rango.hasta && f >= rango.hasta) return acc
      return acc + (p.cantidadProducida || 0)
    }, 0)
  }, [partidas, rango])

  const modulos = [
    { path: '/ingredientes', icon: '🧂', label: 'Ingredientes', count: ingredientes.length, sub: 'ítems' },
    { path: '/recetas',      icon: '📋', label: 'Recetas',      count: recetas.length,      sub: 'recetas' },
    { path: '/partidas',     icon: '🏭', label: 'Partidas',     count: partidas.length,     sub: 'registradas' },
    { path: '/calculador',   icon: '🧮', label: 'Calculador',   count: null,                sub: 'proyectá costos' },
    { path: '/pedidos',      icon: '📦', label: 'Pedidos',      count: m.pedidosActivos.length, sub: 'activos' },
    { path: '/reportes',     icon: '📈', label: 'Reportes',     count: null,                sub: 'ver métricas' },
  ]

  const sinPedidos = !loading && !pedidosError && m.pedidosDelPeriodo.length === 0

  const emptyState = (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>📭</span>
      <h4 className={styles.emptyTitle}>Sin pedidos en este período</h4>
      <p className={styles.emptyText}>
        Cuando registres el primero, vas a ver acá las métricas.
      </p>
      <button className={styles.emptyAction} onClick={() => navigate('/pedidos')}>
        Ir a Pedidos
      </button>
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.bienvenida}>
        <h2 className={styles.title}>🧁 La Muffinería</h2>
        <p className={styles.subtitle}>Panel de gestión interna</p>
      </header>

      <SelectorPeriodo value={periodo} onChange={setPeriodo} />

      {pedidosError && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorIcon}>⚠️</span>
          <div className={styles.errorContent}>
            <strong>No se pudieron cargar los pedidos</strong>
            <span className={styles.errorMensaje}>
              {pedidosError.message || 'Error de conexión con Firestore. Reintentando…'}
            </span>
          </div>
        </div>
      )}

      <SeccionMetricas titulo={LABELS_PERIODO[periodo]} vacia={sinPedidos} emptyState={emptyState}>
        <MetricaCard label="Pedidos"            valor={m.pedidosDelPeriodo.length} />
        <MetricaCard label="Total facturado"    valor={`$${m.ventaPeriodo.toFixed(2)}`} />
        <MetricaCard label="Ganancia"           valor={`$${m.gananciaPeriodo.toFixed(2)}`} tono="destacada" />
        <MetricaCard label="Ticket promedio"    valor={`$${m.ticketPromedio.toFixed(2)}`} />
        <MetricaCard label="Margen"             valor={`${m.margenPorcentaje.toFixed(1)}%`} />
        <MetricaCard label="Muffins / pedido"   valor={m.itemsPorPedido.toFixed(1)} />
        <MetricaCard label="🔵 Mix grande"      valor={`${m.mixGrandePorcentaje.toFixed(0)}%`} />
        <MetricaCard label="🟡 Mix mediano"     valor={`${m.mixMedianoPorcentaje.toFixed(0)}%`} />
        <MetricaCard label="Unidades horneadas" valor={unidadesPeriodo} />
        <MetricaCard label="Pedidos activos"    valor={m.pedidosActivos.length} />
        {m.pedidosWebSinAtender.length > 0 && (
          <MetricaCard
            label="🔔 Web sin atender"
            valor={m.pedidosWebSinAtender.length}
            tono="alerta"
            onClick={() => navigate('/pedidos')}
          />
        )}
      </SeccionMetricas>

      <SeccionMetricas titulo="Muffins vendidos (histórico)">
        <MetricaCard label="🧁 Total"    valor={m.muffinsTotal} />
        <MetricaCard label="🔵 Grandes"  valor={m.muffinsGrandes} />
        <MetricaCard label="🟡 Medianos" valor={m.muffinsMedianos} />
      </SeccionMetricas>

      <section className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Módulos</h3>
        <div className={styles.modulosGrid}>
          {modulos.map(mod => (
            <button key={mod.path} className={styles.moduloCard} onClick={() => navigate(mod.path)}>
              <span className={styles.moduloIcon}>{mod.icon}</span>
              <span className={styles.moduloLabel}>{mod.label}</span>
              <span className={styles.moduloSub}>
                {mod.count !== null ? `${mod.count} ${mod.sub}` : mod.sub}
              </span>
            </button>
          ))}
        </div>
      </section>

      {hayTendencia && <ChartTendencia data={tendencia} />}

      {ultimosPedidos.length > 0 && (
        <TablaUltimosPedidos pedidos={ultimosPedidos} onVerTodos={() => navigate('/pedidos')} />
      )}
    </div>
  )
}