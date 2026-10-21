/**
 * Simulation Service - Backend Integration Seam
 *
 * Implements the contract documented by Meetal Gaikwad in SIMULATION-INTEGRATION.md
 * and frontend/simulation-service.js.
 */

export const defaultConfig = Object.freeze({
  clients: 3,             // Fixed by documented Phase 7.3 study topology
  rounds: 10,             // UI demo default; not a validated experiment setting
  localEpochs: 1,         // UI demo default; not a validated experiment setting
  dataset: 'edge_iot',    // 'edge_iot' | 'mtsamples' | 'multimodal'
  aggregation: 'fedavg',  // 'fedavg' | 'median'
});

export const DATASET_OPTIONS = [
  { value: 'edge_iot', label: 'Edge-IIoTset · IoT network proxy', description: 'Network intrusion benchmark for IoT flow representation' },
  { value: 'mtsamples', label: 'MTSamples · clinical text proxy', description: 'Public clinical text for semantic representations (unlinked)' },
  { value: 'multimodal', label: 'IoT + clinical text · multi-modal evaluation', description: 'Early concat / late fusion experiment' },
];

export const AGGREGATION_OPTIONS = [
  { value: 'fedavg', label: 'FedAvg · documented baseline', description: 'Standard federated averaging across participating clients' },
  { value: 'median', label: 'Coordinate-wise Median · robustness experiment', description: 'Median aggregation resisting minority sign-flip attacks' },
];

/**
 * Executes or verifies the simulation run according to the agreed contract.
 * Rejects explicitly until the real backend contract is deployed.
 */
export async function runSimulation(config) {
  // Explicit backend integration seam
  throw new Error('Simulation backend integration is pending. No simulation was run.');
}
