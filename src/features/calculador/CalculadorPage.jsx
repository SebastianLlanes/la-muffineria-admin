import { useState } from 'react'
import { useRecetas } from '../../contexts/RecetasContext'
import { useIngredientes } from '../../contexts/IngredientesContext'
import { usePedidos } from '../../contexts/PedidosContext'
import styles from './CalculadorPage.module.css'

export default function CalculadorPage() {
  const { recetas } = useRecetas()
  const { ingredientes } = useIngredientes()
  const { pedidos } = usePedidos()

  const [recetaId, setRecetaId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [hornadaActiva, setHornadaActiva] = useState(null) // fecha de la hornada cargada

  // Hornadas pendientes: misma lógica que PartidasPage
  const ESTADOS_ACTIVOS = ['pendiente', 'en_preparacion']
  const hornadas = pedidos
    .filter(p => ESTADOS_ACTIVOS.includes(p.estado) && (p.fechaEntrega || p.fecha))
    .reduce((acc, pedido) => {
      const fecha = pedido.fecha || pedido.fechaEntrega
      if (!acc[fecha]) acc[fecha] = { pedidos: [], recetas: {} }
      acc[fecha].pedidos.push(pedido)
      pedido.items?.forEach(it => {
        acc[fecha].recetas[it.recetaNombre] = (acc[fecha].recetas[it.recetaNombre] || 0) + Number(it.cantidad)
      })
      return acc
    }, {})
  const hornadasOrdenadas = Object.entries(hornadas).sort(([a], [b]) => a.localeCompare(b))

  function cargarDesdeHornada(fecha, recetaNombre, cantidadUnidades) {
    const recetaEncontrada = recetas.find(r => r.nombre === recetaNombre)
    if (!recetaEncontrada) return
    setRecetaId(recetaEncontrada.id)
    setCantidad(String(cantidadUnidades))
    setPrecioVenta('')
    setHornadaActiva(fecha)
  }

  const receta = recetas.find(r => r.id === recetaId)

  const costosIndirectosPorUnidad = ingredientes
    .filter(i => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  const cantidadNum = parseInt(cantidad) || 0
  const precioNum = parseFloat(precioVenta) || 0

  // Escalar ingredientes proporcionalmente
  const factor = receta && receta.rendimiento > 0
    ? cantidadNum / receta.rendimiento
    : 0

  const ingredientesEscalados = receta
    ? receta.ingredientes.map(ing => ({
        ...ing,
        cantidadReal: (ing.cantidad * factor),
        costoReal: (ing.cantidad * factor * ing.costoUnitario),
      }))
    : []

  const costoIngredientes = ingredientesEscalados
    .reduce((acc, ing) => acc + ing.costoReal, 0)

  const costoIndirectoTotal = costosIndirectosPorUnidad * cantidadNum
  const costoTotal = costoIngredientes + costoIndirectoTotal
  const costoPorUnidad = cantidadNum > 0 ? costoTotal / cantidadNum : 0

  const ingresoTotal = precioNum * cantidadNum
  const gananciaTotal = ingresoTotal - costoTotal
  const margenPorcentaje = ingresoTotal > 0
    ? (gananciaTotal / ingresoTotal) * 100
    : 0

  // Punto de equilibrio: cuántas unidades necesito vender para cubrir costos
  const puntoEquilibrio = precioNum > costoPorUnidad && costoPorUnidad > 0
    ? Math.ceil(costoTotal / (precioNum - costoPorUnidad) * costoPorUnidad / costoPorUnidad)
    : null

  // Precio sugerido para distintos márgenes objetivo
  const margenesObjetivo = [20, 30, 40, 50]

  function reset() {
    setRecetaId('')
    setCantidad('')
    setPrecioVenta('')
    setHornadaActiva(null)
  }

  const listo = cantidadNum > 0 && receta

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Calculador de costos</h2>
          <p className={styles.subtitle}>Proyectá una producción antes de arrancar</p>
        </div>
        {(recetaId || cantidad || precioVenta) && (
          <button className={styles.resetBtn} onClick={reset}>Limpiar</button>
        )}
      </div>

      {/* Hornadas pendientes */}
      {hornadasOrdenadas.length > 0 && (
        <div className={styles.hornadasPanel}>
          <h3 className={styles.hornadasTitle}>🔥 Hornadas pendientes</h3>
          <p className={styles.hornadasSubtitle}>
            Cargá una receta directo desde los pedidos activos
          </p>
          <div className={styles.hornadasGrid}>
            {hornadasOrdenadas.map(([fecha, data]) => {
              const [y, m, d] = fecha.split('-')
              const fechaLabel = `${d}/${m}/${y}`
              const esActiva = hornadaActiva === fecha
              return (
                <div
                  key={fecha}
                  className={`${styles.hornadaCard} ${esActiva ? styles.hornadaCardActiva : ''}`}
                >
                  <div className={styles.hornadaCardHeader}>
                    <span className={styles.hornadaFecha}>📅 {fechaLabel}</span>
                    <span className={styles.hornadaBadge}>
                      {data.pedidos.length} pedido{data.pedidos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={styles.hornadaRecetasBtns}>
                    {Object.entries(data.recetas).map(([nombre, cant]) => {
                      const recetaExiste = recetas.some(r => r.nombre === nombre)
                      return (
                        <button
                          key={nombre}
                          className={`${styles.hornadaRecetaBtn} ${!recetaExiste ? styles.hornadaRecetaDeshabilitada : ''}`}
                          onClick={() => recetaExiste && cargarDesdeHornada(fecha, nombre, cant)}
                          disabled={!recetaExiste}
                          title={!recetaExiste ? 'Receta no encontrada en el sistema' : `Cargar: ${nombre} × ${cant} u.`}
                        >
                          <span>{nombre}</span>
                          <strong>{cant} u.</strong>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className={styles.inputsCard}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Receta base</label>
          <select
            className={styles.select}
            value={recetaId}
            onChange={e => setRecetaId(e.target.value)}
          >
            <option value="">Seleccionar receta...</option>
            {recetas.map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre} (rinde {r.rendimiento} u.)
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Cantidad a producir</label>
          <div className={styles.inputWithUnit}>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder="Ej: 48"
              disabled={!recetaId}
            />
            <span className={styles.unit}>unidades</span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Precio de venta por unidad</label>
          <div className={styles.inputWithUnit}>
            <span className={styles.prefix}>$</span>
            <input
              className={styles.inputPrefixed}
              type="number"
              min="0"
              step="0.01"
              value={precioVenta}
              onChange={e => setPrecioVenta(e.target.value)}
              placeholder="0.00"
              disabled={!listo}
            />
          </div>
        </div>
      </div>

      {/* Desglose de costos */}
      {listo && (
        <>
          <div className={styles.seccion}>
            <h3 className={styles.seccionTitle}>Desglose de ingredientes</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ingrediente</th>
                    <th>Cantidad</th>
                    <th>Unidad</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientesEscalados.map((ing, i) => (
                    <tr key={i}>
                      <td>{ing.nombre}</td>
                      <td>{ing.cantidadReal % 1 === 0
                        ? ing.cantidadReal
                        : ing.cantidadReal.toFixed(2)}
                      </td>
                      <td>{ing.unidad}</td>
                      <td>${ing.costoReal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {ingredientes
                    .filter(i => i.tipo === 'costo_indirecto')
                    .map(ci => (
                      <tr key={ci.id} className={styles.indirecRow}>
                        <td>{ci.nombre}</td>
                        <td>{cantidadNum}</td>
                        <td>por unidad</td>
                        <td>${(ci.costoUnitario * cantidadNum).toFixed(2)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de costos */}
          <div className={styles.resumenGrid}>
            <div className={styles.resumenCard}>
              <span className={styles.resumenLabel}>Costo ingredientes</span>
              <span className={styles.resumenValor}>${costoIngredientes.toFixed(2)}</span>
            </div>
            <div className={styles.resumenCard}>
              <span className={styles.resumenLabel}>Costos indirectos</span>
              <span className={styles.resumenValor}>${costoIndirectoTotal.toFixed(2)}</span>
            </div>
            <div className={styles.resumenCard}>
              <span className={styles.resumenLabel}>Costo total</span>
              <span className={styles.resumenValor}>${costoTotal.toFixed(2)}</span>
            </div>
            <div className={`${styles.resumenCard} ${styles.resumenDestacado}`}>
              <span className={styles.resumenLabel}>Costo por unidad</span>
              <span className={styles.resumenValorGrande}>${costoPorUnidad.toFixed(2)}</span>
            </div>
          </div>

          {/* Análisis de precio */}
          {precioNum > 0 && (
            <div className={styles.seccion}>
              <h3 className={styles.seccionTitle}>Análisis de precio</h3>
              <div className={styles.analisisGrid}>
                <div className={styles.analisisCard}>
                  <span className={styles.analisisLabel}>Ingreso total</span>
                  <span className={styles.analisisValor}>${ingresoTotal.toFixed(2)}</span>
                </div>
                <div className={`${styles.analisisCard} ${gananciaTotal >= 0 ? styles.positivo : styles.negativo}`}>
                  <span className={styles.analisisLabel}>Ganancia total</span>
                  <span className={styles.analisisValor}>
                    {gananciaTotal >= 0 ? '+' : ''}${gananciaTotal.toFixed(2)}
                  </span>
                </div>
                <div className={`${styles.analisisCard} ${margenPorcentaje >= 30 ? styles.positivo : margenPorcentaje >= 15 ? styles.neutro : styles.negativo}`}>
                  <span className={styles.analisisLabel}>Margen</span>
                  <span className={styles.analisisValor}>{margenPorcentaje.toFixed(1)}%</span>
                </div>
                <div className={styles.analisisCard}>
                  <span className={styles.analisisLabel}>Ganancia por unidad</span>
                  <span className={styles.analisisValor}>
                    ${(precioNum - costoPorUnidad).toFixed(2)}
                  </span>
                </div>
              </div>

              {precioNum <= costoPorUnidad && (
                <div className={styles.alerta}>
                  ⚠️ El precio de venta es menor al costo por unidad. Estás perdiendo dinero.
                </div>
              )}

              {puntoEquilibrio !== null && precioNum > costoPorUnidad && (
                <div className={styles.equilibrio}>
                  <span>📊 Punto de equilibrio:</span>
                  <strong>
                    vendiendo {cantidadNum} unidades a ${precioNum} cubrís costos y ganás ${gananciaTotal.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Tabla de precios sugeridos */}
          <div className={styles.seccion}>
            <h3 className={styles.seccionTitle}>Precios sugeridos por margen objetivo</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Margen objetivo</th>
                    <th>Precio por unidad</th>
                    <th>Ganancia total ({cantidadNum} u.)</th>
                  </tr>
                </thead>
                <tbody>
                  {margenesObjetivo.map(margen => {
                    const precio = costoPorUnidad / (1 - margen / 100)
                    const ganancia = (precio - costoPorUnidad) * cantidadNum
                    const esActual = precioNum > 0 &&
                      Math.abs(precio - precioNum) < 0.5
                    return (
                      <tr
                        key={margen}
                        className={esActual ? styles.rowActual : ''}
                      >
                        <td>
                          <span className={`${styles.margenBadge} ${styles[`m${margen}`]}`}>
                            {margen}%
                          </span>
                        </td>
                        <td>${precio.toFixed(2)}</td>
                        <td>${ganancia.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!recetaId && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🧮</span>
          <p>Seleccioná una receta y una cantidad para ver la proyección de costos.</p>
        </div>
      )}
    </div>
  )
}