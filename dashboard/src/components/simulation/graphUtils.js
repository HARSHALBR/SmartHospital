/**
 * Graph topological utilities for calculating GraphSAGE aggregation neighborhoods.
 */

/**
 * Computes 1-hop and 2-hop neighborhoods for a given node based on graph adjacency edges.
 * @param {string} nodeId - Target node ID
 * @param {Array<{source: string, target: string}>} edges - List of undirected or bi-directional edges
 * @returns {{ oneHop: string[], twoHop: string[] }}
 */
export function computeNeighborhoods(nodeId, edges) {
  if (!nodeId || !Array.isArray(edges)) {
    return { oneHop: [], twoHop: [] };
  }

  // 1-Hop: All immediate adjacent nodes
  const oneHopSet = new Set();
  edges.forEach((edge) => {
    if (edge.source === nodeId) oneHopSet.add(edge.target);
    if (edge.target === nodeId) oneHopSet.add(edge.source);
  });

  // 2-Hop: Reachable via a 1-hop node, excluding the target node itself and 1-hop neighbors
  const twoHopSet = new Set();
  oneHopSet.forEach((neighborId) => {
    edges.forEach((edge) => {
      if (edge.source === neighborId) {
        if (edge.target !== nodeId && !oneHopSet.has(edge.target)) {
          twoHopSet.add(edge.target);
        }
      }
      if (edge.target === neighborId) {
        if (edge.source !== nodeId && !oneHopSet.has(edge.source)) {
          twoHopSet.add(edge.source);
        }
      }
    });
  });

  return {
    oneHop: Array.from(oneHopSet),
    twoHop: Array.from(twoHopSet)
  };
}
