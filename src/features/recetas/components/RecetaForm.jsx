import { useState, useEffect } from 'react'
import { useIngredientes } from '../../../contexts/IngredientesContext'
import { agregarReceta, editarReceta } from '../../../firebase/recetasService'
import styles from './RecetaForm.module.css'

const vacía = {
  nombre: '',
  descripcion: '',
  rendimiento: '',
  ingredientes: [],
}

export default function RecetaForm({ item, onClose }) {
  const { ingredientes } = useIngredientes()
  const soloIngredientes = ingredientes.filter(i => i.tipo === 'ingrediente')

  const [form, setForm] = useState(vacía)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) setForm(item)
  }, [item])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function agregarIngrediente() {
    setForm(prev => ({
      ...prev,
      ingredientes: [
        ...prev.ingredientes,
        { ingredienteId: '', nombre: '', cantidad: '', unidad: '', costoUnitario: 0 }
      ]
    }))
  }

  function handleIngredienteChange(index, field, value) {
    const updated = [...form.ingredientes]

    if (field === 'ingredienteId') {
      const ing = soloIngredientes.find(i => i.id === value)
      if (ing) {
        updated[index] = {
          ingredienteId: ing.id,
          nombre: ing.nombre,
          unidad: ing.unidad,
          costoUnitario: ing.costoUnitario,
          cantidad: updated[index].cantidad,
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }

    setForm(prev => ({ ...prev, ingredientes: updated }))
  }

  function quitarIngrediente(index) {
    setForm(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index)
    }))
  }

  // Costos indirectos del contexto
  const costosIndirectos = ingredientes
    .filter(i => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  const costoIngredientes = form.ingredientes.reduce((acc, ing) => {
    const cantidad = parseFloat(ing.cantidad) || 0
    return acc + (cantidad * ing.costoUnitario)
  }, 0)

  const rendimiento = parseInt(form.rendimiento) || 0
  const costoIndirectoTotal = costosIndirectos * rendimiento
  const costoTotal = costoIngredientes + costoIndirectoTotal
  const costoPorUnidad = rendimiento > 0 ? costoTotal / rendimiento : 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.rendimiento || form.rendimiento <= 0)
      return setError('El rendimiento debe ser mayor a 0')
    if (form.ingredientes.length === 0)
      return setError('Agregá al menos un ingrediente')
    if (form.ingredientes.some(i => !i.ingredienteId || !i.cantidad))
      return setError('Completá todos los ingredientes')

    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        rendimiento: parseInt(form.rendimiento),
        ingredientes: form.ingredientes.map(i => ({
          ...i,
          cantidad: parseFloat(i.cantidad),
        })),
        costoIngredientes,
        costoIndirectoTotal,
        costoTotal,
        costoPorUnidad,
      }
      if (item) {
        await editarReceta(item.id, datos)
      } else {
        await agregarReceta(datos)
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
          <h3>{item ? 'Editar receta' : 'Nueva receta'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre</label>
              <input
                className={styles.input}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Muffin de chocolate"
                autoFocus
              />
            </div>
            <div className={styles.fieldSmall}>
              <label className={styles.label}>Rinde (unidades)</label>
              <input
                className={styles.input}
                name="rendimiento"
                type="number"
                min="1"
                value={form.rendimiento}
                onChange={handleChange}
                placeholder="12"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción (opcional)</label>
            <input
              className={styles.input}
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Notas sobre la receta..."
            />
          </div>

          <div className={styles.seccion}>
            <div className={styles.seccionHeader}>
              <span className={styles.label}>Ingredientes</span>
              <button
                type="button"
                className={styles.addIngBtn}
                onClick={agregarIngrediente}
              >
                + Agregar
              </button>
            </div>

            {form.ingredientes.length === 0 && (
              <p className={styles.hint}>Todavía no hay ingredientes en esta receta.</p>
            )}

            {form.ingredientes.map((ing, index) => (
              <div key={index} className={styles.ingRow}>
                <select
                  className={styles.ingSelect}
                  value={ing.ingredienteId}
                  onChange={e => handleIngredienteChange(index, 'ingredienteId', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {soloIngredientes.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>

                <input
                  className={styles.ingCantidad}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cantidad"
                  value={ing.cantidad}
                  onChange={e => handleIngredienteChange(index, 'cantidad', e.target.value)}
                />

                <span className={styles.ingUnidad}>{ing.unidad || '—'}</span>

                <span className={styles.ingCosto}>
                  ${((parseFloat(ing.cantidad) || 0) * ing.costoUnitario).toFixed(2)}
                </span>

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => quitarIngrediente(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {rendimiento > 0 && (
            <div className={styles.resumen}>
              <div className={styles.resumenRow}>
                <span>Costo ingredientes</span>
                <strong>${costoIngredientes.toFixed(2)}</strong>
              </div>
              <div className={styles.resumenRow}>
                <span>Costos indirectos ({rendimiento} u. × ${costosIndirectos.toFixed(2)})</span>
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