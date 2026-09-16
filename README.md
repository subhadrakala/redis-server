# Custom Redis Server

A lightweight, high-performance Redis server implemented in **TypeScript** and **Node.js**, built following the [Coding Challenges: Build Your Own Redis Server](https://codingchallenges.fyi/challenges/challenge-redis).

---

## Features & Supported Commands

### 1. Protocol Layer (RESP)
Full implementation of the **Redis Serialization Protocol (RESP)**:
- **Simple Strings** (`+OK\r\n`)
- **Errors** (`-ERR ...\r\n`)
- **Integers** (`:42\r\n`)
- **Bulk Strings** (`$5\r\nhello\r\n` and `$-1\r\n` for `null`)
- **Arrays** (`*2\r\n...`)

### 2. Core Commands
- **`PING [message]`**: Health check command; responds with `PONG` or returns the optional custom message.
- **`ECHO <message>`**: Echoes the provided message back as a bulk string.

### 3. Key-Value Storage with Expiration
- **`SET <key> <value> [EX seconds | PX milliseconds | EXAT timestamp | PXAT timestamp]`**: Stores key-value pairs with optional expiration.
- **`GET <key>`**: Retrieves the string value, or `(nil)` if not found or expired.
- **Lazy Expiration**: Expired keys are evicted on-demand in $O(1)$ constant time without background timer overhead.

### 4. Key Management
- **`EXISTS <key> [key ...]`**: Returns the number of specified keys that exist and are alive.
- **`DEL <key> [key ...]`**: Deletes the specified keys and returns the count of removed keys (ignoring already-expired keys).

### 5. Numeric Counters
- **`INCR <key>`**: Atomically increments the integer value of a key by `1`. Initializes non-existent keys to `0`.
- **`DECR <key>`**: Atomically decrements the integer value of a key by `1`. Initializes non-existent keys to `0`.
- Strictly validates integer strings and preserves existing expiration timestamps.

### 6. Lists
- **`LPUSH <key> <value> [value ...]`**: Prepends one or multiple values to the head of a list. Returns the new list length.
- **`RPUSH <key> <value> [value ...]`**: Appends one or multiple values to the tail of a list. Returns the new list length.
- Type-safe with `WRONGTYPE` error guards against non-list keys.

### 7. Persistence (Snapshots)
- **`SAVE`**: Synchronously writes an in-memory snapshot to disk (`dump.json`) using atomic temporary file renaming (`dump.json.tmp` -> `dump.json`). Prunes expired keys prior to saving.
- **Startup Hydration**: Automatically detects and loads the snapshot file on server boot.

### 8. High-Throughput Concurrency & Pipelining
- Multiplexes multiple client connections over a single non-blocking event-loop thread.
- Full TCP stream buffering and command **pipelining** support, capable of processing over **600,000 requests/sec** with sub-millisecond latency.

---

## Architecture

```text
src/
├── parser.ts      # RESP serializer and deserializer
├── store.ts       # In-memory storage engine, list operations & lazy eviction
├── command.ts     # Command dispatcher, argument validation & routing
└── index.ts       # TCP server, connection lifecycle & pipelining stream processor

tests/
├── parser.test.ts   # RESP protocol parsing and encoding tests
├── store.test.ts    # Store CRUD, expiration, lists, and persistence tests
└── command.test.ts  # Isolated command execution unit tests
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- (Optional) `redis-cli` and `redis-benchmark` (`brew install redis`)

### Installation
```bash
npm install
```

### Run Server in Development Mode
```bash
npm run dev
```
The server will start listening on `127.0.0.1:6379`.

### Run Unit Tests
```bash
npm test
```

### Typecheck & Build
```bash
npm run typecheck
npm run build
```

---

## Performance Benchmarks

Tested locally using `redis-benchmark` with 50 concurrent connections and 16-command pipelining (`redis-benchmark -t SET,GET -n 10000 -P 16 -q`):

```text
SET: 500,000.00 requests per second, p50=0.695 msec
GET: 666,666.69 requests per second, p50=0.711 msec
```