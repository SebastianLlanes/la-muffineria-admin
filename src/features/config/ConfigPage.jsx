import { useState, useEffect } from 'react'
import { suscribirPrecios, actualizarPrecios } from '../../firebase/preciosService'
import styles from './ConfigPage.module.css'

const CAMPOS = [
  { key: 'precioNormalGrande',          label: 'Precio normal grande (160g)',       group: 'Muffin Grande' },
  { key: 'precioDescuentoGrande',       label: 'Precio con descuento grande',        group: 'Muffin Grande' },
  { key: 'recargoAptoDiabeticoGrande',  label: 'Recargo apto diabético grande',      group: 'Muffin Grande' },
  { key: 'precioNormalMediano',         label: 'Precio normal mediano (100g)',       group: 'Muffin Mediano' },
  { key: 'precioDescuentoMediano',      label: 'Precio con descuento mediano',       group: 'Muffin Mediano' },
  { key: 'recargoAptoDiabeticoMediano', label: 'Recargo apto diabético mediano',     group: 'Muffin Mediano' },
  { key: 'umbralDescuento',             label: 'Unidades mínimas para descuento',   group: 'Descuento' },
]

const CAMPOS_OVERRIDE = [
  { key: 'precioNormalGrande',     label: 'Normal grande' },
  { key: 'precioDescuentoGrande',  label: 'Descuento grande' },
  { key: 'precioNormalMediano',    label: 'Normal mediano' },
  { key: 'precioDescuentoMediano', label: 'Descuento mediano' },
]

const GRUPOS = [...new Set(CAMPOS.map(c => c.group))]

export default function ConfigPage() {
  const [valores, setValores]   = useState({})
  const [form, setForm]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [nuevoProductId, setNuevoProductId] = useState('')

  useEffect(function suscribir() {
    const unsub = suscribirPrecios(function (data) {
      const conDefaults = { overridesPorProducto: {}, ...data }
      setValores(conDefaults)
      setForm(conDefaults)
      setLoading(false)
    })
    return unsub
  }, [])

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: Number(value) }))
    setGuardado(false)
  }

  function handleOverrideChange(productId, campo, valor) {
    setForm(prev => ({
      ...prev,
      overridesPorProducto: {
        ...prev.overridesPorProducto,
        [productId]: { ...prev.overridesPorProducto[productId], [campo]: Number(valor) },
      },
    }))
    setGuardado(false)
  }

  function agregarOverride() {
    const id = nuevoProductId.trim()
    if (!id || form.overridesPorProducto[id]) return
    setForm(prev => ({
      ...prev,
      overridesPorProducto: {
        ...prev.overridesPorProducto,
        [id]: { precioNormalGrande: 0, precioDescuentoGrande: 0, precioNormalMediano: 0, precioDescuentoMediano: 0 },
      },
    }))
    setNuevoProductId('')
    setGuardado(false)
  }

  function eliminarOverride(productId) {
    setForm(prev => {
      const copia = { ...prev.overridesPorProducto }
      delete copia[productId]
      return { ...prev, overridesPorProducto: copia }
    })
    setGuardado(false)
  }

  async function handleGuardar() {
    setGuardando(true)
    try {
      await actualizarPrecios(form)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch (err) {
      console.error('Error al guardar precios:', err)
    } finally {
      setGuardando(false)
    }
  }

  function handleReset() {
    setForm(valores)
    setGuardado(false)
  }

  const hayCambios = JSON.stringify(form) !== JSON.stringify(valores)

  if (loading) return <p className={styles.loading}>Cargando configuración...</p>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Configuración de precios</h2>
          <p className={styles.subtitle}>
            Los cambios se reflejan en la web en tiempo real
          </p>
        </div>
        <div className={styles.actions}>
          {hayCambios && (
            <button className={styles.resetBtn} onClick={handleReset}>
              Descartar
            </button>
          )}
          <button
            className={`${styles.saveBtn} ${guardado ? styles.saveBtnOk : ""}`}
            onClick={handleGuardar}
            disabled={guardando || !hayCambios}
          >
            {guardado
              ? "✓ Guardado"
              : guardando
                ? "Guardando..."
                : "Guardar cambios"}
          </button>
        </div>
      </div>

      {guardado && (
        <div className={styles.banner}>
          ✅ Precios actualizados — la web ya está mostrando los nuevos valores
        </div>
      )}

      {GRUPOS.map((grupo) => (
        <div key={grupo} className={styles.seccion}>
          <h3 className={styles.seccionTitle}>{grupo}</h3>
          <div className={styles.grid}>
            {CAMPOS.filter((c) => c.group === grupo).map(({ key, label }) => {
              const cambiado = form[key] !== valores[key];
              return (
                <div
                  key={key}
                  className={`${styles.campo} ${cambiado ? styles.campoModificado : ""}`}
                >
                  <label className={styles.label}>{label}</label>
                  <div className={styles.inputWrapper}>
                    {key !== "umbralDescuento" && (
                      <span className={styles.prefix}>$</span>
                    )}
                    <input
                      className={styles.input}
                      type="number"
                      min="0"
                      value={form[key] ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    {key === "umbralDescuento" && (
                      <span className={styles.suffix}>unidades</span>
                    )}
                  </div>
                  {cambiado && (
                    <span className={styles.valorAnterior}>
                      Antes: {key !== "umbralDescuento" ? "$" : ""}
                      {valores[key]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>
          Precios especiales por producto
        </h3>
        <p className={styles.subtitle}>
          Para sabores con costo distinto al resto (ej. Carrot Cake). Un campo en 0 usa el precio global de esa fila.
        </p>

        {Object.entries(form.overridesPorProducto).map(
          ([productId, valoresOverride]) => (
            <div key={productId} className={styles.campo}>
              <div className={styles.topBar}>
                <strong>{productId}</strong>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => eliminarOverride(productId)}
                >
                  Eliminar
                </button>
              </div>
              <div className={styles.grid}>
                {CAMPOS_OVERRIDE.map(({ key, label }) => (
                  <div key={key} className={styles.campo}>
                    <label className={styles.label}>{label}</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.prefix}>$</span>
                      <input
                        className={styles.input}
                        type="number"
                        min="0"
                        value={valoresOverride[key] ?? 0}
                        onChange={(e) =>
                          handleOverrideChange(productId, key, e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}

        <div className={styles.topBar}>
          <input
            className={styles.input}
            type="text"
            placeholder="ID del producto (ej. muf-006)"
            value={nuevoProductId}
            onChange={(e) => setNuevoProductId(e.target.value)}
          />
          <button
            type="button"
            className={styles.saveBtn}
            onClick={agregarOverride}
          >
            + Agregar producto
          </button>
        </div>
      </div>
    </div>
  );
}