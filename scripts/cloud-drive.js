(() => {
  "use strict";

  const model = globalThis.CloudDriveModel;
  const form = document.querySelector("#scenario-form");
  const resultRegion = document.querySelector("#scenario-result");

  if (!model || !form || !resultRegion) return;

  const yearInput = form.querySelector('[name="year"]');
  const yearOutput = form.querySelector('output[for="scenario-year"]');
  const selection = document.querySelector("#scenario-selection");
  const summary = document.querySelector("#binding-summary");
  const caveats = document.querySelector("#scenario-caveats");
  const hashFields = [
    "model",
    "strategy",
    "generation",
    "budgetMs",
    "penetration",
    "utilization",
    "year",
  ];

  const number = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  });
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  function readScenario() {
    const data = new FormData(form);
    return {
      model: data.get("model"),
      strategy: data.get("strategy"),
      generation: data.get("generation"),
      budgetMs: Number(data.get("budgetMs")),
      penetration: Number(data.get("penetration")),
      utilization: Number(data.get("utilization")),
      year: Number(data.get("year")),
    };
  }

  function setGate(id, state, title, detail) {
    const gate = document.querySelector(id);
    gate.dataset.state = state;
    gate.querySelector(".gate-status").textContent = title;
    gate.querySelector(".gate-detail").textContent = detail;
  }

  function renderScenario(result) {
    const input = result.input;
    yearOutput.textContent = input.year;
    selection.textContent =
      `${input.model} · ${input.strategy} · ${input.generation} · ` +
      `${input.penetration}% penetration · ` +
      `${number.format(input.utilization * 100)}% utilization · ${input.year}`;

    const communicationDetail = result.communicationPass
      ? `${number.format(result.activeVehiclesPerCell)} active vehicles/cell; ` +
        `${result.uplinkMbps} Mbps target. ${input.generation} meets the ` +
        `${result.minimumGeneration} minimum for this evaluated grid cell.`
      : `${number.format(result.activeVehiclesPerCell)} active vehicles/cell; ` +
        `${result.uplinkMbps} Mbps target. This cell requires ` +
        `${result.minimumGeneration === "infeasible" ? "more than the evaluated 6G envelope" : result.minimumGeneration}.`;

    setGate(
      "#gate-communication",
      result.communicationPass ? "pass" : "fail",
      result.communicationPass ? "Pass" : "Does not pass",
      communicationDetail
    );

    let computeDetail =
      `${number.format(result.deterministicFloorMs)} ms deterministic floor; ` +
      `${number.format(result.estimatedTailMs)} ms estimated stochastic tail ` +
      `inside a ${input.budgetMs} ms tier.`;
    if (!result.deterministicPass) {
      computeDetail =
        `${number.format(result.deterministicFloorMs)} ms deterministic floor ` +
        `already exceeds the ${input.budgetMs} ms tier.`;
    } else if (!result.communicationPass) {
      computeDetail =
        "Not evaluated because the selected access network cannot admit the workload.";
    }

    setGate(
      "#gate-compute",
      !result.communicationPass
        ? "blocked"
        : result.latencyPass
          ? "pass"
          : "fail",
      !result.communicationPass
        ? "Not evaluated"
        : result.latencyPass
          ? "Pass"
          : "Does not pass",
      computeDetail
    );

    const costDetail = result.jointlyFeasible
      ? `${currency.format(result.hybridAnnualUsd)} hybrid estimate vs. ` +
        `${currency.format(result.onboardAnnualUsd)} onboard per vehicle-year.`
      : "Cost is withheld until communication and latency both pass.";

    setGate(
      "#gate-cost",
      !result.jointlyFeasible
        ? "blocked"
        : result.cloudCheaper
          ? "pass"
          : "fail",
      !result.jointlyFeasible
        ? "Not evaluated"
        : result.cloudCheaper
          ? "Cloud estimate is lower"
          : "Onboard estimate is lower",
      costDetail
    );

    const bindingCopy = {
      communication: "Communication is the first binding gate.",
      compute: "Compute and tail latency are the first binding gate.",
      cost: "Cost is the first binding gate.",
      none: "This branch clears all three gates.",
    };
    summary.textContent = bindingCopy[result.firstBindingGate];
    caveats.textContent = result.caveats.join(" ");
  }

  function writeScenarioHash(result) {
    const serialized = hashFields
      .map((field) => result.input[field])
      .join("|");
    history.replaceState(
      null,
      "",
      `#scenario=${encodeURIComponent(serialized)}`
    );
  }

  function setControlValue(name, value) {
    const control = form.elements.namedItem(name);
    if (!control) return;

    if (control instanceof HTMLSelectElement) {
      const exists = Array.from(control.options).some(
        (option) => option.value === value
      );
      if (exists) control.value = value;
      return;
    }

    if (control instanceof HTMLInputElement) {
      const numeric = Number(value);
      const minimum = Number(control.min);
      const maximum = Number(control.max);
      if (
        Number.isInteger(numeric) &&
        numeric >= minimum &&
        numeric <= maximum
      ) {
        control.value = String(numeric);
      }
    }
  }

  function readScenarioHash() {
    if (!location.hash.startsWith("#scenario=")) return;
    const values = decodeURIComponent(
      location.hash.slice("#scenario=".length)
    ).split("|");
    if (values.length !== hashFields.length) return;
    hashFields.forEach((field, index) =>
      setControlValue(field, values[index])
    );
  }

  function update(share) {
    const result = globalThis.CloudDriveModel.evaluateScenario(readScenario());
    renderScenario(result);
    if (share) writeScenarioHash(result);
  }

  readScenarioHash();
  form.addEventListener("input", () => update(true));
  yearInput.addEventListener("input", () => {
    yearOutput.textContent = yearInput.value;
  });
  update(false);
})();
