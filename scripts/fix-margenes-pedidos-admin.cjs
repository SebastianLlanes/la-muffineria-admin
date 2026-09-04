/**
 * fix-margenes-pedidos-admin.cjs
 *
 * A diferencia del caso web, los pedidos origen='admin' NO están todos
 * afectados por el bug del indirecto duplicado (PedidoForm calcula bien
 * desde el principio). Solo lo están los que se costearon con el botón
 * "Calcular costos" de PedidosPage antes del fix.
 *
 * Por eso este script clasifica cada pedido comparando totalCosto contra
 * la suma real de sus items:
 *   - diferencia ~ $0                        -> ya estaba bien, no se toca
 *   - diferencia ~ $210 x unidades del pedido -> bug confirmado, se corrige
 *   - cualquier otra diferencia               -> se deja aparte para revisar a mano
 *
 * Igual que en el script de web: nunca se re-matchea contra las recetas
 * actuales ni se toca items[].costoPorUnidad — se preserva el costo
 * histórico, solo se corrige el error aritmético puntual.
 *
 * Uso:
 *   node fix-margenes-pedidos-admin.cjs            → vista previa (dry-run)
 *   node fix-margenes-pedidos-admin.cjs --apply     → aplica los cambios
 */

const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const TOLERANCIA = 1 // pesos, para absorber redondeo acumulado

async function main() {
  const APLICAR = process.argv.includes('--apply')

  console.log(
    APLICAR
      ? '✍️  Modo APLICAR — se van a escribir los cambios en Firestore\n'
      : '🔍 Modo DRY-RUN — solo vista previa, no se escribe nada (usá --apply para aplicar)\n'
  )

  const ingredientesSnap = await db.collection('ingredientes').get()
  const costosIndirectosPorUnidad = ingredientesSnap.docs
    .map((d) => d.data())
    .filter((i) => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  console.log(`Costo indirecto por unidad (actual): $${costosIndirectosPorUnidad}\n`)

  const pedidosSnap = await db
    .collection('pedidos')
    .where('origen', '==', 'admin')
    .get()

  const cambios = []
  const revisarManual = []
  let yaCorrectos = 0
  let sinCosto = 0

  let batch = db.batch()
  let enBatch = 0

  for (const doc of pedidosSnap.docs) {
    const pedido = doc.data()

    if (!pedido.totalCosto || pedido.totalCosto <= 0 || !pedido.items?.length) {
      sinCosto++
      continue
    }

    const sumaItems = pedido.items.reduce(
      (acc, it) => acc + (it.cantidad ?? it.quantity ?? 0) * (it.costoPorUnidad ?? 0),
      0
    )
    const totalUnidades = pedido.items.reduce(
      (acc, it) => acc + (it.cantidad ?? it.quantity ?? 0),
      0
    )
    const extraEsperado = totalUnidades * costosIndirectosPorUnidad
    const diferencia = pedido.totalCosto - sumaItems

    const esBugConfirmado = Math.abs(diferencia - extraEsperado) < TOLERANCIA
    const yaEstaBien = Math.abs(diferencia) < TOLERANCIA

    if (yaEstaBien) {
      yaCorrectos++
      continue
    }

    if (!esBugConfirmado) {
      revisarManual.push({
        id: doc.id,
        cliente: pedido.cliente,
        totalVenta: pedido.totalVenta ?? pedido.total ?? 0,
        totalCosto: pedido.totalCosto.toFixed(2),
        sumaItems: sumaItems.toFixed(2),
        diferencia: diferencia.toFixed(2),
      })
      continue
    }

    // Bug confirmado: mismo tratamiento que en pedidos web
    const totalVenta = pedido.totalVenta ?? pedido.total ?? 0
    const totalCostoNuevo = sumaItems
    const totalGananciaNueva = totalVenta - totalCostoNuevo
    const margenNuevo = totalVenta > 0 ? (totalGananciaNueva / totalVenta) * 100 : 0

    cambios.push({
      cliente: pedido.cliente,
      totalVenta,
      costoAnterior: pedido.totalCosto.toFixed(2),
      costoNuevo: totalCostoNuevo.toFixed(2),
      margenAnterior: (pedido.margen ?? 0).toFixed(1) + '%',
      margenNuevo: margenNuevo.toFixed(1) + '%',
    })

    if (APLICAR) {
      batch.update(doc.ref, {
        totalCosto: totalCostoNuevo,
        totalGanancia: totalGananciaNueva,
        margen: margenNuevo,
      })
      enBatch++
      if (enBatch >= 400) {
        await batch.commit()
        batch = db.batch()
        enBatch = 0
      }
    }
  }

  if (APLICAR && enBatch > 0) {
    await batch.commit()
  }

  console.log(`Pedidos admin revisados: ${pedidosSnap.size}`)
  console.log(`Sin costo calculado (no tocados): ${sinCosto}`)
  console.log(`Ya estaban bien: ${yaCorrectos}`)
  console.log(`\n${APLICAR ? 'Corregidos (bug confirmado)' : 'A corregir (bug confirmado)'}: ${cambios.length}`)
  if (cambios.length > 0) console.table(cambios)

  console.log(`\nPara revisar a mano (diferencia no coincide con el bug conocido): ${revisarManual.length}`)
  if (revisarManual.length > 0) console.table(revisarManual)

  if (!APLICAR && cambios.length > 0) {
    console.log('\nEsto fue solo una vista previa. Corré con --apply para escribir los cambios.')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error corriendo el script:', err)
    process.exit(1)
  })
