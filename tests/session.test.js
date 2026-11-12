import assert from "node:assert/strict";
import test from "node:test";

import { savePasswordAndRevokeRefreshToken } from "../src/utils/session.js";

test("password changes persist the new password and revoke the stored refresh token", async () => {
  const saveCalls = [];
  const user = {
    password: "old-password-hash",
    refreshToken: "previous-refresh-token",
    async save(options) {
      saveCalls.push(options);
    },
  };

  await savePasswordAndRevokeRefreshToken(user, "new-password");

  assert.equal(user.password, "new-password");
  assert.equal(user.refreshToken, undefined);
  assert.deepEqual(saveCalls, [{ validateBeforeSave: false }]);
});

test("password update errors propagate instead of reporting a successful change", async () => {
  const expectedError = new Error("database unavailable");
  const user = {
    password: "old-password-hash",
    refreshToken: "previous-refresh-token",
    async save() {
      throw expectedError;
    },
  };

  await assert.rejects(
    savePasswordAndRevokeRefreshToken(user, "new-password"),
    (error) => error === expectedError
  );
});
