import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/store.js";
import { executeCommand } from "../src/command.js";

test("executeCommand PING and ECHO", () => {
    const store = new Store();
    assert.strictEqual(executeCommand(store, "PING", []), "+PONG\r\n");
    assert.strictEqual(executeCommand(store, "ECHO", ["hello"]), "$5\r\nhello\r\n");
    assert.strictEqual(executeCommand(store, "ECHO", []), "-Empty argument for echo\r\n");
});

test("executeCommand SET and GET", () => {
    const store = new Store();
    assert.strictEqual(executeCommand(store, "SET", ["user", "alice"]), "+OK\r\n");
    assert.strictEqual(executeCommand(store, "GET", ["user"]), "$5\r\nalice\r\n");
    assert.strictEqual(executeCommand(store, "GET", ["missing"]), "$-1\r\n");
});

test("executeCommand EXISTS", () => {
    const store = new Store();
    executeCommand(store, "SET", ["k1", "v1"]);
    executeCommand(store, "SET", ["k2", "v2"]);

    assert.strictEqual(executeCommand(store, "EXISTS", ["k1"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", ["k1", "k2", "k3"]), ":2\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", ["k3"]), ":0\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", []), "-Not enough arguments for exists\r\n");
});

test("executeCommand DEL", () => {
    const store = new Store();
    executeCommand(store, "SET", ["k1", "v1"]);
    executeCommand(store, "SET", ["k2", "v2"]);

    assert.strictEqual(executeCommand(store, "DEL", ["k1", "k3"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", ["k1"]), ":0\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", ["k2"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "DEL", []), "-Not enough arguments for del\r\n");
});

test("executeCommand INCR and DECR", () => {
    const store = new Store();
    assert.strictEqual(executeCommand(store, "INCR", ["counter"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "INCR", ["counter"]), ":2\r\n");
    assert.strictEqual(executeCommand(store, "DECR", ["counter"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "DECR", ["counter"]), ":0\r\n");
    assert.strictEqual(executeCommand(store, "DECR", ["counter"]), ":-1\r\n");

    executeCommand(store, "SET", ["name", "alice"]);
    assert.strictEqual(executeCommand(store, "INCR", ["name"]), "-Value is not an integer\r\n");
});

test("executeCommand LPUSH and RPUSH", () => {
    const store = new Store();
    // LPUSH
    assert.strictEqual(executeCommand(store, "LPUSH", ["fruits", "apple"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "LPUSH", ["fruits", "banana", "cherry"]), ":3\r\n");
    // List order: cherry, banana, apple
    assert.deepEqual(store.get("fruits"), ["cherry", "banana", "apple"]);

    // RPUSH
    assert.strictEqual(executeCommand(store, "RPUSH", ["fruits", "date"]), ":4\r\n");
    assert.deepEqual(store.get("fruits"), ["cherry", "banana", "apple", "date"]);

    // WRONGTYPE test
    executeCommand(store, "SET", ["string_key", "hello"]);
    assert.strictEqual(
        executeCommand(store, "LPUSH", ["string_key", "world"]),
        "-WRONGTYPE Operation against a key holding the wrong kind of value\r\n"
    );
});


