import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useMemo } from 'react'
import { usePedidos } from '../contexts/PedidosContext'
import { usePartidas } from '../contexts/PartidasContext'
import { useRecetas } from '../contexts/RecetasContext'
import { useIngredientes } from '../contexts/IngredientesContext'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'

const ESTADOS = {
  pendiente:      'Pendiente',
  en_preparacion: 'En preparación',
  listo:          'Listo para entregar',
  entregado:      'Entregado',
  cobrado:        'Cobrado',
}

const ESTADO_COLOR = {
  pendiente:      'estadoPendiente',
  en_preparacion: 'estadoPreparacion',
  listo:          'estadoListo',
  entregado:      'estadoEntregado',
  cobrado:        'estadoCobrado',
}

function getLunesSemanaActual() {
  const hoy = new Date()
  const dia = hoy.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() + diff)
  lunes.setHours(0, 0, 0, 0)
  return lunes
}

function formatFecha(valor) {
  if (!valor) return '—'
  if (valor?.toDate) {
    const d = valor.toDate()
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  if (typeof valor === 'string') {
    const [y, m, d] = valor.split('-')
    return `${d}/${m}/${y}`
  }
  return '—'
}

export default function Dashboard() {
  const { pedidos } = usePedidos();
  const { partidas } = usePartidas();
  const { recetas } = useRecetas();
  const { ingredientes } = useIngredientes();
  const navigate = useNavigate();

  const lunes = getLunesSemanaActual();
  const lunesStr = lunes.toISOString().split("T")[0];

  function toDate(valor) {
    if (!valor) return null;
    if (valor?.toDate) return valor.toDate();
    if (typeof valor === "string") return new Date(valor);
    return null;
  }

  const pedidosSemana = pedidos.filter((p) => {
    const f = toDate(p.fecha);
    return f && f >= lunes;
  });
  const partidasSemana = partidas.filter((p) => {
    const f = toDate(p.fecha);
    return f && f >= lunes;
  });

  const gananciasSemana = pedidosSemana.reduce(
    (acc, p) => acc + (p.totalGanancia || 0),
    0,
  );
  const ventaSemana = pedidosSemana.reduce(
    (acc, p) => acc + (p.totalVenta || 0),
    0,
  );

  const pedidosActivos = pedidos.filter(
    (p) => p.estado !== "cobrado" && p.estado !== "entregado",
  );

  const muffinsTotal = pedidos.reduce(
    (acc, p) =>
      acc + (p.items || []).reduce((a, i) => a + (i.cantidad || 0), 0),
    0,
  );

  const muffinsGrandes = pedidos.reduce(
    (acc, p) =>
      acc +
      (p.items || [])
        .filter((i) => i.size === "grande")
        .reduce((a, i) => a + (i.cantidad || 0), 0),
    0,
  );

  const muffinsMedianos = pedidos.reduce(
    (acc, p) =>
      acc +
      (p.items || [])
        .filter((i) => i.size === "mediano")
        .reduce((a, i) => a + (i.cantidad || 0), 0),
    0,
  );

  // Pedidos web recién llegados del e-commerce que requieren tu confirmación
  const pedidosWebSinAtender = pedidos.filter(
    (p) => p.origen === "web" && p.estado === "nuevo",
  );

  const unidadesSemana = partidasSemana.reduce(
    (acc, p) => acc + (p.cantidadProducida || 0),
    0,
  );

  // Tendencia de las últimas 8 semanas: venta y ganancia por semana
  const tendenciaSemanal = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const semanas = [];

    // Generar las últimas 8 semanas (lunes de cada una)
    for (let i = 7; i >= 0; i--) {
      const lunes = new Date(hoy);
      const dia = lunes.getDay();
      const diff = dia === 0 ? -6 : 1 - dia;
      lunes.setDate(lunes.getDate() + diff - i * 7);
      lunes.setHours(0, 0, 0, 0);

      const proximoLunes = new Date(lunes);
      proximoLunes.setDate(proximoLunes.getDate() + 7);

      const [y, m, d] = lunes.toISOString().split("T")[0].split("-");

      semanas.push({
        lunes,
        proximoLunes,
        label: `${d}/${m}`,
        venta: 0,
        ganancia: 0,
      });
    }

    pedidos.forEach((p) => {
      const f = toDate(p.fecha);
      if (!f) return;
      const semana = semanas.find((s) => f >= s.lunes && f < s.proximoLunes);
      if (!semana) return;
      semana.venta += p.totalVenta ?? p.total ?? 0;
      semana.ganancia += p.totalGanancia ?? 0;
    });

    return semanas.map(({ label, venta, ganancia }) => ({
      label,
      venta,
      ganancia,
    }));
  }, [pedidos]);

  const hayTendencia = tendenciaSemanal.some((s) => s.venta > 0);

  const ultimosPedidos = [...pedidos]
    .sort((a, b) => {
      const ta =
        toDate(a.creadoEn)?.getTime() ?? toDate(a.fecha)?.getTime() ?? 0;
      const tb =
        toDate(b.creadoEn)?.getTime() ?? toDate(b.fecha)?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 5);

  const modulos = [
    {
      path: "/ingredientes",
      icon: "🧂",
      label: "Ingredientes",
      count: ingredientes.length,
      sub: "ítems",
    },
    {
      path: "/recetas",
      icon: "📋",
      label: "Recetas",
      count: recetas.length,
      sub: "recetas",
    },
    {
      path: "/partidas",
      icon: "🏭",
      label: "Partidas",
      count: partidas.length,
      sub: "registradas",
    },
    {
      path: "/calculador",
      icon: "🧮",
      label: "Calculador",
      count: null,
      sub: "proyectá costos",
    },
    {
      path: "/pedidos",
      icon: "📦",
      label: "Pedidos",
      count: pedidosActivos.length,
      sub: "activos",
    },
    {
      path: "/reportes",
      icon: "📈",
      label: "Reportes",
      count: null,
      sub: "ver métricas",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.bienvenida}>
        <h2 className={styles.title}>🧁 La Muffinería</h2>
        <p className={styles.subtitle}>Panel de gestión interna</p>
      </div>

      {/* Métricas semana */}
      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Esta semana</h3>

        {/* Contadores de muffins */}
        <div className={styles.seccion}>
          <h3 className={styles.seccionTitle}>Muffins vendidos (histórico)</h3>
          <div className={styles.metricasGrid}>
            <div className={styles.metricaCard}>
              <span className={styles.metricaLabel}>🧁 Total</span>
              <span className={styles.metricaValor}>{muffinsTotal}</span>
            </div>
            <div className={styles.metricaCard}>
              <span className={styles.metricaLabel}>🔵 Grandes</span>
              <span className={styles.metricaValor}>{muffinsGrandes}</span>
            </div>
            <div className={styles.metricaCard}>
              <span className={styles.metricaLabel}>🟡 Medianos</span>
              <span className={styles.metricaValor}>{muffinsMedianos}</span>
            </div>
          </div>
        </div>

        <div className={styles.metricasGrid}>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Pedidos realizados</span>
            <span className={styles.metricaValor}>{pedidosSemana.length}</span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Total facturado</span>
            <span className={styles.metricaValor}>
              ${ventaSemana.toFixed(2)}
            </span>
          </div>
          <div className={`${styles.metricaCard} ${styles.metricaDestacada}`}>
            <span className={styles.metricaLabel}>Ganancia</span>
            <span className={styles.metricaValor}>
              ${gananciasSemana.toFixed(2)}
            </span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Unidades horneadas</span>
            <span className={styles.metricaValor}>{unidadesSemana}</span>
          </div>
          <div className={styles.metricaCard}>
            <span className={styles.metricaLabel}>Pedidos activos</span>
            <span className={styles.metricaValor}>{pedidosActivos.length}</span>
          </div>
          {pedidosWebSinAtender.length > 0 && (
            <button
              className={`${styles.metricaCard} ${styles.metricaAlerta}`}
              onClick={() => navigate("/pedidos")}
            >
              <span className={styles.metricaLabel}>🔔 Web sin atender</span>
              <span className={styles.metricaValor}>
                {pedidosWebSinAtender.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className={styles.seccion}>
        <h3 className={styles.seccionTitle}>Módulos</h3>
        <div className={styles.modulosGrid}>
          {modulos.map((m) => (
            <button
              key={m.path}
              className={styles.moduloCard}
              onClick={() => navigate(m.path)}
            >
              <span className={styles.moduloIcon}>{m.icon}</span>
              <span className={styles.moduloLabel}>{m.label}</span>
              <span className={styles.moduloSub}>
                {m.count !== null ? `${m.count} ${m.sub}` : m.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tendencia semanal */}
      {hayTendencia && (
        <div className={styles.seccion}>
          <h3 className={styles.seccionTitle}>
            Tendencia de las últimas 8 semanas
          </h3>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={tendenciaSemanal}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D5C3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#8A7A70" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#8A7A70" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => "$" + v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FDFAF4",
                    border: "1px solid #E2D5C3",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                  formatter={(value) => ["$" + value.toFixed(2)]}
                />
                <Bar
                  dataKey="venta"
                  name="Facturado"
                  fill="#D4A853"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="ganancia"
                  name="Ganancia"
                  fill="#6B7C45"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Últimos pedidos */}
      {ultimosPedidos.length > 0 && (
        <div className={styles.seccion}>
          <div className={styles.seccionHeader}>
            <h3 className={styles.seccionTitle}>Últimos pedidos</h3>
            <button
              className={styles.verTodosBtn}
              onClick={() => navigate("/pedidos")}
            >
              Ver todos →
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Ganancia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPedidos.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.clienteNombre}>{p.cliente}</td>
                    <td>{formatFecha(p.fecha)}</td>
                    <td>${(p.totalVenta ?? p.total ?? 0).toFixed(2)}</td>
                    <td
                      className={
                        (p.totalGanancia ?? 0) >= 0
                          ? styles.positivo
                          : styles.negativo
                      }
                    >
                      ${(p.totalGanancia ?? 0).toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`${styles.estadoBadge} ${styles[ESTADO_COLOR[p.estado] ?? "estadoPendiente"]}`}
                      >
                        {ESTADOS[p.estado] ?? "Nuevo (web)"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}