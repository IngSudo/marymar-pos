export function delta(actual, anterior) {
  if (!anterior) return null;
  const bruto = ((actual - anterior) / Math.abs(anterior)) * 100;
  const magnitud = Math.abs(bruto);
  const positivo = bruto >= 0;
  if (magnitud > 100) return { texto: '>100%', positivo };
  return { texto: `${magnitud.toFixed(1)}%`, positivo };
}
