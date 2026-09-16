import test from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/store.js";
import { executeCommand } from "../src/command.js";

test("executeCommand PING and ECHO", () => {
    const store = new Store();
    assert.strictEqual(executeCommand(store, "PING", []), "+PONG\r\n");
    assert.strictEqual(executeCommand(store, "ECHO", ["hello"]), "$5\r\nhello\r\n");
    assert.strictEqual(executeCommand(store, "ECHO", []), "-ERR wrong number of arguments for 'echo' command\r\n");
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
    assert.strictEqual(executeCommand(store, "EXISTS", []), "-ERR wrong number of arguments for 'exists' command\r\n");
});

test("executeCommand DEL", () => {
    const store = new Store();
    executeCommand(store, "SET", ["k1", "v1"]);
    executeCommand(store, "SET", ["k2", "v2"]);

    assert.strictEqual(executeCommand(store, "DEL", ["k1", "k3"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", ["k1"]), ":0\r\n");
    assert.strictEqual(executeCommand(store, "EXISTS", ["k2"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "DEL", []), "-ERR wrong number of arguments for 'del' command\r\n");
});

test("executeCommand INCR and DECR", () => {
    const store = new Store();
    assert.strictEqual(executeCommand(store, "INCR", ["counter"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "INCR", ["counter"]), ":2\r\n");
    assert.strictEqual(executeCommand(store, "DECR", ["counter"]), ":1\r\n");
    assert.strictEqual(executeCommand(store, "DECR", ["counter"]), ":0\r\n");
    assert.strictEqual(executeCommand(store, "DECR", ["counter"]), ":-1\r\n");

    executeCommand(store, "SET", ["name", "alice"]);
    assert.strictEqual(executeCommand(store, "INCR", ["name"]), "-ERR value is not an integer or out of range\r\n");
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

test("executeCommand SAVE", () => {
    const store = new Store();
    executeCommand(store, "SET", ["saved_key", "saved_value"]);
    assert.strictEqual(executeCommand(store, "SAVE", []), "+OK\r\n");
});

test("executeCommand SET options and validation", () => {
    const store = new Store();
    assert.strictEqual(executeCommand(store, "SET", ["k"]), "-ERR wrong number of arguments for 'set' command\r\n");
    assert.strictEqual(executeCommand(store, "SET", ["k", "v", "EX"]), "-ERR syntax error\r\n");
    assert.strictEqual(executeCommand(store, "SET", ["k", "v", "EX", "invalid"]), "-ERR value is not an integer or out of range\r\n");
    assert.strictEqual(executeCommand(store, "SET", ["k", "v", "EX", "-5"]), "-ERR value is not an integer or out of range\r\n");
    assert.strictEqual(executeCommand(store, "SET", ["k", "v", "UNKNOWN", "10"]), "-ERR syntax error\r\n");
    assert.strictEqual(executeCommand(store, "SET", ["k", "v", "EX", "100"]), "+OK\r\n");
});

test("executeCommand INCR on list returns WRONGTYPE and supports 64-bit BigInt", () => {
    const store = new Store();
    executeCommand(store, "LPUSH", ["mylist", "item1"]);
    assert.strictEqual(
        executeCommand(store, "INCR", ["mylist"]),
        "-WRONGTYPE Operation against a key holding the wrong kind of value\r\n"
    );

    // Large 64-bit integer test
    executeCommand(store, "SET", ["big", "9007199254740992"]);
    assert.strictEqual(executeCommand(store, "INCR", ["big"]), ":9007199254740993\r\n");
});




