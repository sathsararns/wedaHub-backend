import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import http from "node:http";
import Booking from "../models/booking.js";
import { createBooking, getProviderBookings } from "../controllers/bookingController.js";
import { initSocket } from "../socket.js";

const customerId = "111111111111111111111111";
const providerId = "222222222222222222222222";
let io;

before(() => {
  io = initSocket(http.createServer());
});

after(async () => {
  await new Promise((resolve) => io.close(resolve));
});

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

for (const { name, input, expected } of [
  { name: "the current city field", input: { city: " Galle " }, expected: "Galle" },
  { name: "the legacy location field", input: { location: "Mirissa" }, expected: "Mirissa" },
  { name: "a legacy location with a blank city", input: { city: "  ", location: "Mirissa" }, expected: "Mirissa" },
  { name: "an explicit city over a legacy location", input: { city: "Galle", location: "Mirissa" }, expected: "Galle" },
]) {
  test(`web bookings preserve ${name} in provider bookings and realtime notifications`, async (t) => {
    let stored;
    let notified;
    t.mock.method(Booking, "create", async (payload) => {
      // Exercise Mongoose's real strict schema: unrecognized fields would be lost.
      stored = new Booking(payload);
      await stored.validate();
      return stored;
    });
    t.mock.method(Booking, "findById", () => ({
      populate(path) {
        return path === "customerId" ? Promise.resolve(stored.toObject()) : this;
      },
    }));
    t.mock.method(io, "to", (room) => {
      assert.equal(room, providerId);
      return { emit(event, booking) { notified = { event, booking }; } };
    });

    const created = response();
    await createBooking({
      user: { id: customerId },
      body: {
        providerId, serviceName: "Electrician", description: "Repair my TV",
        date: "2030-01-02", ...input,
      },
    }, created);

    assert.equal(created.statusCode, 201);
    assert.equal(stored.city, expected);
    assert.equal(created.body.booking.city, expected);
    assert.equal(notified.event, "new-booking");
    assert.equal(notified.booking.city, expected);

    t.mock.method(Booking, "find", (filter) => {
      assert.deepEqual(filter, { providerId });
      return { populate() { return this; }, sort: async () => [stored.toObject()] };
    });
    const incoming = response();
    await getProviderBookings({ user: { id: providerId } }, incoming);
    assert.equal(incoming.statusCode, 200);
    assert.equal(incoming.body[0].city, expected);
  });
}
