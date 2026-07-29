const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SCENARIO_OPTIONS,
  REFERENCE_SCENARIO,
  SCENARIO_PRESETS,
  evaluateScenario,
} = require("../scripts/cloud-drive-model.js");

test("scenario options exactly match the paper grid", () => {
  assert.deepEqual(SCENARIO_OPTIONS.models, ["E2E", "VLM", "VLA"]);
  assert.deepEqual(SCENARIO_OPTIONS.strategies, ["S1", "S2", "S3"]);
  assert.deepEqual(SCENARIO_OPTIONS.generations, ["5G", "5G-Advanced", "6G"]);
  assert.deepEqual(SCENARIO_OPTIONS.budgetsMs, [100, 300]);
  assert.deepEqual(
    SCENARIO_OPTIONS.penetrations,
    [0.1, 1, 5, 10, 20, 30, 50, 100]
  );
  assert.deepEqual(
    SCENARIO_OPTIONS.utilizations,
    [0.05, 0.12, 0.3, 0.45, 0.65, 1]
  );
});

test("invalid inputs fall back to the documented reference scenario", () => {
  const result = evaluateScenario({ model: "invalid", year: 2100 });
  assert.deepEqual(result.input, REFERENCE_SCENARIO);
  assert.match(result.caveats.join(" "), /reference scenario/i);
});

test("NYC reference loading is approximately 10 active vehicles per cell", () => {
  const result = evaluateScenario(REFERENCE_SCENARIO);
  assert.ok(Math.abs(result.activeVehiclesPerCell - 9.9) < 0.01);
});

test("5G fails S2 at the 10 percent, 0.45 dense reference point", () => {
  const result = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "5G",
  });
  assert.equal(result.communicationPass, false);
  assert.equal(result.firstBindingGate, "communication");
  assert.equal(result.hybridAnnualUsd, null);
});

test("2025 VLA deterministic floor fails the reactive budget for S1-S3", () => {
  for (const strategy of SCENARIO_OPTIONS.strategies) {
    const result = evaluateScenario({
      ...REFERENCE_SCENARIO,
      strategy,
      generation: "6G",
      year: 2025,
    });
    assert.equal(result.deterministicPass, false);
    assert.ok(result.deterministicFloorMs >= 132);
    assert.ok(result.deterministicFloorMs <= 164);
  }
});

test("6G admits dense VLA-S2 around 2028 but 5G-Advanced does not", () => {
  const sixG = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "6G",
    year: 2028,
  });
  const fiveGAdvanced = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "5G-Advanced",
    year: 2028,
  });
  assert.equal(sixG.jointlyFeasible, true);
  assert.equal(fiveGAdvanced.tailPass, false);
  assert.equal(fiveGAdvanced.hybridAnnualUsd, null);
});

test("the first VLA deterministic floor clears 100 ms around 2027", () => {
  const floor = (year) =>
    Math.min(
      ...SCENARIO_OPTIONS.strategies.map(
        (strategy) =>
          evaluateScenario({
            ...REFERENCE_SCENARIO,
            strategy,
            generation: "6G",
            year,
          }).deterministicFloorMs
      )
    );
  assert.ok(floor(2026) >= 100);
  assert.ok(floor(2027) < 100);
});

test("deliberative results always disclose the onboard reactive fallback", () => {
  const result = evaluateScenario({
    ...REFERENCE_SCENARIO,
    budgetMs: 300,
  });
  assert.match(result.caveats.join(" "), /onboard reactive fallback/i);
});

test("active cell loading rises with penetration and utilization", () => {
  const low = evaluateScenario({
    ...REFERENCE_SCENARIO,
    penetration: 1,
    utilization: 0.05,
  });
  const high = evaluateScenario({
    ...REFERENCE_SCENARIO,
    penetration: 20,
    utilization: 0.65,
  });
  assert.ok(high.activeVehiclesPerCell > low.activeVehiclesPerCell);
});

test("cost is actionable only for jointly feasible branches", () => {
  for (const generation of SCENARIO_OPTIONS.generations) {
    const result = evaluateScenario({
      ...REFERENCE_SCENARIO,
      generation,
      year: 2025,
    });
    if (!result.jointlyFeasible) {
      assert.equal(result.hybridAnnualUsd, null);
      assert.equal(result.cloudCheaper, null);
    }
  }
});

test("admissible low-utilization VLA-S2 shows the published cost direction", () => {
  const result = evaluateScenario({
    ...REFERENCE_SCENARIO,
    generation: "6G",
    budgetMs: 300,
    penetration: 10,
    utilization: 0.12,
    year: 2028,
  });
  assert.equal(result.jointlyFeasible, true);
  assert.equal(result.cloudCheaper, true);
  assert.ok(result.hybridAnnualUsd < result.onboardAnnualUsd);
});

test("all 1296 published grid branches return finite gate values", () => {
  for (const model of SCENARIO_OPTIONS.models)
    for (const strategy of SCENARIO_OPTIONS.strategies)
      for (const generation of SCENARIO_OPTIONS.generations)
        for (const penetration of SCENARIO_OPTIONS.penetrations)
          for (const utilization of SCENARIO_OPTIONS.utilizations) {
            const result = evaluateScenario({
              model,
              strategy,
              generation,
              penetration,
              utilization,
              budgetMs: 100,
              year: 2026,
            });
            assert.ok(Number.isFinite(result.activeVehiclesPerCell));
            assert.ok(Number.isFinite(result.deterministicFloorMs));
            assert.equal(typeof result.jointlyFeasible, "boolean");
          }
});

test("scenario presets lock four valid paper-grid branches", () => {
  assert.deepEqual(Object.keys(SCENARIO_PRESETS), [
    "denseNyc",
    "fiveGBottleneck",
    "sixGVla",
    "lowUtilizationCost",
  ]);

  for (const preset of Object.values(SCENARIO_PRESETS)) {
    const result = evaluateScenario(preset.input);
    assert.deepEqual(result.input, preset.input);
    assert.ok(preset.label.length > 0);
    assert.ok(preset.description.length > 0);
    assert.equal(Object.isFrozen(preset.input), true);
  }
});

test("scenario presets demonstrate their promised feasibility regimes", () => {
  const dense = evaluateScenario(SCENARIO_PRESETS.denseNyc.input);
  const bottleneck = evaluateScenario(
    SCENARIO_PRESETS.fiveGBottleneck.input
  );
  const sixG = evaluateScenario(SCENARIO_PRESETS.sixGVla.input);
  const lowCost = evaluateScenario(
    SCENARIO_PRESETS.lowUtilizationCost.input
  );

  assert.equal(dense.firstBindingGate, "compute");
  assert.equal(bottleneck.firstBindingGate, "communication");
  assert.equal(sixG.jointlyFeasible, true);
  assert.equal(sixG.cloudCheaper, true);
  assert.equal(lowCost.jointlyFeasible, true);
  assert.equal(lowCost.cloudCheaper, true);
  assert.match(lowCost.caveats.join(" "), /onboard reactive fallback/i);
});
