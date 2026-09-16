import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/store.js";

test("set and get", () => {
    const store = new Store();
    store.set("mykey", "myvalue");
    assert.strictEqual(store.get("mykey"), "myvalue");
    store.delete("mykey");
    assert.strictEqual(store.get("mykey"), null);
});

test("exists", () => {
    const store = new Store();
    store.set("mykey", "myvalue");
    assert.strictEqual(store.exists("mykey"), true);
    assert.strictEqual(store.exists("missing"), false);
});

test("expiry", async () => {
    const store = new Store();
    store.set("temp", "val", Date.now() + 50);
    assert.strictEqual(store.get("temp"), "val");
    assert.strictEqual(store.exists("temp"), true);

    await new Promise((resolve) => setTimeout(resolve, 60));

    assert.strictEqual(store.get("temp"), null);
    assert.strictEqual(store.exists("temp"), false);
});

test("delete returns true for existing key and false for missing key", () => {
    const store = new Store();
    store.set("k1", "v1");
    assert.strictEqual(store.delete("k1"), true);
    assert.strictEqual(store.delete("k1"), false);
    assert.strictEqual(store.delete("never_existed"), false);
});

test("delete returns false for expired key", async () => {
    const store = new Store();
    store.set("ephemeral", "bye", Date.now() + 50);

    await new Promise((resolve) => setTimeout(resolve, 60));

    // Expired key should report false on delete
    assert.strictEqual(store.delete("ephemeral"), false);
});