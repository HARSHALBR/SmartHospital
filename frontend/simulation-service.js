/*
 * Future backend seam. This module intentionally performs no network requests.
 * See SIMULATION-INTEGRATION.md for the response contract expected by the UI.
 */
(() => {
  const defaultConfig = Object.freeze({
    clients: 3,             // Fixed by the documented Phase 7.3 study topology.
    rounds: 10,             // UI demo default only; not a validated experiment setting.
    localEpochs: 1,         // UI demo default only; not a validated experiment setting.
    dataset: 'edge_iot',
    aggregation: 'fedavg',
  });

  async function runSimulation(_config) {
    throw new Error('Simulation backend integration is pending. No simulation was run.');
  }

  window.SimulationService = Object.freeze({ defaultConfig, runSimulation });
})();
