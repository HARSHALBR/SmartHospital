# Simulation backend integration seam

The Simulation page is intentionally frontend-only. It makes no simulation API calls and has no generated metrics or run logs.

## Frontend configuration contract

`window.SimulationService.defaultConfig` documents the current page shape:

```js
{
  clients: 3,             // fixed to documented Phase 7.3 topology
  rounds: 10,             // frontend demo default only; confirm with experiment owner
  localEpochs: 1,         // frontend demo default only; confirm with experiment owner
  dataset: 'edge_iot',    // edge_iot | mtsamples | multimodal
  aggregation: 'fedavg',  // fedavg | median
}
```

Implement `SimulationService.runSimulation(config)` in `simulation-service.js` when the backend contract exists. The current implementation rejects explicitly and sends no request. The page must continue to show a pending state until there is a real response.

## Suggested response shape

Adapt the page to the agreed API response rather than fabricating defaults. A useful typed shape for the UI is:

```js
{
  runId: string,
  status: 'queued' | 'running' | 'completed' | 'failed',
  progress: { currentRound: number, totalRounds: number },
  metrics: {
    accuracy?: number,
    precision?: number,
    recall?: number,
    f1?: number,
    loss?: number
  } | null,
  series: { round: number, loss?: number, f1?: number }[],
  comparison: { model: string, metrics: Record<string, number> }[],
  logs: { timestamp: string, level: string, message: string }[]
}
```

Only render returned fields; retain the empty and error states when data is absent. Confirm that rounds and epochs are supported before enabling the inputs as backend run parameters. The existing backend exposes frozen metrics and a separate inference endpoint; neither currently starts a simulation.
