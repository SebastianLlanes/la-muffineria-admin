import { useState } from 'react'
import { usePartidas } from '../../contexts/PartidasContext'
import { eliminarPartida } from '../../firebase/partidasService'
import PartidaForm from './components/PartidaForm'
import styles from './PartidasPage.module.css'

function formatFecha(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function PartidasPage() {
  const { partidas, loading } = usePartidas()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  function abrirNueva() { setItemEditar(null); setModalAbierto(true) }
  function abrirEditar(item) { setItemEditar(item); setModalAbierto(true) }
  function cerrarModal() { setModalAbierto(false); setItemEditar(null) }

  async function handleEliminar(id) {
    await eliminarPartida(id)
    setConfirmId(null)
  }

  if (loading) return <p className={styles.loading}>Cargando partidas...</p>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Partidas de producción</h2>
          <p className={styles.subtitle}>{partidas.length} partidas registradas</p>
        </div>
        <button className={styles.addBtn} onClick={abrirNueva}>+ Nueva partida</button>
      </div>

      {partidas.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay partidas registradas.</p>
          <button className={styles.addBtn} onClick={abrirNueva}>Registrar la primera</button>
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
              {partidas.map(p => (
                <tr key={p.id}>
                  <td>{formatFecha(p.fecha)}</td>
                  <td className={styles.recetaNombre}>{p.recetaNombre}</td>
                  <td>{p.cantidadProducida}</td>
                  <td>${p.costoTotal?.toFixed(2)}</td>
                  <td className={styles.costo}>${p.costoPorUnidad?.toFixed(2)}</td>
                  <td className={styles.notas}>{p.notas || '—'}</td>
                  <td className={styles.acciones}>
                    <button className={styles.editBtn} onClick={() => abrirEditar(p)}>
                      Editar
                    </button>
                    {confirmId === p.id ? (
                      <>
                        <button className={styles.confirmBtn} onClick={() => handleEliminar(p.id)}>
                          Confirmar
                        </button>
                        <button className={styles.cancelBtn} onClick={() => setConfirmId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button className={styles.deleteBtn} onClick={() => setConfirmId(p.id)}>
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

      {modalAbierto && (
        <PartidaForm item={itemEditar} onClose={cerrarModal} />
      )}
    </div>
  )
}