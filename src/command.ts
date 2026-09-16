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
        return encodeError("Not enough arguments for set");
    }
    else if (args.length >= 3) {
        const [key, value, option, expiryValue] = args;
        if (String(option).toUpperCase() === "EX") {
            const expiry = Date.now() + (Number(expiryValue) * 1000);
            store.set(String(key), String(value), expiry);
            return encodeSimpleString("OK");
        } else if (String(option).toUpperCase() === "PX") {
            const expiry = Date.now() + (Number(expiryValue));
            store.set(String(key), String(value), expiry);
            return encodeSimpleString("OK");
        }
        else if (String(option).toUpperCase() === "EXAT") {
            const expiry = Number(expiryValue) * 1000;
            store.set(String(key), String(value), expiry);
            return encodeSimpleString("OK");
        }
        else if (String(option).toUpperCase() === "PXAT") {
            const expiry = Number(expiryValue);
            store.set(String(key), String(value), expiry);
            return encodeSimpleString("OK");
        }
        else {
            return encodeError("ERR syntax error");
        }
    }
    else {
        store.set(String(args[0]), String(args[1]));
        return encodeSimpleString("OK");
    }
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
        }else {
            return encodeError("ERR wrong number of arguments for 'decr' command");
        }
        
    } else {
        const value = store.get(String(args[0]));
        if (value === null) {
            store.set(String(args[0]), String(delta));
            return encodeInteger(delta);
        } else if (typeof value === "string" && /^-?\d+$/.test(value)) {
            const incrementedValue = Number(value) + delta;
            store.set(String(args[0]), String(incrementedValue));
            return encodeInteger(incrementedValue);
        }
        else {
            return encodeError("ERR value is not an integer or out of range");
        }
    }
    
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
