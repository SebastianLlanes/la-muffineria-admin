import { useState } from 'react'
import { usePartidas } from '../../contexts/PartidasContext'
import { usePedidos } from '../../contexts/PedidosContext'
import { eliminarPartida } from '../../firebase/partidasService'
import PartidaForm from './components/PartidaForm'
import styles from './PartidasPage.module.css'

function formatFecha(valor) {
  if (!valor) return '—'
  if (valor?.toDate) {
    const d = valor.toDate()
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  if (typeof valor === 'string') {
    const [y, m, d] = valor.split('-')
    return `${d}/${m}/${y}`
  }
  return '—'
}

const ESTADOS_ACTIVOS = ['pendiente', 'en_preparacion']

export default function PartidasPage() {
  const { partidas, loading } = usePartidas();
  const { pedidos } = usePedidos();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // Agrupar pedidos activos por fechaEntrega para planificar hornadas
  const hornadas = pedidos
    .filter(
      (p) => ESTADOS_ACTIVOS.includes(p.estado) && (p.fechaEntrega || p.fecha),
    )
    .reduce((acc, pedido) => {
      const raw = pedido.fechaEntrega || pedido.fecha;
      const fecha = raw?.toDate
        ? raw.toDate().toISOString().split("T")[0]
        : raw || "";
      if (!fecha) return acc;
      if (!acc[fecha]) acc[fecha] = { pedidos: [], recetas: {} };
      acc[fecha].pedidos.push(pedido);
      pedido.items?.forEach(it => {
  const nombre = it.recetaNombre || it.name || '—'
  const cantidad = Number(it.cantidad || it.quantity || 0)
  acc[fecha].recetas[nombre] = (acc[fecha].recetas[nombre] || 0) + cantidad
      });
      return acc;
    }, {});

  const hornadasOrdenadas = Object.entries(hornadas).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  function abrirNueva() {
    setItemEditar(null);
    setModalAbierto(true);
  }
  function abrirEditar(item) {
    setItemEditar(item);
    setModalAbierto(true);
  }
  function cerrarModal() {
    setModalAbierto(false);
    setItemEditar(null);
  }

  async function handleEliminar(id) {
    await eliminarPartida(id);
    setConfirmId(null);
  }

  if (loading) return <p className={styles.loading}>Cargando partidas...</p>;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Partidas de producción</h2>
          <p className={styles.subtitle}>
            {partidas.length} partidas registradas
          </p>
        </div>
        <button className={styles.addBtn} onClick={abrirNueva}>
          + Nueva partida
        </button>
      </div>

      {/* Planificador de hornadas */}
      {hornadasOrdenadas.length > 0 && (
        <div className={styles.planificador}>
          <h3 className={styles.planificadorTitle}>🔥 Hornadas pendientes</h3>
          <p className={styles.planificadorSubtitle}>
            Pedidos en estado <em>pendiente</em> o <em>en preparación</em>,
            agrupados por fecha de entrega
          </p>
          <div className={styles.hornadasGrid}>
            {hornadasOrdenadas.map(([fecha, data]) => {
              const totalUnidades = Object.values(data.recetas).reduce(
                (a, b) => a + b,
                0,
              );
              return (
                <div key={fecha} className={styles.hornadaCard}>
                  <div className={styles.hornadaHeader}>
                    <span className={styles.hornadaFecha}>
                      📅 {formatFecha(fecha)}
                    </span>
                    <span className={styles.hornadaBadge}>
                      {data.pedidos.length} pedido
                      {data.pedidos.length !== 1 ? "s" : ""} · {totalUnidades}{" "}
                      u.
                    </span>
                  </div>
                  <ul className={styles.hornadaRecetas}>
                    {Object.entries(data.recetas).map(([nombre, cantidad]) => (
                      <li key={nombre} className={styles.hornadaRecetaRow}>
                        <span>{nombre}</span>
                        <strong>{cantidad} u.</strong>
                      </li>
                    ))}
                  </ul>
                  <p className={styles.hornadaClientes}>
                    🛒 {data.pedidos.map((p) => p.cliente).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {partidas.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay partidas registradas.</p>
          <button className={styles.addBtn} onClick={abrirNueva}>
            Registrar la primera
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Receta</th>
                <th>Unidades</th>
                <th>Costo total</th>
                <th>Por unidad</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((p) => (
                <tr key={p.id}>
                  <td>{formatFecha(p.fecha)}</td>
                  <td className={styles.recetaNombre}>{p.recetaNombre}</td>
                  <td>{p.cantidadProducida}</td>
                  <td>${p.costoTotal?.toFixed(2)}</td>
                  <td className={styles.costo}>
                    ${p.costoPorUnidad?.toFixed(2)}
                  </td>
                  <td className={styles.notas}>{p.notas || "—"}</td>
                  <td className={styles.acciones}>
                    <button
                      className={styles.editBtn}
                      onClick={() => abrirEditar(p)}
                    >
                      Editar
                    </button>
                    {confirmId === p.id ? (
                      <>
                        <button
                          className={styles.confirmBtn}
                          onClick={() => handleEliminar(p.id)}
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
                        onClick={() => setConfirmId(p.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && <PartidaForm item={itemEditar} onClose={cerrarModal} />}
    </div>
  );
}