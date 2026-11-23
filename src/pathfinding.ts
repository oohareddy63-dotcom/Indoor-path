import {
  edges as staticEdges,
  nodes as staticNodes,
  type HospitalEdge,
  type HospitalNode,
} from "./data";

export interface RouteResult {
  nodeIds: string[];
  edges: HospitalEdge[];
  distance: number;
}

export interface PathfindingOptions {
  accessible?: boolean;
  blockedEdges?: Set<string>;
  avoidEdges?: Set<string>;
}

function heuristic(
  from: string,
  to: string,
  nodeById: Map<string, HospitalNode>,
): number {
  const a = nodeById.get(from);
  const b = nodeById.get(to);
  if (!a || !b) return 0;
  return (
    Math.abs(a.x - b.x) * 0.12 +
    Math.abs(a.y - b.y) * 0.12 +
    Math.abs(a.floor - b.floor) * 8
  );
}

export function findRoute(
  start: string,
  goal: string,
  options: PathfindingOptions = {},
  liveEdges?: HospitalEdge[],
  liveNodes?: HospitalNode[],
): RouteResult | null {
  const edgeList = liveEdges && liveEdges.length ? liveEdges : staticEdges;
  const nodeList = liveNodes && liveNodes.length ? liveNodes : staticNodes;
  const nodeById = new Map(nodeList.map((n) => [n.id, n]));

  const blocked = options.blockedEdges ?? new Set<string>();
  const avoided = options.avoidEdges ?? new Set<string>();

  const open = new Set([start]);
  const cameFrom = new Map<string, { node: string; edge: HospitalEdge }>();
  const g = new Map<string, number>([[start, 0]]);
  const f = new Map<string, number>([[start, heuristic(start, goal, nodeById)]]);

  while (open.size) {
    const current = [...open].reduce((best, id) =>
      (f.get(id) ?? Infinity) < (f.get(best) ?? Infinity) ? id : best,
    );

    if (current === goal) {
      const nodeIds: string[] = [current];
      const routeEdges: HospitalEdge[] = [];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        const prev = cameFrom.get(cursor)!;
        routeEdges.unshift(prev.edge);
        nodeIds.unshift(prev.node);
        cursor = prev.node;
      }
      return { nodeIds, edges: routeEdges, distance: Math.round(g.get(goal) ?? 0) };
    }

    open.delete(current);

    for (const edge of edgeList) {
      if (blocked.has(edge.id)) continue;
      if (options.accessible && !edge.accessible) continue;

      const neighbor =
        edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (!neighbor) continue;

      const liftBias   = options.accessible && edge.type === "lift" ? -2 : 0;
      const avoidExtra = avoided.has(edge.id) ? 60 : 0;
      const tentative  = (g.get(current) ?? Infinity) + edge.distance + liftBias + avoidExtra;

      if (tentative < (g.get(neighbor) ?? Infinity)) {
        cameFrom.set(neighbor, { node: current, edge });
        g.set(neighbor, tentative);
        f.set(neighbor, tentative + heuristic(neighbor, goal, nodeById));
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
  liveEdges?: HospitalEdge[],
  liveNodes?: HospitalNode[],
): RouteResult | null {
  const avoidEdges = new Set(
    [...current.edges]
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 2)
      .map((e) => e.id),
  );
  return findRoute(
    start, goal,
    { accessible, blockedEdges, avoidEdges },
    liveEdges, liveNodes,
  );
}
