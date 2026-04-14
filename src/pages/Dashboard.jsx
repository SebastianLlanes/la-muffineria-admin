import { usePedidos } from '../contexts/PedidosContext'
import { usePartidas } from '../contexts/PartidasContext'
import { useRecetas } from '../contexts/RecetasContext'
import { useIngredientes } from '../contexts/IngredientesContext'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

const ESTADOS = {
  pendiente:      'Pendiente',
  en_preparacion: 'En preparación',
  listo:          'Listo para entregar',
  entregado:      'Entregado',
  cobrado:        'Cobrado',
}

const ESTADO_COLOR = {
  pendiente:      'estadoPendiente',
  en_preparacion: 'estadoPreparacion',
  listo:          'estadoListo',
  entregado:      'estadoEntregado',
  cobrado:        'estadoCobrado',
}

function getLunesSemanaActual() {
  const hoy = new Date()
  const dia = hoy.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() + diff)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

function formatFecha(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function Dashboard() {
  const { pedidos } = usePedidos()
  const { partidas } = usePartidas()
  const { recetas } = useRecetas()
  const { ingredientes } = useIngredientes()
  const navigate = useNavigate()

  const lunes = getLunesSemanaActual()
  const lunesStr = lunes.toISOString().split('T')[0]

  const pedidosSemana = pedidos.filter(p => p.fecha >= lunesStr)
  const gananciasSemana = pedidosSemana.reduce((acc, p) => acc + (p.totalGanancia || 0), 0)
  const ventaSemana = pedidosSemana.reduce((acc, p) => acc + (p.totalVenta || 0), 0)

  const pedidosActivos = pedidos.filter(p =>
    p.estado !== 'cobrado' && p.estado !== 'entregado'
  )

  const partidasSemana = partidas.filter(p => p.fecha >= lunesStr)
  const unidadesSemana = partidasSemana.reduce((acc, p) => acc + (p.cantidadProducida || 0), 0)

  const ultimosPedidos = [...pedidos].slice(0, 5)

  const modulos = [
    { path: '/ingredientes', icon: '🧂', label: 'Ingredientes', count: ingredientes.length, sub: 'ítems' },
    { path: '/recetas',      icon: '📋', label: 'Recetas',      count: recetas.length,      sub: 'recetas' },
    { path: '/partidas',     icon: '🏭', label: 'Partidas',     count: partidas.length,     sub: 'registradas' },
    { path: '/calculador',   icon: '🧮', label: 'Calculador',   count: null,                sub: 'proyectá costos' },
    { path: '/pedidos',      icon: '📦', label: 'Pedidos',      count: pedidosActivos.length, sub: 'activos' },
    { path: '/reportes',     icon: '📈', label: 'Reportes',     count: null,                sub: 'ver métricas' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.bienvenida}>
        <h2 className={styles.title}>🧁 La Muffinería</h2>
        <p className={styles.subtitle}>Panel de gestión interna</p>
      </div>

      {/* Métricas semana */}
      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Esta semana</h3>
        <div className={styles.metricasGrid}>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Pedidos realizados</span>
            <span className={styles.metricaValor}>{pedidosSemana.length}</span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Total facturado</span>
            <span className={styles.metricaValor}>${ventaSemana.toFixed(2)}</span>
          </div>
          <div className={`${styles.metricaCard} ${styles.metricaDestacada}`}>
            <span className={styles.metricaLabel}>Ganancia</span>
            <span className={styles.metricaValor}>${gananciasSemana.toFixed(2)}</span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Unidades horneadas</span>
            <span className={styles.metricaValor}>{unidadesSemana}</span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Pedidos activos</span>
            <span className={styles.metricaValor}>{pedidosActivos.length}</span>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Módulos</h3>
        <div className={styles.modulosGrid}>
          {modulos.map(m => (
            <button
              key={m.path}
              className={styles.moduloCard}
              onClick={() => navigate(m.path)}
            >
              <span className={styles.moduloIcon}>{m.icon}</span>
              <span className={styles.moduloLabel}>{m.label}</span>
              <span className={styles.moduloSub}>
                {m.count !== null ? `${m.count} ${m.sub}` : m.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Últimos pedidos */}
      {ultimosPedidos.length > 0 && (
        <div className={styles.seccion}>
          <div className={styles.seccionHeader}>
            <h3 className={styles.seccionTitle}>Últimos pedidos</h3>
            <button
              className={styles.verTodosBtn}
              onClick={() => navigate('/pedidos')}
            >
              Ver todos →
            </button>
          </div>
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
                {ultimosPedidos.map(p => (
                  <tr key={p.id}>
                    <td className={styles.clienteNombre}>{p.cliente}</td>
                    <td>{formatFecha(p.fecha)}</td>
                    <td>${p.totalVenta?.toFixed(2)}</td>
                    <td className={p.totalGanancia >= 0 ? styles.positivo : styles.negativo}>
                      ${p.totalGanancia?.toFixed(2)}
                    </td>
                    <td>
                      <span className={`${styles.estadoBadge} ${styles[ESTADO_COLOR[p.estado]]}`}>
                        {ESTADOS[p.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}