import { useState, useEffect } from 'react'
import { agregarIngrediente, editarIngrediente } from '../../../firebase/ingredientesService'
import styles from './IngredienteForm.module.css'

const UNIDADES = ['g', 'kg', 'ml', 'l', 'unidad', 'por unidad']

const vacío = {
  nombre: '',
  tipo: 'ingrediente',
  unidad: 'g',
  costoUnitario: '',
  activo: true,
}

export default function IngredienteForm({ item, onClose }) {
  const [form, setForm] = useState(vacío)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) setForm(item)
  }, [item])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) return setError('El nombre es obligatorio')
    if (!form.costoUnitario || isNaN(form.costoUnitario) || Number(form.costoUnitario) <= 0)
      return setError('Ingresá un costo válido')

    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        unidad: form.unidad,
        costoUnitario: Number(form.costoUnitario),
        activo: true,
      }
      if (item) {
        await editarIngrediente(item.id, datos)
      } else {
        await agregarIngrediente(datos)
      }
      onClose()
    } catch (err) {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{item ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <label className={styles.label}>Nombre</label>
          <input
            className={styles.input}
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: Harina 000"
            autoFocus
          />

          <label className={styles.label}>Tipo</label>
          <select
            className={styles.input}
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
          >
            <option value="ingrediente">Ingrediente</option>
            <option value="costo_indirecto">Costo indirecto</option>
          </select>

          {form.tipo === 'costo_indirecto' && (
            <p className={styles.hint}>
              💡 Se sumará automáticamente por unidad producida en cada partida y cálculo.
            </p>
          )}

          <label className={styles.label}>Unidad</label>
          <select
            className={styles.input}
            name="unidad"
            value={form.unidad}
            onChange={handleChange}
          >
            {UNIDADES.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <label className={styles.label}>
            Costo por {form.unidad} ($)
          </label>
          <input
            className={styles.input}
            name="costoUnitario"
            type="number"
            min="0"
            step="0.01"
            value={form.costoUnitario}
            onChange={handleChange}
            placeholder="0.00"
          />

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