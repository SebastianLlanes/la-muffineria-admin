import { useState } from 'react'
import { useIngredientes } from '../../contexts/IngredientesContext'
import { eliminarIngrediente } from '../../firebase/ingredientesService'
import IngredienteForm from './components/IngredienteForm'
import styles from './IngredientesPage.module.css'

const TIPO_LABEL = {
  ingrediente: 'Ingrediente',
  costo_indirecto: 'Costo indirecto',
}

export default function IngredientesPage() {
  const { ingredientes, loading } = useIngredientes()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemEditar, setItemEditar] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [confirmId, setConfirmId] = useState(null)

  const listado = filtro === 'todos'
    ? ingredientes
    : ingredientes.filter(i => i.tipo === filtro)

  function abrirNuevo() {
    setItemEditar(null)
    setModalAbierto(true)
  }

  function abrirEditar(item) {
    setItemEditar(item)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setItemEditar(null)
  }

  async function handleEliminar(id) {
    await eliminarIngrediente(id)
    setConfirmId(null)
  }

  const totalIndirectos = ingredientes
    .filter(i => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  if (loading) return <p className={styles.loading}>Cargando ingredientes...</p>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Ingredientes</h2>
          <p className={styles.subtitle}>{ingredientes.length} ítems registrados</p>
        </div>
        <button className={styles.addBtn} onClick={abrirNuevo}>
          + Nuevo
        </button>
      </div>

      {totalIndirectos > 0 && (
        <div className={styles.infoCard}>
          <span>📦 Costos indirectos por unidad producida:</span>
          <strong>${totalIndirectos.toFixed(2)}</strong>
        </div>
      )}

      <div className={styles.filtros}>
        {['todos', 'ingrediente', 'costo_indirecto'].map(f => (
          <button
            key={f}
            className={`${styles.filtroBtn} ${filtro === f ? styles.filtroActivo : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'todos' ? 'Todos' : TIPO_LABEL[f]}
          </button>
        ))}
      </div>

      {listado.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay ítems en esta categoría.</p>
          <button className={styles.addBtn} onClick={abrirNuevo}>Agregar el primero</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Unidad</th>
                <th>Costo ($)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listado.map(item => (
                <tr key={item.id}>
                  <td className={styles.nombre}>{item.nombre}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[item.tipo]}`}>
                      {TIPO_LABEL[item.tipo]}
                    </span>
                  </td>
                  <td>{item.unidad}</td>
                  <td>${Number(item.costoUnitario).toFixed(2)}</td>
                  <td className={styles.acciones}>
                    <button
                      className={styles.editBtn}
                      onClick={() => abrirEditar(item)}
                    >
                      Editar
                    </button>
                    {confirmId === item.id ? (
                      <>
                        <button
                          className={styles.confirmBtn}
                          onClick={() => handleEliminar(item.id)}
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
                        onClick={() => setConfirmId(item.id)}
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

      {modalAbierto && (
        <IngredienteForm item={itemEditar} onClose={cerrarModal} />
      )}
    </div>
  )
}