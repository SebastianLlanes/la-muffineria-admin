import { useState } from 'react'
import { usePedidos } from '../../contexts/PedidosContext'
import { eliminarPedido, actualizarEstado } from '../../firebase/pedidosService'
import PedidoForm from './components/PedidoForm'
import styles from './PedidosPage.module.css'

const ESTADOS = {
  nuevo:           { label: 'Nuevo (web)',          color: 'estadoNuevo' },
  pendiente:       { label: 'Pendiente',           color: 'estadoPendiente' },
  en_preparacion:  { label: 'En preparación',      color: 'estadoPreparacion' },
  listo:           { label: 'Listo para entregar', color: 'estadoListo' },
  entregado:       { label: 'Entregado',           color: 'estadoEntregado' },
  cobrado:         { label: 'Cobrado',             color: 'estadoCobrado' },
}

const SIGUIENTE_ESTADO = {
  nuevo:          'pendiente',
  pendiente:      'en_preparacion',
  en_preparacion: 'listo',
  listo:          'entregado',
  entregado:      'cobrado',
}

const SIGUIENTE_LABEL = {
  nuevo:          'Confirmar pedido',
  pendiente:      'Iniciar preparación',
  en_preparacion: 'Marcar listo',
  listo:          'Marcar entregado',
  entregado:      'Marcar cobrado',
}

