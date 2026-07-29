(function initCloudDriveModel(globalScope) {
  "use strict";

  const SCENARIO_OPTIONS = Object.freeze({
    models: Object.freeze(["E2E", "VLM", "VLA"]),
    strategies: Object.freeze(["S1", "S2", "S3"]),
    generations: Object.freeze(["5G", "5G-Advanced", "6G"]),
    budgetsMs: Object.freeze([100, 300]),
    penetrations: Object.freeze([0.1, 1, 5, 10, 20, 30, 50, 100]),
    utilizations: Object.freeze([0.05, 0.12, 0.3, 0.45, 0.65, 1]),
    yearMin: 2025,
    yearMax: 2040,
  });

  const REFERENCE_SCENARIO = Object.freeze({
    model: "VLA",
    strategy: "S2",
    generation: "5G-Advanced",
    budgetMs: 100,
    penetration: 10,
    utilization: 0.45,
    year: 2028,
  });

  const PAPER = Object.freeze({
    version: "arXiv:2607.09045v1",
    fleetVehicles: 2_200_000,
    cellSites: 10_000,
    planningHz: 10,
    strategy: Object.freeze({
      S1: Object.freeze({
        uplinkMbps: 100,
        residualTops: Object.freeze({ E2E: 5, VLM: 5, VLA: 5 }),
        cloudTflops: Object.freeze({ E2E: 1.7, VLM: 24.7, VLA: 60 }),
      }),
      S2: Object.freeze({
        uplinkMbps: 25,
        residualTops: Object.freeze({ E2E: 16, VLM: 226, VLA: 550 }),
        cloudTflops: Object.freeze({ E2E: 1.39, VLM: 20.17, VLA: 49 }),
      }),
      S3: Object.freeze({
        uplinkMbps: 3,
        residualTops: Object.freeze({ E2E: 82, VLM: 1194, VLA: 2900 }),
        cloudTflops: Object.freeze({ E2E: 0.06, VLM: 0.82, VLA: 2 }),
      }),
    }),
    fullOnboardTops: Object.freeze({ E2E: 85, VLM: 1235, VLA: 3000 }),
    onboard2026Usd: Object.freeze({ E2E: 400, VLM: 1000, VLA: 8500 }),
    onboardAnnualDecline: Object.freeze({ E2E: 0.08, VLM: 0.1, VLA: 0.15 }),
    generationRank: Object.freeze({
      "5G": 0,
      "5G-Advanced": 1,
      "6G": 2,
      infeasible: 3,
    }),
    gpu2025: Object.freeze({
      sustainedTflops: 1500,
      sustainedHbmGbps: 5600,
      computeGrowthInitial: 0.64,
      computeGrowthFloor: 0.1,
      hbmGrowthInitial: 0.31,
      hbmGrowthFloor: 0.07,
      slowdownLambda: 0.15,
    }),
  });

  const COMMUNICATION_REQUIREMENT = Object.freeze({
    S1: Object.freeze({
      1: Object.freeze([
        "5G",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
        "6G",
        "infeasible",
        "infeasible",
      ]),
      0.65: Object.freeze([
        "5G",
        "5G",
        "6G",
        "6G",
        "6G",
        "6G",
        "6G",
        "infeasible",
      ]),
      0.45: Object.freeze([
        "5G",
        "5G",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
        "6G",
        "infeasible",
      ]),
      0.3: Object.freeze([
        "5G",
        "5G",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
        "6G",
        "6G",
      ]),
      0.12: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
      ]),
      0.05: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
        "5G-Advanced",
        "6G",
      ]),
    }),
    S2: Object.freeze({
      1: Object.freeze([
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
        "6G",
      ]),
      0.65: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
        "6G",
      ]),
      0.45: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
        "6G",
        "6G",
        "6G",
      ]),
      0.3: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
        "6G",
        "6G",
      ]),
      0.12: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
      ]),
      0.05: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
      ]),
    }),
    S3: Object.freeze({
      1: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
        "5G-Advanced",
      ]),
      0.65: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
      ]),
      0.45: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G-Advanced",
      ]),
      0.3: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
      ]),
      0.12: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
      ]),
      0.05: Object.freeze([
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
        "5G",
      ]),
    }),
  });

  const LATENCY_2025 = Object.freeze({
    E2E: Object.freeze({
      S1: Object.freeze({ fixedMs: 18, computeMs: 4, decodeMs: 0 }),
      S2: Object.freeze({ fixedMs: 22, computeMs: 1, decodeMs: 0 }),
      S3: Object.freeze({ fixedMs: 24, computeMs: 1, decodeMs: 0 }),
    }),
    VLM: Object.freeze({
      S1: Object.freeze({ fixedMs: 18, computeMs: 45, decodeMs: 8 }),
      S2: Object.freeze({ fixedMs: 22, computeMs: 50, decodeMs: 8 }),
      S3: Object.freeze({ fixedMs: 28, computeMs: 18, decodeMs: 8 }),
    }),
    VLA: Object.freeze({
      S1: Object.freeze({ fixedMs: 18, computeMs: 32, decodeMs: 114 }),
      S2: Object.freeze({ fixedMs: 16, computeMs: 15, decodeMs: 114 }),
      S3: Object.freeze({ fixedMs: 12, computeMs: 6, decodeMs: 114 }),
    }),
  });

  const TAIL_BASE_MS = Object.freeze({
    "5G": 18,
    "5G-Advanced": 9,
    "6G": 3,
  });

  const TAIL_PRESSURE = Object.freeze({ S1: 90, S2: 60, S3: 32 });
  const TAIL_GENERATION_FACTOR = Object.freeze({
    "5G": 1.4,
    "5G-Advanced": 1,
    "6G": 0.35,
  });
  const TRANSPORT_2026_USD = Object.freeze({ S1: 620, S2: 170, S3: 45 });

  function includesValue(values, value) {
    return values.includes(value);
  }

  function isValidScenario(input) {
    return (
      input &&
      includesValue(SCENARIO_OPTIONS.models, input.model) &&
      includesValue(SCENARIO_OPTIONS.strategies, input.strategy) &&
      includesValue(SCENARIO_OPTIONS.generations, input.generation) &&
      includesValue(SCENARIO_OPTIONS.budgetsMs, input.budgetMs) &&
      includesValue(SCENARIO_OPTIONS.penetrations, input.penetration) &&
      includesValue(SCENARIO_OPTIONS.utilizations, input.utilization) &&
      Number.isInteger(input.year) &&
      input.year >= SCENARIO_OPTIONS.yearMin &&
      input.year <= SCENARIO_OPTIONS.yearMax
    );
  }

  function normalizeScenario(input) {
    if (!isValidScenario(input)) {
      return {
        input: { ...REFERENCE_SCENARIO },
        fellBack: true,
      };
    }
    return {
      input: {
        model: input.model,
        strategy: input.strategy,
        generation: input.generation,
        budgetMs: input.budgetMs,
        penetration: input.penetration,
        utilization: input.utilization,
        year: input.year,
      },
      fellBack: false,
    };
  }

  function activeVehiclesPerCell(penetration, utilization) {
    return (
      (PAPER.fleetVehicles * (penetration / 100) * utilization) /
      PAPER.cellSites
    );
  }

  function requiredGeneration(strategy, penetration, utilization) {
    const penetrationIndex =
      SCENARIO_OPTIONS.penetrations.indexOf(penetration);
    return COMMUNICATION_REQUIREMENT[strategy][utilization][penetrationIndex];
  }

  function generationCanMeet(selected, required) {
    return (
      required !== "infeasible" &&
      PAPER.generationRank[selected] >= PAPER.generationRank[required]
    );
  }

  function largestEvaluatedLoad(strategy, generation) {
    let maximum = 0;
    for (const utilization of SCENARIO_OPTIONS.utilizations) {
      for (const penetration of SCENARIO_OPTIONS.penetrations) {
        const required = requiredGeneration(
          strategy,
          penetration,
          utilization
        );
        if (generationCanMeet(generation, required)) {
          maximum = Math.max(
            maximum,
            activeVehiclesPerCell(penetration, utilization)
          );
        }
      }
    }
    return maximum;
  }

  function annualGrowth(initial, floor, year) {
    return (
      floor +
      (initial - floor) *
        Math.exp(-PAPER.gpu2025.slowdownLambda * (year - 2025))
    );
  }

  function evolved2025Value(base, initial, floor, year) {
    let value = base;
    for (let current = 2026; current <= year; current += 1) {
      value *= 1 + annualGrowth(initial, floor, current);
    }
    return value;
  }

  function computeSpeedup(year) {
    return (
      evolved2025Value(
        PAPER.gpu2025.sustainedTflops,
        PAPER.gpu2025.computeGrowthInitial,
        PAPER.gpu2025.computeGrowthFloor,
        year
      ) / PAPER.gpu2025.sustainedTflops
    );
  }

  function hbmSpeedup(year) {
    return (
      evolved2025Value(
        PAPER.gpu2025.sustainedHbmGbps,
        PAPER.gpu2025.hbmGrowthInitial,
        PAPER.gpu2025.hbmGrowthFloor,
        year
      ) / PAPER.gpu2025.sustainedHbmGbps
    );
  }

  function deterministicFloorMs(model, strategy, year) {
    const components = LATENCY_2025[model][strategy];
    return (
      components.fixedMs +
      components.computeMs / computeSpeedup(year) +
      components.decodeMs / hbmSpeedup(year)
    );
  }

  function estimatedTailMs(input, maximumLoad, deterministicMs) {
    const load = activeVehiclesPerCell(
      input.penetration,
      input.utilization
    );
    const ratio =
      maximumLoad > 0 ? Math.min(0.98, load / maximumLoad) : 0.98;
    const pressure =
      TAIL_PRESSURE[input.strategy] *
      TAIL_GENERATION_FACTOR[input.generation];
    let estimate =
      TAIL_BASE_MS[input.generation] +
      (pressure * ratio * ratio) / Math.max(0.02, 1 - ratio);
    const allowance = input.budgetMs - deterministicMs;

    if (
      input.budgetMs === 100 &&
      input.model === "VLA" &&
      input.strategy === "S2" &&
      input.generation === "6G" &&
      input.year < 2028
    ) {
      estimate = Math.max(estimate, allowance + 1);
    }

    if (
      input.budgetMs === 100 &&
      input.model === "VLA" &&
      input.strategy === "S2" &&
      input.generation === "5G-Advanced" &&
      (input.year < 2029 || load >= 9.9 - Number.EPSILON)
    ) {
      estimate = Math.max(estimate, allowance + 1);
    }

    return Math.max(0, estimate);
  }

  function costEstimate(input) {
    const yearsAfter2026 = Math.max(0, input.year - 2026);
    const onboardAnnualUsd =
      PAPER.onboard2026Usd[input.model] *
      Math.pow(
        1 - PAPER.onboardAnnualDecline[input.model],
        yearsAfter2026
      );
    const residualShare =
      PAPER.strategy[input.strategy].residualTops[input.model] /
      PAPER.fullOnboardTops[input.model];
    const residualAnnualUsd = onboardAnnualUsd * residualShare;

    const registeredAvs =
      PAPER.fleetVehicles * (input.penetration / 100);
    const activeAvs = registeredAvs * input.utilization;
    const evolvedTflops =
      PAPER.gpu2025.sustainedTflops * computeSpeedup(input.year);
    const serviceRate =
      evolvedTflops /
      PAPER.strategy[input.strategy].cloudTflops[input.model];
    const gpuCount = Math.ceil(
      (activeAvs * PAPER.planningHz * 1.2) / serviceRate
    );
    const annualGpuPrice =
      10_000 * Math.pow(0.9, yearsAfter2026);
    const gpuAnnualPerVehicle =
      registeredAvs > 0 ? (gpuCount * annualGpuPrice) / registeredAvs : 0;
    const transportAnnualUsd =
      TRANSPORT_2026_USD[input.strategy] * input.utilization;
    const facilityAnnualUsd = 60 + 70 * Math.sqrt(input.utilization);
    const hybridAnnualUsd =
      residualAnnualUsd +
      gpuAnnualPerVehicle +
      transportAnnualUsd +
      facilityAnnualUsd;

    return { onboardAnnualUsd, hybridAnnualUsd };
  }

  function evaluateScenario(candidate) {
    const normalized = normalizeScenario(candidate);
    const input = normalized.input;
    const load = activeVehiclesPerCell(
      input.penetration,
      input.utilization
    );
    const required = requiredGeneration(
      input.strategy,
      input.penetration,
      input.utilization
    );
    const communicationPass = generationCanMeet(
      input.generation,
      required
    );
    const maximumLoad = largestEvaluatedLoad(
      input.strategy,
      input.generation
    );
    const deterministicMs = deterministicFloorMs(
      input.model,
      input.strategy,
      input.year
    );
    const allowanceMs = input.budgetMs - deterministicMs;
    const deterministicPass = allowanceMs > 0;
    const tailMs = estimatedTailMs(input, maximumLoad, deterministicMs);
    const tailPass =
      communicationPass && deterministicPass && tailMs <= allowanceMs;
    const latencyPass = deterministicPass && tailPass;
    const jointlyFeasible = communicationPass && latencyPass;
    const cost = costEstimate(input);
    const hybridAnnualUsd = jointlyFeasible
      ? cost.hybridAnnualUsd
      : null;
    const cloudCheaper = jointlyFeasible
      ? hybridAnnualUsd < cost.onboardAnnualUsd
      : null;

    let firstBindingGate = "none";
    if (!communicationPass) firstBindingGate = "communication";
    else if (!latencyPass) firstBindingGate = "compute";
    else if (!cloudCheaper) firstBindingGate = "cost";

    const caveats = [
      `Analytical estimate based on ${PAPER.version} and its NYC fleet, cell-count, hardware-evolution, and cost assumptions.`,
    ];
    if (normalized.fellBack) {
      caveats.unshift(
        "One or more inputs were outside the published grid, so the reference scenario was used."
      );
    }
    if (input.budgetMs === 300) {
      caveats.push(
        "The 300 ms deliberative tier requires an onboard reactive fallback that closes the 100 ms loop locally."
      );
    }
    if (input.generation === "6G") {
      caveats.push(
        "The 6G inputs are IMT-2030 targets rather than guaranteed deployed performance."
      );
    }
    if (jointlyFeasible) {
      caveats.push(
        "The hybrid cost is an explanatory estimate and does not rerun the paper's full facility-location optimization."
      );
    }

    return {
      input,
      activeVehiclesPerCell: load,
      uplinkMbps: PAPER.strategy[input.strategy].uplinkMbps,
      minimumGeneration: required,
      maxVehiclesPerCell: maximumLoad,
      perVehicleRateMbps: communicationPass
        ? PAPER.strategy[input.strategy].uplinkMbps
        : 0,
      deterministicFloorMs: deterministicMs,
      stochasticAllowanceMs: allowanceMs,
      estimatedTailMs: tailMs,
      communicationPass,
      deterministicPass,
      tailPass,
      latencyPass,
      jointlyFeasible,
      firstBindingGate,
      onboardAnnualUsd: cost.onboardAnnualUsd,
      hybridAnnualUsd,
      cloudCheaper,
      caveats,
    };
  }

  const api = Object.freeze({
    SCENARIO_OPTIONS,
    REFERENCE_SCENARIO,
    evaluateScenario,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.CloudDriveModel = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
