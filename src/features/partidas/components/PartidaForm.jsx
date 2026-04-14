import { useState, useEffect } from 'react'
import { useRecetas } from '../../../contexts/RecetasContext'
import { useIngredientes } from '../../../contexts/IngredientesContext'
import { agregarPartida, editarPartida } from '../../../firebase/partidasService'
import styles from './PartidaForm.module.css'

const hoy = () => new Date().toISOString().split('T')[0]

const vacía = {
  recetaId: '',
  fecha: hoy(),
  cantidadProducida: '',
  ingredientesUsados: [],
  notas: '',
}

export default function PartidaForm({ item, onClose }) {
  const { recetas } = useRecetas()
  const { ingredientes } = useIngredientes()
  const [form, setForm] = useState(vacía)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const costosIndirectos = ingredientes
    .filter(i => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  useEffect(() => {
    if (item) {
      setForm(item)
    }
  }, [item])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleRecetaChange(e) {
    const recetaId = e.target.value
    const receta = recetas.find(r => r.id === recetaId)
    if (!receta) return setForm(prev => ({ ...prev, recetaId: '', ingredientesUsados: [] }))

    setForm(prev => ({
      ...prev,
      recetaId,
      cantidadProducida: receta.rendimiento,
      ingredientesUsados: receta.ingredientes.map(ing => ({ ...ing })),
    }))
  }

  function handleCantidadIng(index, value) {
    const updated = [...form.ingredientesUsados]
    updated[index] = { ...updated[index], cantidad: value }
    setForm(prev => ({ ...prev, ingredientesUsados: updated }))
  }

  const costoIngredientes = form.ingredientesUsados.reduce((acc, ing) => {
    return acc + ((parseFloat(ing.cantidad) || 0) * ing.costoUnitario)
  }, 0)

  const cantidadProducida = parseInt(form.cantidadProducida) || 0
  const costoIndirectoTotal = costosIndirectos * cantidadProducida
  const costoTotal = costoIngredientes + costoIndirectoTotal
  const costoPorUnidad = cantidadProducida > 0 ? costoTotal / cantidadProducida : 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.recetaId) return setError('Seleccioná una receta')
    if (!form.cantidadProducida || cantidadProducida <= 0)
      return setError('Ingresá la cantidad producida')
    if (!form.fecha) return setError('Ingresá la fecha')

    setGuardando(true)
    try {
      const receta = recetas.find(r => r.id === form.recetaId)
      const datos = {
        recetaId: form.recetaId,
        recetaNombre: receta?.nombre || '',
        fecha: form.fecha,
        cantidadProducida,
        ingredientesUsados: form.ingredientesUsados.map(i => ({
          ...i,
          cantidad: parseFloat(i.cantidad),
        })),
        costoIngredientes,
        costoIndirectoTotal,
        costoTotal,
        costoPorUnidad,
        notas: form.notas.trim(),
      }
      if (item) {
        await editarPartida(item.id, datos)
      } else {
        await agregarPartida(datos)
      }
      onClose()
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{item ? 'Editar partida' : 'Nueva partida'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Receta base</label>
              <select
                className={styles.input}
                name="recetaId"
                value={form.recetaId}
                onChange={handleRecetaChange}
              >
                <option value="">Seleccionar receta...</option>
                {recetas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldSmall}>
              <label className={styles.label}>Fecha</label>
              <input
                className={styles.input}
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.fieldSmall}>
            <label className={styles.label}>Unidades producidas</label>
            <input
              className={styles.input}
              name="cantidadProducida"
              type="number"
              min="1"
              value={form.cantidadProducida}
              onChange={handleChange}
              placeholder="Ej: 24"
            />
          </div>

          {form.ingredientesUsados.length > 0 && (
            <div className={styles.seccion}>
              <p className={styles.label}>Ingredientes usados — ajustá si fue diferente a la receta</p>
              {form.ingredientesUsados.map((ing, index) => (
                <div key={index} className={styles.ingRow}>
                  <span className={styles.ingNombre}>{ing.nombre}</span>
                  <input
                    className={styles.ingCantidad}
                    type="number"
                    min="0"
                    step="0.01"
                    value={ing.cantidad}
                    onChange={e => handleCantidadIng(index, e.target.value)}
                  />
                  <span className={styles.ingUnidad}>{ing.unidad}</span>
                  <span className={styles.ingCosto}>
                    ${((parseFloat(ing.cantidad) || 0) * ing.costoUnitario).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Notas (opcional)</label>
            <input
              className={styles.input}
              name="notas"
              value={form.notas}
              onChange={handleChange}
              placeholder="Observaciones de la partida..."
            />
          </div>

          {cantidadProducida > 0 && (
            <div className={styles.resumen}>
              <div className={styles.resumenRow}>
                <span>Costo ingredientes</span>
                <strong>${costoIngredientes.toFixed(2)}</strong>
              </div>
              <div className={styles.resumenRow}>
                <span>Costos indirectos ({cantidadProducida} u.)</span>
                <strong>${costoIndirectoTotal.toFixed(2)}</strong>
              </div>
              <div className={`${styles.resumenRow} ${styles.resumenTotal}`}>
                <span>Costo total</span>
                <strong>${costoTotal.toFixed(2)}</strong>
              </div>
              <div className={`${styles.resumenRow} ${styles.resumenDestacado}`}>
                <span>Costo por unidad</span>
                <strong>${costoPorUnidad.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}