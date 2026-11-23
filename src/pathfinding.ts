import { edges, nodes, type HospitalEdge } from "./data";

export interface RouteResult {
  nodeIds: string[];
  edges: HospitalEdge[];
  distance: number;
}

const nodeById = new Map(nodes.map((node) => [node.id, node]));

function heuristic(from: string, to: string) {
  const a = nodeById.get(from);
  const b = nodeById.get(to);
  if (!a || !b) return 0;
  return Math.abs(a.x - b.x) * 0.12 + Math.abs(a.y - b.y) * 0.12 + Math.abs(a.floor - b.floor) * 8;
}

export function findRoute(
  start: string,
  goal: string,
  options: { accessible?: boolean; blockedEdges?: Set<string>; avoidEdges?: Set<string> } = {},
): RouteResult | null {
  const blocked = options.blockedEdges ?? new Set<string>();
  const avoided = options.avoidEdges ?? new Set<string>();
  const open = new Set([start]);
  const cameFrom = new Map<string, { node: string; edge: HospitalEdge }>();
  const g = new Map<string, number>([[start, 0]]);
  const f = new Map<string, number>([[start, heuristic(start, goal)]]);

  while (open.size) {
    const current = [...open].reduce((best, id) => (f.get(id)! < f.get(best)! ? id : best));
    if (current === goal) {
      const nodeIds = [current];
      const routeEdges: HospitalEdge[] = [];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        const previous = cameFrom.get(cursor)!;
        routeEdges.unshift(previous.edge);
        nodeIds.unshift(previous.node);
        cursor = previous.node;
      }
      return { nodeIds, edges: routeEdges, distance: Math.round(g.get(goal) ?? 0) };
    }

    open.delete(current);
    for (const routeEdge of edges) {
      if (blocked.has(routeEdge.id) || (options.accessible && !routeEdge.accessible)) continue;
      const neighbor =
        routeEdge.from === current
          ? routeEdge.to
          : routeEdge.to === current
            ? routeEdge.from
            : null;
      if (!neighbor) continue;
      const accessibleBias = options.accessible && routeEdge.type === "lift" ? -2 : 0;
      const avoidPenalty = avoided.has(routeEdge.id) ? 60 : 0;
      const tentative =
        (g.get(current) ?? Infinity) + routeEdge.distance + accessibleBias + avoidPenalty;
      if (tentative < (g.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, { node: current, edge: routeEdge });
        g.set(neighbor, tentative);
        f.set(neighbor, tentative + heuristic(neighbor, goal));
        open.add(neighbor);
      }
    }
  }
  return null;
}

export function findAlternative(
  start: string,
  goal: string,
  current: RouteResult,
  accessible = false,
  blockedEdges = new Set<string>(),
) {
  const mostSignificant = [...current.edges]
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 2)
    .map((routeEdge) => routeEdge.id);
  return findRoute(start, goal, { accessible, blockedEdges, avoidEdges: new Set(mostSignificant) });
}
