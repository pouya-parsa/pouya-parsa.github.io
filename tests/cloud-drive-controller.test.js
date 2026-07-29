const test = require("node:test");
const assert = require("node:assert/strict");
const {
  serializeScenario,
  parseScenarioHash,
} = require("../scripts/cloud-drive.js");
const {
  REFERENCE_SCENARIO,
  SCENARIO_PRESETS,
  evaluateScenario,
} = require("../scripts/cloud-drive-model.js");

test("scenario hash round-trips typed inputs", () => {
  for (const preset of Object.values(SCENARIO_PRESETS)) {
    const hash = serializeScenario(preset.input);
    assert.match(hash, /^#scenario=/);
    assert.deepEqual(parseScenarioHash(hash), preset.input);
  }
});

test("malformed scenario hashes return null", () => {
  assert.equal(parseScenarioHash(""), null);
  assert.equal(parseScenarioHash("#other=value"), null);
  assert.equal(parseScenarioHash("#scenario=VLA%7CS2"), null);
});

test("parsed shared scenarios remain validated by the model", () => {
  const parsed = parseScenarioHash(serializeScenario(REFERENCE_SCENARIO));
  assert.deepEqual(evaluateScenario(parsed).input, REFERENCE_SCENARIO);
});
