import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";

import authenticate from "../middlewares/authenticate.js";
import { getCustomerBookings } from "../controllers/bookingController.js";
import Booking from "../models/booking.js";

const TEST_SECRET = "test-only-jwt-secret";
let previousSecret;
before(() => {
  previousSecret = process.env.JWT_SECRET_KEY;
  process.env.JWT_SECRET_KEY = TEST_SECRET;
});
after(() => {
  if (previousSecret === undefined) delete process.env.JWT_SECRET_KEY;
  else process.env.JWT_SECRET_KEY = previousSecret;
});

function response() {
  return {
    statusCode: 200, body: null,
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

test("missing credentials request login", () => {
  const res = response();
  authenticate({ headers: {} }, res, () => assert.fail("Must not authenticate"));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, "AUTH_REQUIRED");
});

test("accepts a valid Bearer token with case and whitespace variations", () => {
  const token = jwt.sign({ id: "customer-1" }, TEST_SECRET, { expiresIn: "1h" });
  const req = { headers: { authorization: ` bearer   ${token} ` } };
  let authenticated = false;
  authenticate(req, response(), () => { authenticated = true; });
  assert.equal(authenticated, true);
  assert.equal(req.user.id, "customer-1");
});

test("expired tokens are rejected with an expiration code", () => {
  const token = jwt.sign({ id: "customer-1", exp: Math.floor(Date.now() / 1000) - 10 }, TEST_SECRET);
  const res = response();
  authenticate({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail("Must not authenticate"));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, "TOKEN_EXPIRED");
});

test("invalid signatures and duplicate Bearer prefixes stay rejected", () => {
  const invalid = jwt.sign({ id: "customer-1" }, "wrong-secret");
  for (const authorization of [`Bearer ${invalid}`, `Bearer Bearer ${invalid}`]) {
    const res = response();
    authenticate({ headers: { authorization } }, res, () => assert.fail("Must not authenticate"));
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.code, "INVALID_TOKEN");
  }
});

test("a signed token without customer identity cannot load customer bookings", () => {
  const token = jwt.sign({ role: "customer" }, TEST_SECRET, { expiresIn: "1h" });
  const res = response();
  authenticate({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail("Must not authenticate"));
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, "INVALID_TOKEN");
});

test("missing server configuration is not reported as an expired session", (t) => {
  const configured = process.env.JWT_SECRET_KEY;
  delete process.env.JWT_SECRET_KEY;
  t.after(() => { process.env.JWT_SECRET_KEY = configured; });
  const res = response();
  authenticate({ headers: { authorization: "Bearer a-token" } }, res, () => assert.fail("Must not authenticate"));
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, "AUTH_CONFIG_ERROR");
});

test("a valid authenticated customer can load AI bookings through the controller", async (t) => {
  const token = jwt.sign({ id: "customer-1" }, TEST_SECRET, { expiresIn: "1h" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  authenticate(req, response(), () => {});
  const bookings = [{ _id: "booking-1", customerId: "customer-1", source: "ai" }];
  t.mock.method(Booking, "find", (query) => {
    assert.deepEqual(query, { customerId: "customer-1" });
    return { populate() { return this; }, sort: async () => bookings };
  });
  const res = response();
  await getCustomerBookings(req, res);
  assert.deepEqual(res.body, bookings);
});
