import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateQuickRoi, exampleInputs, parseQuickInputs, validReduction } from "../lib/quick-roi.ts";

test("review opportunity values only recovered effort and preserves units", () => {
  const { inputs, valid } = parseQuickInputs("review", exampleInputs("review"));
  assert.equal(valid, true);
  const result = calculateQuickRoi("review", inputs);
  assert.equal(result.baselineEffort, 2000);
  assert.equal(result.recoveredHoursLow, 200);
  assert.equal(result.recoveredHoursHigh, 500);
  assert.equal(result.annualValueLow, 29000);
  assert.equal(result.annualValueHigh, 72500);
  assert.equal(result.kind, "capacity");
  assert.equal(result.hoursAfterLow, 15);
  assert.equal(result.hoursAfterHigh, 18);
});

test("failure model applies addressability before reduction and never credits all losses by default", () => {
  const { inputs } = parseQuickInputs("failure", exampleInputs("failure"));
  const result = calculateQuickRoi("failure", inputs);
  assert.equal(result.baselineLoss, 400000);
  assert.equal(result.addressableLoss, 100000);
  assert.equal(result.annualValueLow, 10000);
  assert.equal(result.annualValueHigh, 25000);
  assert.equal(result.avoidedEventsLow, 0.125);
  assert.equal(result.avoidedEventsHigh, 0.3125);
  assert.equal(result.kind, "avoided_loss");
});

test("zero failures and a zero addressable share produce zero opportunity", () => {
  const { inputs } = parseQuickInputs("failure", exampleInputs("failure"));
  assert.equal(calculateQuickRoi("failure", { ...inputs, eventsPerYear: 0 }).annualValueHigh, 0);
  assert.equal(calculateQuickRoi("failure", { ...inputs, addressableSharePercent: 0 }).annualValueHigh, 0);
});

test("tech transfer remains separately scoped and zero effort is supported", () => {
  const { inputs } = parseQuickInputs("transfer", exampleInputs("transfer"));
  const result = calculateQuickRoi("transfer", inputs);
  assert.equal(result.baselineEffort, 234);
  assert.ok(Math.abs(result.annualValueLow - 3393) < 0.000001);
  assert.equal(result.annualValueHigh, 8482.5);
  assert.equal(calculateQuickRoi("transfer", { ...inputs, hoursPerEvent: 0 }).annualValueHigh, 0);
});

test("blank, nonfinite, negative, oversized and malformed values are rejected rather than coerced to zero", () => {
  for (const value of ["", " ", "Infinity", "NaN", "-1", "1e100", "8abc", "1,2", "0x20"]) {
    assert.equal(parseQuickInputs("review", { ...exampleInputs("review"), eventsPerYear: value }).valid, false, value);
  }
  assert.equal(parseQuickInputs("review", { ...exampleInputs("review"), eventsPerYear: "1.5" }).valid, false);
  assert.equal(parseQuickInputs("failure", { ...exampleInputs("failure"), eventsPerYear: "1.5" }).valid, true);
  assert.equal(parseQuickInputs("failure", { ...exampleInputs("failure"), addressableSharePercent: "101" }).valid, false);
});

test("harmless currency formatting is accepted and reduction ordering is enforced", () => {
  assert.equal(parseQuickInputs("review", { ...exampleInputs("review"), hourlyRate: "$1,450" }).inputs.hourlyRate, 1450);
  for (const range of [{ low: 30, high: 20 }, { low: -1, high: 25 }, { low: 0, high: 101 }, { low: NaN, high: 25 }]) {
    assert.equal(validReduction(range), false);
    assert.throws(() => calculateQuickRoi("review", parseQuickInputs("review", exampleInputs("review")).inputs, range));
  }
  assert.equal(validReduction({ low: 0, high: 0 }), true);
});
