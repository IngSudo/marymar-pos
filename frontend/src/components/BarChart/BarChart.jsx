import { useRef, useState } from 'react';
import './BarChart.scss';

const ALTO_DEFAULT = 170;
const ANCHO = 560;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_LEFT = 40;
const GROSOR_MAX = 22;
const NUM_TICKS = 4;

function formatoDefault(v) {
  return `$${Number(v).toFixed(0)}`;
}

function pasoLimpio(rango, redondear) {
  const exponente = Math.floor(Math.log10(rango || 1));
  const fraccion = rango / 10 ** exponente;
  let fraccionLimpia;
  if (redondear) {
    if (fraccion < 1.5) fraccionLimpia = 1;
    else if (fraccion < 3) fraccionLimpia = 2;
    else if (fraccion < 7) fraccionLimpia = 5;
    else fraccionLimpia = 10;
  } else {
    if (fraccion <= 1) fraccionLimpia = 1;
    else if (fraccion <= 2) fraccionLimpia = 2;
    else if (fraccion <= 5) fraccionLimpia = 5;
    else fraccionLimpia = 10;
  }
  return fraccionLimpia * 10 ** exponente;
}

function calcularTicks(min, max, cantidad) {
  const minAjustado = Math.min(0, min);
  const maxAjustado = Math.max(0, max, minAjustado + 1);
  const paso = pasoLimpio((maxAjustado - minAjustado) / (cantidad - 1), true) || 1;
  const ticksMin = Math.floor(minAjustado / paso) * paso;
  const ticksMax = Math.ceil(maxAjustado / paso) * paso;
  const ticks = [];
  for (let v = ticksMin; v <= ticksMax + paso / 1000; v += paso) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

export default function BarChart({ data, series, format = formatoDefault, alto = ALTO_DEFAULT }) {
  const contenedorRef = useRef(null);
  const [hover, setHover] = useState(null);

  if (!data || data.length === 0) return null;

  const agrupado = Array.isArray(series) && series.length > 0;
  const claves = agrupado ? series.map((s) => s.key) : ['value'];

  const valoresCrudos = data.flatMap((d) => (agrupado ? claves.map((k) => Number(d.valores?.[k] ?? 0)) : [Number(d.value ?? 0)]));
  const maxCrudo = Math.max(0, ...valoresCrudos);
  const minCrudo = Math.min(0, ...valoresCrudos);

  const ticks = calcularTicks(minCrudo, maxCrudo, NUM_TICKS);
  const min = ticks[0];
  const max = ticks[ticks.length - 1];
  const rango = max - min || 1;

  const areaAlto = alto - PAD_TOP - PAD_BOTTOM;
  const anchoUtil = ANCHO - PAD_LEFT;
  const escalaY = (v) => PAD_TOP + areaAlto - ((v - min) / rango) * areaAlto;
  const yCero = escalaY(0);

  const anchoGrupo = anchoUtil / data.length;
  const gap = 6;
  const maxBarras = agrupado ? claves.length : 1;
  const anchoBarra = Math.min(GROSOR_MAX, (anchoGrupo - gap * (maxBarras + 1)) / maxBarras);

  function mostrarTooltip(evt, titulo, lineas) {
    const rect = contenedorRef.current.getBoundingClientRect();
    setHover({
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
      titulo,
      lineas,
    });
  }

  return (
    <div className="bar-chart" ref={contenedorRef}>
      {agrupado && (
        <div className="bar-chart__leyenda">
          {series.map((s) => (
            <span key={s.key} className="bar-chart__leyenda-item">
              <span className="bar-chart__leyenda-punto" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <svg
        className="bar-chart__svg"
        viewBox={`0 0 ${ANCHO} ${alto}`}
        role="img"
        aria-label="Gráfico de barras comparativo"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              className={`bar-chart__grid ${t === 0 ? 'bar-chart__grid--base' : ''}`}
              x1={PAD_LEFT}
              x2={ANCHO}
              y1={escalaY(t)}
              y2={escalaY(t)}
            />
            <text x={PAD_LEFT - 8} y={escalaY(t)} textAnchor="end" dominantBaseline="middle" className="bar-chart__tick">
              {format(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD_LEFT + anchoGrupo * i + anchoGrupo / 2;
          const barrasClaves = agrupado ? claves : ['value'];

          return (
            <g key={d.label}>
              {barrasClaves.map((clave, j) => {
                const valor = agrupado ? Number(d.valores?.[clave] ?? 0) : Number(d.value ?? 0);
                const color = agrupado ? series[j].color : d.color;
                const yVal = escalaY(valor);
                const esNegativo = valor < 0;
                const y = esNegativo ? yCero : yVal;
                const h = Math.max(1, Math.abs(yVal - yCero));
                const x = cx - (anchoBarra * maxBarras + gap * (maxBarras - 1)) / 2 + j * (anchoBarra + gap);
                const radius = Math.min(3, h);
                const path = esNegativo
                  ? `M${x},${y} h${anchoBarra} v${h - radius} a${radius},${radius} 0 0 1 -${radius},${radius} h-${anchoBarra - radius * 2} a${radius},${radius} 0 0 1 -${radius},-${radius} z`
                  : `M${x},${y + h} v-${h - radius} a${radius},${radius} 0 0 1 ${radius},-${radius} h${anchoBarra - radius * 2} a${radius},${radius} 0 0 1 ${radius},${radius} v${h - radius} z`;

                const lineasTooltip = agrupado
                  ? series.map((s) => `${s.label}: ${format(Number(d.valores?.[s.key] ?? 0))}`)
                  : [format(valor)];

                return (
                  <g
                    key={clave}
                    className="bar-chart__barra-grupo"
                    onMouseMove={(e) => mostrarTooltip(e, d.label, lineasTooltip)}
                    onMouseEnter={(e) => mostrarTooltip(e, d.label, lineasTooltip)}
                  >
                    <path d={path} fill={color} className="bar-chart__barra" />
                  </g>
                );
              })}

              <text x={cx} y={alto - 8} textAnchor="middle" className="bar-chart__etiqueta">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="bar-chart__tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.titulo}</strong>
          {hover.lineas.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
