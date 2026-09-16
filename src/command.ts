import { Store } from "./store.js";
import { encodeBulkString, encodeError, encodeSimpleString, encodeInteger } from "./parser.js";

export function executeCommand(store: Store, command: string, args: string[]): string {
    let response: string;

    type CommandHandler = (store: Store, args: string[]) => string;

    const registry: Record<string, CommandHandler> = {
        PING: handlePing,
        ECHO: handleEcho,
        SET: handleSet,
        GET: handleGet,
        DEL: handleDel,
        EXISTS: handleExists,
        INCR: handleIncr,
        DECR: handleDecr,
        LPUSH: handleLpush,
        RPUSH: handleRpush,
        SAVE: handleSave,
        LOAD: handleLoad
    };

    const handler = registry[command.toUpperCase()];
    if (handler) {
        return handler(store, args);
    }
    return encodeError(`ERR unknown command '${command}'`);

};

function handlePing(store: Store, args: string[]): string {
    return encodeSimpleString("PONG");
}

function handleEcho(store: Store, args: string[]): string {
    if (args.length === 0) {
        return encodeError("ERR wrong number of arguments for 'echo' command");
    }
    return encodeBulkString(String(args[0]));
}


function handleSet(store: Store, args: string[]): string {
    if (args.length < 2) {
        return encodeError("ERR wrong number of arguments for 'set' command");
    }
    if (args.length >= 3) {
        if (args.length < 4) {
            return encodeError("ERR syntax error");
        }
        const [key, value, option, expiryValue] = args;
        const opt = String(option).toUpperCase();
        const num = Number(expiryValue);

        if (!Number.isInteger(num) || num <= 0) {
            return encodeError("ERR value is not an integer or out of range");
        }

        let expiry: number;
        if (opt === "EX") {
            expiry = Date.now() + num * 1000;
        } else if (opt === "PX") {
            expiry = Date.now() + num;
        } else if (opt === "EXAT") {
            expiry = num * 1000;
        } else if (opt === "PXAT") {
            expiry = num;
        } else {
            return encodeError("ERR syntax error");
        }

        store.set(String(key), String(value), expiry);
        return encodeSimpleString("OK");
    }

    store.set(String(args[0]), String(args[1]));
    return encodeSimpleString("OK");
}

function handleGet(store: Store, args: string[]): string {
    if (args.length < 1) {
        return encodeError("ERR wrong number of arguments for 'get' command");
    } else {
        const value = store.get(String(args[0]));
        if (value === null) {
            return encodeBulkString(null);
        } else if (typeof value !== "string") {
            return encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
        } else {
            return encodeBulkString(value);
        }
    }
}

function handleDel(store: Store, args: string[]): string {
    if (args.length < 1) {
        return encodeError("ERR wrong number of arguments for 'del' command");
    } else {
        let count = 0;
        for (let i = 0; i < args.length; i++) {
            if (store.delete(String(args[i]))) {
                count++;
            }
        }
        return encodeInteger(count);
    }
}

function handleExists(store: Store, args: string[]): string {
    if (args.length < 1) {
        return encodeError("ERR wrong number of arguments for 'exists' command");
    } else {
        let count = 0;
        for (let i = 0; i < args.length; i++) {
            if (store.exists(String(args[i]))) {
                count++;
            }
        }
        return encodeInteger(count);
    }
}

function handleIncr(store: Store, args: string[]): string {
    return incrementBy(store, args, 1);
}

function incrementBy(store: Store, args: string[], delta: number): string {
    if (args.length < 1) {
        if (delta === 1) {
            return encodeError("ERR wrong number of arguments for 'incr' command");
        } else {
            return encodeError("ERR wrong number of arguments for 'decr' command");
        }
    }

    const key = String(args[0]);
    const value = store.get(key);

    if (value === null) {
        store.set(key, String(delta));
        return encodeInteger(delta);
    }

    if (Array.isArray(value)) {
        return encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    if (typeof value === "string" && /^-?\d+$/.test(value)) {
        try {
            const incrementedValue = BigInt(value) + BigInt(delta);
            store.set(key, incrementedValue.toString());
            return encodeInteger(incrementedValue);
        } catch {
            return encodeError("ERR value is not an integer or out of range");
        }
    }

    return encodeError("ERR value is not an integer or out of range");
}


function handleDecr(store: Store, args: string[]): string {
    return incrementBy(store, args, -1);
}

function handleLpush(store: Store, args: string[]): string {
    if (args.length < 2) {
        return encodeError("ERR wrong number of arguments for 'lpush' command");
    } else {
        const key = String(args[0]);
        const values = args.slice(1).map(String);
        const length = store.lpush(key, values);
        if (length === null) {
            return encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
        } else {
            return encodeInteger(length);
        }
    }
}

function handleRpush(store: Store, args: string[]): string {
    if (args.length < 2) {
        return encodeError("ERR wrong number of arguments for 'rpush' command");
    } else {
        const key = String(args[0]);
        const values = args.slice(1).map(String);
        const length = store.rpush(key, values);
        if (length === null) {
            return encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
        } else {
            return encodeInteger(length);
        }
    }
}

function handleSave(store: Store, args: string[]): string {
    store.save();
    return encodeSimpleString("OK");
}

function handleLoad(store: Store, args: string[]): string {
    store.load();
    return encodeSimpleString("OK");
}
