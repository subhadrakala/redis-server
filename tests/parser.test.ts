import test from "node:test";
import assert from "node:assert/strict";
import { parseRESP, encodeSimpleString, encodeError, encodeInteger, encodeBulkString, encodeRESP } from "../src/parser";

// ─── Deserialiser Tests ───────────────────────────────────────────────────────

test("parses Simple String +OK", () => {
  assert.deepEqual(parseRESP("+OK\r\n"), { value: "OK", next: 5 });
});

test("parses Simple String +hello world", () => {
  assert.deepEqual(parseRESP("+hello world\r\n"), { value: "hello world", next: 14 });
});

test("parses Error", () => {
  assert.deepEqual(parseRESP("-Error message\r\n"), { value: "Error message", next: 16 });
});

test("parses Integer", () => {
  assert.deepEqual(parseRESP(":42\r\n"), { value: "42", next: 5 });
});

test("parses Null Bulk String $-1", () => {
  assert.deepEqual(parseRESP("$-1\r\n"), { value: null, next: 5 });
});

test("parses empty Bulk String $0", () => {
  assert.deepEqual(parseRESP("$0\r\n\r\n"), { value: "", next: 6 });
});

test("parses Bulk String $4 PING", () => {
  assert.deepEqual(parseRESP("$4\r\nPING\r\n"), { value: "PING", next: 10 });
});

test("parses Array *1 PING", () => {
  assert.deepEqual(
    parseRESP("*1\r\n$4\r\nping\r\n"),
    { value: ["ping"], next: 14 }
  );
});

test("parses Array *2 echo hello world", () => {
  assert.deepEqual(
    parseRESP("*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n"),
    { value: ["echo", "hello world"], next: 32 }
  );
});

test("parses Array *2 get key", () => {
  assert.deepEqual(
    parseRESP("*2\r\n$3\r\nget\r\n$3\r\nkey\r\n"),
    { value: ["get", "key"], next: 22 }
  );
});

test("parses Null Array *-1", () => {
  assert.deepEqual(parseRESP("*-1\r\n"), { value: null, next: 5 });
});

// ─── Serialiser Tests ─────────────────────────────────────────────────────────

test("encodes Simple String", () => {
  assert.equal(encodeSimpleString("OK"), "+OK\r\n");
});

test("encodes Error", () => {
  assert.equal(encodeError("Error message"), "-Error message\r\n");
});

test("encodes Integer", () => {
  assert.equal(encodeInteger(42), ":42\r\n");
});

test("encodes Null Bulk String", () => {
  assert.equal(encodeBulkString(null), "$-1\r\n");
});

test("encodes Bulk String", () => {
  assert.equal(encodeBulkString("PONG"), "$4\r\nPONG\r\n");
});

test("encodes empty Bulk String", () => {
  assert.equal(encodeBulkString(""), "$0\r\n\r\n");
});

test("encodes Null Array", () => {
  assert.equal(encodeRESP(null), "$-1\r\n");
});

test("encodes Array of Bulk Strings", () => {
  assert.equal(encodeRESP(["echo", "hello world"]), "*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n");
});