function formatFecha(valor) {
  if (!valor) return '—'

  // Timestamp de Firestore (pedidos de la web)
  if (valor?.toDate) {
    const d = valor.toDate()
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // String 'YYYY-MM-DD' (pedidos cargados desde el admin)
  if (typeof valor === 'string') {
    const [y, m, d] = valor.split('-')
    return `${d}/${m}/${y}`
  }

  return '—'
}

function formatHora(pedido) {
  const timestamp = pedido.creadoEn || pedido.fecha
  if (!timestamp?.toDate) return null
  const d = timestamp.toDate()
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function PedidosPage() {
  const { pedidos, loading } = usePedidos()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [busquedaFecha, setBusquedaFecha] = useState('')

  function abrirNuevo() { setItemEditar(null); setModalAbierto(true) }
  function abrirEditar(item) { setItemEditar(item); setModalAbierto(true) }
  function cerrarModal() { setModalAbierto(false); setItemEditar(null) }

  async function handleEliminar(id) {
    await eliminarPedido(id)
    setConfirmId(null)
  }

  async function handleAvanzarEstado(pedido) {
    const siguiente = SIGUIENTE_ESTADO[pedido.estado]
    if (siguiente) await actualizarEstado(pedido.id, siguiente)
  }

  const listado = pedidos
    .filter(p => filtroEstado === 'todos' || p.estado === filtroEstado)
    .filter(p => !busquedaNombre || p.cliente?.toLowerCase().includes(busquedaNombre.toLowerCase()))
    .filter(p => !busquedaFecha || p.fecha === busquedaFecha || p.fechaEntrega === busquedaFecha)

  // Métricas del encabezado
  const totalVenta = pedidos.reduce((acc, p) => acc + (p.totalVenta || 0), 0)
  const totalGanancia = pedidos.reduce((acc, p) => acc + (p.totalGanancia || 0), 0)
  const pendientes = pedidos.filter(p => p.estado !== 'cobrado').length

  if (loading) return <p className={styles.loading}>Cargando pedidos...</p>
  

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Pedidos</h2>
          <p className={styles.subtitle}>{pedidos.length} pedidos registrados</p>
        </div>
        <button className={styles.addBtn} onClick={abrirNuevo}>+ Nuevo pedido</button>
      </div>

      {/* Métricas rápidas */}
      {pedidos.length > 0 && (
        <div className={styles.metricas}>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Total facturado</span>
            <span className={styles.metricaValor}>${totalVenta.toFixed(2)}</span>
          </div>
          <div className={`${styles.metricaCard} ${styles.metricaGanancia}`}>
            <span className={styles.metricaLabel}>Ganancia total</span>
            <span className={styles.metricaValor}>${totalGanancia.toFixed(2)}</span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Sin cobrar</span>
            <span className={styles.metricaValor}>{pendientes}</span>
          </div>
        </div>
      )}

      {/* Búsqueda por nombre y fecha */}
      <div className={styles.busqueda}>
        <input
          type="text"
          className={styles.busquedaInput}
          placeholder="Buscar por cliente..."
          value={busquedaNombre}
          onChange={e => setBusquedaNombre(e.target.value)}
        />
        <input
          type="date"
          className={styles.busquedaInput}
          value={busquedaFecha}
          onChange={e => setBusquedaFecha(e.target.value)}
        />
        {(busquedaNombre || busquedaFecha) && (
          <button
            className={styles.limpiarBtn}
            onClick={() => { setBusquedaNombre(''); setBusquedaFecha('') }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filtros por estado */}
      <div className={styles.filtros}>
        <button
          className={`${styles.filtroBtn} ${filtroEstado === 'todos' ? styles.filtroActivo : ''}`}
          onClick={() => setFiltroEstado('todos')}
        >
          Todos ({pedidos.length})
        </button>
        {Object.entries(ESTADOS).map(([key, { label }]) => {
          const count = pedidos.filter(p => p.estado === key).length
          if (count === 0) return null
          return (
            <button
              key={key}
              className={`${styles.filtroBtn} ${filtroEstado === key ? styles.filtroActivo : ''}`}
              onClick={() => setFiltroEstado(key)}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {listado.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay pedidos en esta categoría.</p>
          <button className={styles.addBtn} onClick={abrirNuevo}>
            Registrar el primero
          </button>
        </div>
      ) : (
        <div className={styles.lista}>
          {listado.map(pedido => {
            const estado = ESTADOS[pedido.estado] || ESTADOS.pendiente
            const siguienteLabel = SIGUIENTE_LABEL[pedido.estado]
            const waLink = pedido.telefono
    ? 'https://wa.me/' + pedido.telefono.split('').filter(c => '0123456789'.includes(c)).join('')
    : ''

            return (
              <div key={pedido.id} className={styles.card}>
                {/* Header del card */}
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.clienteNombre}>{pedido.cliente}</h3>
                    {pedido.telefono && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.telefono}
                      >
                        📱 {pedido.telefono}
                      </a>
                    )}
                  </div>
                  <span
                    className={`${styles.estadoBadge} ${styles[estado.color]}`}
                  >
                    {estado.label}
                  </span>
                </div>

                {/* Fechas */}
                <div className={styles.fechas}>
                  <span>Pedido: {formatFecha(pedido.fecha)}</span>
                  {formatHora(pedido) && (
                    <span>🕐 {formatHora(pedido)}</span>
                  )}
                  {pedido.fechaEntrega && (
                    <span>Entrega: {formatFecha(pedido.fechaEntrega)}</span>
                  )}
                </div>

                {/* Items */}
                <div className={styles.items}>
                  {pedido.items?.map((it, i) => {
                    const nombre = it.nombre || "—";
                    const cantidad = it.cantidad || it.quantity || 0;
                    const precio =
                      it.precioUnitario != null
                        ? it.precioUnitario
                        : it.precio || 0;
                    return (
                      <div key={i} className={styles.itemRow}>
                        <span>{nombre}</span>
                        <span className={styles.itemDetalle}>
                          {cantidad} u. × ${parseFloat(precio).toFixed(2)}
                        </span>
                        <span className={styles.itemSubtotal}>
                          ${(cantidad * precio).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totales */}
                <div className={styles.totales}>
                  <div className={styles.totalRow}>
                    <span>Total venta</span>
                    <strong>
                      ${(pedido.totalVenta ?? pedido.total ?? 0).toFixed(2)}
                    </strong>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Ganancia</span>
                    <strong
                      className={
                        pedido.totalGanancia >= 0
                          ? styles.positivo
                          : styles.negativo
                      }
                    >
                      {pedido.totalGanancia >= 0 ? "+" : ""}$
                      {pedido.totalGanancia?.toFixed(2)}
                    </strong>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Margen</span>
                    <strong>{pedido.margen?.toFixed(1)}%</strong>
                  </div>
                </div>

                {pedido.notas && (
                  <p className={styles.notas}>📝 {pedido.notas}</p>
                )}

                {/* Acciones */}
                <div className={styles.cardActions}>
                  {siguienteLabel && pedido.estado !== "cobrado" && (
                    <button
                      className={styles.avanzarBtn}
                      onClick={() => handleAvanzarEstado(pedido)}
                    >
                      {siguienteLabel}
                    </button>
                  )}

                  <button
                    className={styles.editBtn}
                    onClick={() => abrirEditar(pedido)}
                  >
                    Editar
                  </button>

                  {confirmId === pedido.id ? (
                    <>
                      <button
                        className={styles.confirmBtn}
                        onClick={() => handleEliminar(pedido.id)}
                      >
                        Confirmar
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setConfirmId(pedido.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAbierto && (
        <PedidoForm item={itemEditar} onClose={cerrarModal} />
      )}
    </div>
  )
}