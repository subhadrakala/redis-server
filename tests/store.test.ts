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

test("lpush and rpush list creation and element ordering", () => {
    const store = new Store();

    // LPUSH pushes elements in order to head: ["1", "2", "3"] -> ["3", "2", "1"]
    const lLen = store.lpush("nums", ["1", "2", "3"]);
    assert.strictEqual(lLen, 3);
    assert.deepEqual(store.get("nums"), ["3", "2", "1"]);

    // RPUSH pushes elements to tail: ["a", "b", "c"] -> ["a", "b", "c"]
    const rLen = store.rpush("letters", ["a", "b", "c"]);
    assert.strictEqual(rLen, 3);
    assert.deepEqual(store.get("letters"), ["a", "b", "c"]);
});

test("lpush and rpush on existing lists", () => {
    const store = new Store();
    store.lpush("mylist", ["middle"]);
    assert.strictEqual(store.lpush("mylist", ["head"]), 2);
    assert.strictEqual(store.rpush("mylist", ["tail"]), 3);
    assert.deepEqual(store.get("mylist"), ["head", "middle", "tail"]);
});

test("lpush and rpush return null for string keys (WRONGTYPE)", () => {
    const store = new Store();
    store.set("string_key", "just_a_string");

    assert.strictEqual(store.lpush("string_key", ["item"]), null);
    assert.strictEqual(store.rpush("string_key", ["item"]), null);
});

test("lpush on expired key resets with fresh list", async () => {
    const store = new Store();
    store.set("temp_key", ["old_val"], Date.now() + 50);

    await new Promise((resolve) => setTimeout(resolve, 60));

    // Expired list should be replaced by fresh list
    assert.strictEqual(store.lpush("temp_key", ["new_val"]), 1);
    assert.deepEqual(store.get("temp_key"), ["new_val"]);
});