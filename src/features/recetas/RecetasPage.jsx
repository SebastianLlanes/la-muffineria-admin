import { useState } from 'react'
import { useRecetas } from '../../contexts/RecetasContext'
import { eliminarReceta } from '../../firebase/recetasService'
import RecetaForm from './components/RecetaForm'
import styles from './RecetasPage.module.css'

export default function RecetasPage() {
  const { recetas, loading } = useRecetas()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  function abrirNueva() { setItemEditar(null); setModalAbierto(true) }
  function abrirEditar(item) { setItemEditar(item); setModalAbierto(true) }
  function cerrarModal() { setModalAbierto(false); setItemEditar(null) }

  async function handleEliminar(id) {
    await eliminarReceta(id)
    setConfirmId(null)
  }

  if (loading) return <p className={styles.loading}>Cargando recetas...</p>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Recetas</h2>
          <p className={styles.subtitle}>{recetas.length} recetas registradas</p>
        </div>
        <button className={styles.addBtn} onClick={abrirNueva}>+ Nueva receta</button>
      </div>

      {recetas.length === 0 ? (
        <div className={styles.empty}>
          <p>Todavía no hay recetas cargadas.</p>
          <button className={styles.addBtn} onClick={abrirNueva}>Crear la primera</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {recetas.map(receta => (
            <div key={receta.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{receta.nombre}</h3>
                <span className={styles.rendimiento}>
                  {receta.rendimiento} unidades
                </span>
              </div>

              {receta.descripcion && (
                <p className={styles.descripcion}>{receta.descripcion}</p>
              )}

              <div className={styles.ingredientesList}>
                {receta.ingredientes.map((ing, i) => (
                  <span key={i} className={styles.ingTag}>
                    {ing.nombre} ({ing.cantidad}{ing.unidad})
                  </span>
                ))}
              </div>

              <div className={styles.costos}>
                <div className={styles.costoRow}>
                  <span>Costo total</span>
                  <span>${receta.costoTotal?.toFixed(2)}</span>
                </div>
                <div className={`${styles.costoRow} ${styles.costoDestacado}`}>
                  <span>Por unidad</span>
                  <strong>${receta.costoPorUnidad?.toFixed(2)}</strong>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => abrirEditar(receta)}
                >
                  Editar
                </button>
                {confirmId === receta.id ? (
                  <>
                    <button
                      className={styles.confirmBtn}
                      onClick={() => handleEliminar(receta.id)}
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
                    onClick={() => setConfirmId(receta.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <RecetaForm item={itemEditar} onClose={cerrarModal} />
      )}
    </div>
  )
}