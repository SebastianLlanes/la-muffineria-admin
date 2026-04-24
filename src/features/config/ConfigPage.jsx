import { useState, useEffect } from 'react'
import { suscribirPrecios, actualizarPrecios } from '../../firebase/preciosService'
import styles from './ConfigPage.module.css'

const CAMPOS = [
  { key: 'precioNormalGrande',     label: 'Precio normal grande (160g)',      group: 'Muffin Grande' },
  { key: 'precioDescuentoGrande',  label: 'Precio con descuento grande',       group: 'Muffin Grande' },
  { key: 'precioNormalMediano',    label: 'Precio normal mediano (100g)',       group: 'Muffin Mediano' },
  { key: 'precioDescuentoMediano', label: 'Precio con descuento mediano',      group: 'Muffin Mediano' },
  { key: 'umbralDescuento',        label: 'Unidades mínimas para descuento',  group: 'Descuento' },
]

const GRUPOS = [...new Set(CAMPOS.map(c => c.group))]

export default function ConfigPage() {
  const [valores, setValores]   = useState({})
  const [form, setForm]         = useState({})
  const [loading, setLoading]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(function suscribir() {
    const unsub = suscribirPrecios(function (data) {
      setValores(data)
      setForm(data)
      setLoading(false)
    })
    return unsub
  }, [])

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: Number(value) }))
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
    </div>
  );
}