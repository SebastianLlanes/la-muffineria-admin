// Calcula el costo de una receta contra los precios ACTUALES de los ingredientes,
// nunca contra valores guardados/embebidos que pueden haber quedado viejos.
export function calcularCostosReceta(receta, ingredientesActuales) {
  const costosIndirectos = ingredientesActuales
    .filter(i => i.tipo === 'costo_indirecto')
    .reduce((acc, i) => acc + i.costoUnitario, 0)

  const costoIngredientes = (receta.ingredientes || []).reduce((acc, ing) => {
    const actual = ingredientesActuales.find(i => i.id === ing.ingredienteId)
    // Si el ingrediente ya no existe (se borró), usamos el último costo conocido
    // en vez de tratarlo como $0 — evita subestimar el costo real.
    const costoUnitario = actual ? actual.costoUnitario : (ing.costoUnitario || 0)
    return acc + (parseFloat(ing.cantidad) || 0) * costoUnitario
  }, 0)

  const rendimiento = parseInt(receta.rendimiento) || 0
  const costoIndirectoTotal = costosIndirectos * rendimiento
  const costoTotal = costoIngredientes + costoIndirectoTotal
  const costoPorUnidad = rendimiento > 0 ? costoTotal / rendimiento : 0

  const gramosGrande = parseInt(receta.gramosGrande) || 160
  const gramosMediano = parseInt(receta.gramosMediano) || 100
  const factorMediano = gramosGrande > 0 ? gramosMediano / gramosGrande : 0
  const costoPorUnidadMediano = costoPorUnidad * factorMediano

  return { costosIndirectos, costoIngredientes, costoIndirectoTotal, costoTotal, costoPorUnidad, costoPorUnidadMediano }
}