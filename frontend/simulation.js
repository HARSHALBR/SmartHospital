/* UI-only Simulation page. Configuration is local to the browser until a real service is connected. */
(() => {
  const defaults = window.SimulationService.defaultConfig;
  let config = { ...defaults };

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
  })[char]);

  function render() {
    return `
      <div class="simulation-page">
        <div class="page-heading">
          <div>
            <p class="overline">FEDERATED EXPERIMENT WORKSPACE</p>
            <h1>Simulation</h1>
            <p>Configure a frontend preview of the research workflow. Execution and results will be connected when the simulation backend is ready.</p>
          </div>
          <span class="sim-status"><i aria-hidden="true"></i>Backend integration pending</span>
        </div>

        <div class="sim-notice" role="status"><span class="sim-notice-icon" aria-hidden="true">i</span><span><strong>Configuration preview only.</strong> These controls do not start training, send requests, or generate experimental results.</span></div>

        <div class="sim-layout">
          <section class="card section-card sim-config" aria-labelledby="sim-config-heading">
            <div class="section-title"><div><h2 id="sim-config-heading">Simulation configuration</h2><p>Editable demo values for a future backend request</p></div><span class="tag info">FRONTEND PREVIEW</span></div>
            <form id="simulation-config" novalidate>
              <div class="sim-field">
                <label for="sim-clients">Participating edge clients</label>
                <input id="sim-clients" name="clients" type="number" value="${config.clients}" readonly aria-describedby="clients-help">
                <small id="clients-help">Fixed at 3 to match the documented Phase 7.3 topology.</small>
              </div>
              <div class="sim-form-row">
                <div class="sim-field"><label for="sim-rounds">Communication rounds</label><input id="sim-rounds" name="rounds" type="number" min="1" max="100" value="${escapeHtml(config.rounds)}" required aria-describedby="rounds-help"><small id="rounds-help">Proposed UI default; not a validated study setting.</small></div>
                <div class="sim-field"><label for="sim-epochs">Local training epochs</label><input id="sim-epochs" name="localEpochs" type="number" min="1" max="50" value="${escapeHtml(config.localEpochs)}" required aria-describedby="epochs-help"><small id="epochs-help">Proposed UI default; not a validated study setting.</small></div>
              </div>
              <div class="sim-field"><label for="sim-dataset">Research data configuration</label><select id="sim-dataset" name="dataset"><option value="edge_iot" ${config.dataset==='edge_iot'?'selected':''}>Edge-IIoTset · IoT network proxy</option><option value="mtsamples" ${config.dataset==='mtsamples'?'selected':''}>MTSamples · clinical text proxy</option><option value="multimodal" ${config.dataset==='multimodal'?'selected':''}>IoT + clinical text · multi-modal evaluation</option></select><small>Public proxy datasets only. No real patient or hospital telemetry is used.</small></div>
              <div class="sim-field"><label for="sim-aggregation">Aggregation method</label><select id="sim-aggregation" name="aggregation"><option value="fedavg" ${config.aggregation==='fedavg'?'selected':''}>FedAvg · documented baseline</option><option value="median" ${config.aggregation==='median'?'selected':''}>Coordinate-wise Median · robustness experiment</option></select><small>Available methods reflect the documented research comparisons.</small></div>
              <div class="sim-actions"><button type="button" class="button primary" id="sim-start" disabled aria-describedby="sim-start-help"><span aria-hidden="true">▷</span> Start simulation</button><button type="button" class="button" id="sim-reset">Reset configuration</button></div>
              <p class="sim-start-help" id="sim-start-help">Execution is disabled until your teammate connects the simulation backend.</p>
            </form>
          </section>

          <section class="card section-card sim-workflow" aria-labelledby="sim-workflow-heading">
            <div class="section-title"><div><h2 id="sim-workflow-heading">Research workflow preview</h2><p>Intended data and model flow</p></div><button type="button" class="quiet-link sim-details-trigger" id="sim-details">View simulation details <span aria-hidden="true">↗</span></button></div>
            <ol class="sim-steps">
              <li><span class="sim-step-icon">⌂</span><div><strong>Hospital edge clients</strong><small>Three simulated clients retain local samples</small></div></li>
              <li><span class="sim-step-icon">⚙</span><div><strong>Local model training</strong><small>Client-side training on configured proxy data</small></div></li>
              <li><span class="sim-step-icon">⇧</span><div><strong>Exchange model updates</strong><small>Model parameters, rather than raw records</small></div></li>
              <li><span class="sim-step-icon">◎</span><div><strong>Federated aggregation</strong><small>FedAvg baseline or Median robustness method</small></div></li>
              <li><span class="sim-step-icon">▤</span><div><strong>Global model evaluation</strong><small>Metrics will appear here after backend integration</small></div></li>
            </ol>
            <div class="sim-scope-note"><strong>Research boundary</strong><span>Local data handling is a design property of this simulation, not a formal privacy guarantee. Differential privacy was not established in the documented study.</span></div>
          </section>
        </div>

        <section class="card section-card sim-output" aria-labelledby="sim-output-heading">
          <div class="section-title"><div><h2 id="sim-output-heading">Simulation output</h2><p>Reserved for backend-reported values and status</p></div><span class="tag proxy">AWAITING BACKEND</span></div>
          <div class="sim-output-grid">
            <article class="sim-output-card"><div class="sim-output-label">Model performance</div><strong>—</strong><small>F1 · accuracy · precision · recall</small></article>
            <article class="sim-output-card"><div class="sim-output-label">Training progress</div><strong>—</strong><small>Current / total communication rounds</small></article>
            <article class="sim-output-card"><div class="sim-output-label">Evaluation comparison</div><strong>—</strong><small>Local and federated model metrics</small></article>
          </div>
          <div class="sim-empty-panels">
            <div class="sim-empty"><span class="sim-empty-icon" aria-hidden="true">⌁</span><strong>Training curves will appear here</strong><p>Loss and evaluation series require actual round-by-round backend output.</p></div>
            <div class="sim-empty"><span class="sim-empty-icon" aria-hidden="true">≡</span><strong>Simulation log is empty</strong><p>No run has been submitted. Real status events will be shown after integration.</p></div>
          </div>
        </section>

        <section class="sim-info-strip"><div><span class="overline">WHAT THIS STUDY EXAMINES</span><h2>Collaborative learning under research constraints</h2></div><p>The project evaluates whether federated IoT anomaly detection can approach a centralized baseline, then tests non-IID client distributions, sign-flip attacks, and privacy mechanisms. Results use Edge-IIoTset and MTSamples proxies; they do not establish clinical effectiveness, production security, HIPAA compliance, or formal differential privacy.</p></section>

        <dialog class="sim-dialog" id="sim-dialog" aria-labelledby="sim-dialog-title"><div class="sim-dialog-header"><div><p class="overline">SIMULATION DETAILS</p><h2 id="sim-dialog-title">What this page will run</h2></div><button class="icon-button" id="sim-dialog-close" aria-label="Close simulation details">×</button></div><p>The future run is intended to configure a research experiment across the documented three-client topology. The selected client dataset proxy and aggregation method will be passed to a backend once that contract is agreed.</p><ul><li>Three clients are based on the Phase 7.3 study topology.</li><li>Round and epoch values are frontend demo defaults only and require backend and experiment-owner agreement.</li><li>No raw samples, model updates, or training requests are sent from this page today.</li><li>Results will remain empty until returned by a real backend execution.</li></ul><button type="button" class="button primary" id="sim-dialog-done">Close details</button></dialog>
      </div>`;
  }

  function readForm(form) {
    const formData = new FormData(form);
    return {
      clients: defaults.clients,
      rounds: Number(formData.get('rounds')),
      localEpochs: Number(formData.get('localEpochs')),
      dataset: String(formData.get('dataset')),
      aggregation: String(formData.get('aggregation')),
    };
  }

  function mount(root) {
    const form = root.querySelector('#simulation-config');
    const rounds = root.querySelector('#sim-rounds');
    const epochs = root.querySelector('#sim-epochs');
    const dataset = root.querySelector('#sim-dataset');
    const aggregation = root.querySelector('#sim-aggregation');
    const dialog = root.querySelector('#sim-dialog');

    form.addEventListener('input', () => {
      if (form.checkValidity()) config = readForm(form);
    });
    form.addEventListener('change', () => { if (form.checkValidity()) config = readForm(form); });
    root.querySelector('#sim-reset').addEventListener('click', () => {
      config = { ...defaults };
      rounds.value = config.rounds;
      epochs.value = config.localEpochs;
      dataset.value = config.dataset;
      aggregation.value = config.aggregation;
      form.classList.remove('was-validated');
      rounds.setCustomValidity(''); epochs.setCustomValidity('');
      rounds.focus();
    });
    root.querySelector('#sim-details').addEventListener('click', () => dialog.showModal());
    root.querySelector('#sim-dialog-close').addEventListener('click', () => dialog.close());
    root.querySelector('#sim-dialog-done').addEventListener('click', () => dialog.close());
    [rounds, epochs].forEach(input => input.addEventListener('change', () => {
      input.setCustomValidity(input.validity.valid ? '' : 'Choose a value within the allowed range.');
      input.reportValidity();
    }));
  }

  window.SimulationPage = Object.freeze({ render, mount });
})();
