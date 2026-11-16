/**
 * Distribui blocos que se sobrepõem em faixas lado a lado (como num calendário).
 * Cada bloco recebe `lane` (sua faixa) e `lanes` (quantas faixas o seu grupo de sobreposição usa).
 * `start` e `end` em minutos.
 */
export function assignLanes<T extends { start: number; end: number }>(items: T[]) {
  type Placed = T & { lane: number; lanes: number };
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed[] = [];
  let group: Placed[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    for (const p of group) p.lanes = laneEnds.length;
    out.push(...group);
    group = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (group.length && item.start >= groupEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.push(item.end) - 1;
    else laneEnds[lane] = item.end;
    group.push({ ...item, lane, lanes: 0 });
    groupEnd = group.length === 1 ? item.end : Math.max(groupEnd, item.end);
  }
  flush();
  return out;
}
