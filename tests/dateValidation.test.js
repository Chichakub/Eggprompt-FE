import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidFormDate } from "../src/composables/dateValidation.js";

test("dates match the four-digit year format accepted by the API", () => {
  for (const value of ["2026-11-18", "2024-02-29", "0001-01-01", "9999-12-31"]) {
    assert.equal(isValidFormDate(value), true, value);
  }
  for (const value of ["55555-05-05", "0000-01-01", "2026-02-29", "2026-04-31", "", "2026-5-5"]) {
    assert.equal(isValidFormDate(value), false, value);
  }
});
