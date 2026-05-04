import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import styles from './ChartTendencia.module.css'

/**
 * Gráfico de barras con venta y ganancia agrupadas por semana.
 *
 * @param {Object} props
 * @param {Array<{label: string, venta: number, ganancia: number}>} props.data
 * @param {string} [props.titulo='Tendencia de las últimas 8 semanas']
 */
export default function ChartTendencia({ data, titulo = 'Tendencia de las últimas 8 semanas' }) {
  return (
    <section className={styles.seccion}>
      <h3 className={styles.titulo}>{titulo}</h3>
      <div className={styles.chartCard}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2D5C3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#8A7A70' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#8A7A70' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => '$' + v}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FDFAF4',
                border: '1px solid #E2D5C3',
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value) => ['$' + value.toFixed(2)]}
            />
            <Bar dataKey="venta"    name="Facturado" fill="#D4A853" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ganancia" name="Ganancia"  fill="#6B7C45" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}