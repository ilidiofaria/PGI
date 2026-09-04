import test from "node:test";
import assert from "node:assert/strict";
import { credentialsAreValid } from "../lib/auth.ts";

function withDemoCredentials(callback) {
  const previousUser = process.env.DEMO_USERNAME;
  const previousPassword = process.env.DEMO_PASSWORD;
  process.env.DEMO_USERNAME = "demo";
  process.env.DEMO_PASSWORD = "test-password";
  try {
    callback();
  } finally {
    if (previousUser === undefined) delete process.env.DEMO_USERNAME;
    else process.env.DEMO_USERNAME = previousUser;
    if (previousPassword === undefined) delete process.env.DEMO_PASSWORD;
    else process.env.DEMO_PASSWORD = previousPassword;
  }
}

test("aceita as novas credenciais da demonstração", () => {
  withDemoCredentials(() => assert.equal(credentialsAreValid("demo", "test-password"), true));
});

test("rejeita as credenciais anteriores", () => {
  withDemoCredentials(() => assert.equal(credentialsAreValid("pgi.demo", "old-password"), false));
});
