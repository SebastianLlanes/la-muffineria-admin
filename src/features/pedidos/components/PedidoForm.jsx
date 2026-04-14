import { useState, useEffect } from 'react'
import { useRecetas } from '../../../contexts/RecetasContext'
import { useIngredientes } from '../../../contexts/IngredientesContext'
import { agregarPedido, editarPedido } from '../../../firebase/pedidosService'
import styles from './PedidoForm.module.css'

const hoy = () => new Date().toISOString().split('T')[0]

const vacío = {
  cliente: '',
  tipoCliente: 'particular',
  telefono: '',
  fecha: hoy(),
  fechaEntrega: '',
  items: [],
  notas: '',
  estado: 'pendiente',
}

export default function PedidoForm({ item, onClose }) {
  const { recetas } = useRecetas()
  const { ingredientes } = useIngredientes()
  const [form, setForm] = useState(vacío)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const costosIndirectosPorUnidad = ingredientes
    .filter(i => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  useEffect(() => {
    if (item) setForm(item)
  }, [item])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function agregarItem() {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { recetaId: '', recetaNombre: '', cantidad: '', precioUnitario: '', costoPorUnidad: 0 }
      ]
    }))
  }

  function handleItemChange(index, field, value) {
    const updated = [...form.items]

    if (field === 'recetaId') {
      const receta = recetas.find(r => r.id === value)
      if (receta) {
        updated[index] = {
          ...updated[index],
          recetaId: receta.id,
          recetaNombre: receta.nombre,
          costoPorUnidad: receta.costoPorUnidad || 0,
          precioUnitario: updated[index].precioUnitario,
          cantidad: updated[index].cantidad,
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }

    setForm(prev => ({ ...prev, items: updated }))
  }

  function quitarItem(index) {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  // Cálculos globales
  const totales = form.items.reduce((acc, item) => {
    const cantidad = parseInt(item.cantidad) || 0
    const precio = parseFloat(item.precioUnitario) || 0
    const costo = item.costoPorUnidad || 0

    const subtotalVenta = cantidad * precio
    const subtotalCosto = cantidad * (costo + costosIndirectosPorUnidad)
    const subtotalGanancia = subtotalVenta - subtotalCosto

    return {
      totalVenta: acc.totalVenta + subtotalVenta,
      totalCosto: acc.totalCosto + subtotalCosto,
      totalGanancia: acc.totalGanancia + subtotalGanancia,
    }
  }, { totalVenta: 0, totalCosto: 0, totalGanancia: 0 })

  const margen = totales.totalVenta > 0
    ? (totales.totalGanancia / totales.totalVenta) * 100
    : 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.cliente.trim()) return setError('El nombre del cliente es obligatorio')
    if (form.items.length === 0) return setError('Agregá al menos un producto')
    if (form.items.some(i => !i.recetaId || !i.cantidad || !i.precioUnitario))
      return setError('Completá todos los campos de los productos')
    if (!form.fecha) return setError('Ingresá la fecha del pedido')

    setGuardando(true)
    try {
      const datos = {
        cliente: form.cliente.trim(),
        tipoCliente: form.tipoCliente || 'particular',
        telefono: form.telefono.trim(),
        fecha: form.fecha,
        fechaEntrega: form.fechaEntrega,
        items: form.items.map(i => ({
          ...i,
          cantidad: parseInt(i.cantidad),
          precioUnitario: parseFloat(i.precioUnitario),
        })),
        totalVenta: totales.totalVenta,
        totalCosto: totales.totalCosto,
        totalGanancia: totales.totalGanancia,
        margen,
        notas: form.notas.trim(),
        estado: form.estado,
      }
      if (item) {
        await editarPedido(item.id, datos)
      } else {
        await agregarPedido(datos)
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
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{item ? "Editar pedido" : "Nuevo pedido"}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Cliente */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Cliente</label>
              <input
                className={styles.input}
                name="cliente"
                value={form.cliente}
                onChange={handleChange}
                placeholder="Nombre del cliente"
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Teléfono (opcional)</label>
              <input
                className={styles.input}
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="WhatsApp..."
              />
            </div>
          </div>

          {/* Fechas */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Fecha del pedido</label>
              <input
                className={styles.input}
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Fecha de entrega (opcional)
              </label>
              <input
                className={styles.input}
                name="fechaEntrega"
                type="date"
                value={form.fechaEntrega}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Items */}
          <div className={styles.seccion}>
            <div className={styles.seccionHeader}>
              <span className={styles.label}>Productos</span>
              <button
                type="button"
                className={styles.addItemBtn}
                onClick={agregarItem}
              >
                + Agregar producto
              </button>
            </div>

            {form.items.length === 0 && (
              <p className={styles.hint}>
                Todavía no hay productos en este pedido.
              </p>
            )}

            {form.items.map((it, index) => (
              <div key={index} className={styles.itemRow}>
                <select
                  className={styles.itemSelect}
                  value={it.recetaId}
                  onChange={(e) =>
                    handleItemChange(index, "recetaId", e.target.value)
                  }
                >
                  <option value="">Seleccionar receta...</option>
                  {recetas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>

                <input
                  className={styles.itemInput}
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={it.cantidad}
                  onChange={(e) =>
                    handleItemChange(index, "cantidad", e.target.value)
                  }
                />

                <div className={styles.itemPrecioWrap}>
                  <span className={styles.itemPrefix}>$</span>
                  <input
                    className={styles.itemInputPrecio}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio u."
                    value={it.precioUnitario}
                    onChange={(e) =>
                      handleItemChange(index, "precioUnitario", e.target.value)
                    }
                  />
                </div>

                {it.recetaId && it.cantidad && it.precioUnitario && (
                  <span className={styles.itemSubtotal}>
                    $
                    {(
                      parseInt(it.cantidad) * parseFloat(it.precioUnitario)
                    ).toFixed(2)}
                  </span>
                )}

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => quitarItem(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Resumen financiero */}
          {form.items.length > 0 && totales.totalVenta > 0 && (
            <div className={styles.resumen}>
              <div className={styles.resumenRow}>
                <span>Total venta</span>
                <strong>${totales.totalVenta.toFixed(2)}</strong>
              </div>
              <div className={styles.resumenRow}>
                <span>Costo estimado</span>
                <strong>${totales.totalCosto.toFixed(2)}</strong>
              </div>
              <div className={`${styles.resumenRow} ${styles.resumenTotal}`}>
                <span>Ganancia</span>
                <strong
                  className={
                    totales.totalGanancia >= 0
                      ? styles.positivo
                      : styles.negativo
                  }
                >
                  {totales.totalGanancia >= 0 ? "+" : ""}$
                  {totales.totalGanancia.toFixed(2)}
                </strong>
              </div>
              <div className={styles.resumenRow}>
                <span>Margen</span>
                <strong>{margen.toFixed(1)}%</strong>
              </div>
            </div>
          )}

          {/* Estado y notas */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Tipo de cliente</label>
              <select
                className={styles.input}
                name="tipoCliente"
                value={form.tipoCliente || "particular"}
                onChange={handleChange}
              >
                <option value="particular">Particular</option>
                <option value="revendedor">Revendedor</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Estado</label>
              <select
                className={styles.input}
                name="estado"
                value={form.estado}
                onChange={handleChange}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_preparacion">En preparación</option>
                <option value="listo">Listo para entregar</option>
                <option value="entregado">Entregado</option>
                <option value="cobrado">Cobrado</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Notas (opcional)</label>
              <input
                className={styles.input}
                name="notas"
                value={form.notas}
                onChange={handleChange}
                placeholder="Sin TACC, con dedicatoria..."
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "Guardar pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}