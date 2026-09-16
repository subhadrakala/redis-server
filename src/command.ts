import { Store } from "./store.js";
import { parseRESP, encodeBulkString, encodeError, encodeSimpleString, encodeInteger } from "./parser.js";

export function executeCommand(store: Store, command: string, args: string[]): string {
    let response: string;
    switch (command) {
          case "PING":
            response = encodeSimpleString("PONG");
            break;
          case "ECHO":
            if (args.length === 0) {
              response = encodeError("Empty argument for echo");
            } else {
              response = encodeBulkString(String(args[0]));
            }
            break;
          case "SET":
            if (args.length < 2) {
              response = encodeError("Not enough arguments for set");
            }
            else if (args.length >= 3) {
              const [key, value, option, expiryValue] = args;
              if (String(option).toUpperCase() === "EX") {
                const expiry = Date.now() + (Number(expiryValue) * 1000);
                store.set(String(key), String(value), expiry);
                response = encodeSimpleString("OK");
              } else if (String(option).toUpperCase() === "PX") {
                const expiry = Date.now() + (Number(expiryValue));
                store.set(String(key), String(value), expiry);
                response = encodeSimpleString("OK");
              }
              else if (String(option).toUpperCase() === "EXAT") {
                const expiry = Number(expiryValue) * 1000;
                store.set(String(key), String(value), expiry);
                response = encodeSimpleString("OK");
              }
              else if (String(option).toUpperCase() === "PXAT") {
                const expiry = Number(expiryValue);
                store.set(String(key), String(value), expiry);
                response = encodeSimpleString("OK");
              }
              else {
                response = encodeError("Invalid option for set");
              }
            }
            else {
              store.set(String(args[0]), String(args[1]));
              response = encodeSimpleString("OK");
            }
            break;
          case "GET":
            if (args.length < 1) {
              response = encodeError("Not enough arguments for get");
            } else {
              const value = store.get(String(args[0]));
              if (value === null) {
                response = encodeBulkString(null);
              } else if (typeof value !== "string") {
                response = encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
              } else {
                response = encodeBulkString(value);
              }
            }
            break;
          case 'EXISTS':
            if (args.length < 1) {
              response = encodeError("Not enough arguments for exists");
            } else {
              let count = 0;
              for (let i = 0; i < args.length; i++) {
                if (store.exists(String(args[i]))) {
                  count++;
                }
              }
              response = encodeInteger(count);
            }
            break;
          case 'DEL':
            if (args.length < 1) {
              response = encodeError("Not enough arguments for del");
            } else {
              let count = 0;
              for (let i = 0; i < args.length; i++) {
                if (store.delete(String(args[i]))) {
                  count++;
                }
              }
              response = encodeInteger(count);
            }
            break;
          case 'INCR':
            if (args.length < 1) {
              response = encodeError("Not enough arguments for incr");
            } else {
              const value = store.get(String(args[0]));
              if (value === null) {
                store.set(String(args[0]), "1");
                response = encodeInteger(1);
              } else if (typeof value === "string" && /^-?\d+$/.test(value)) {
                const incrementedValue = Number(value) + 1;
                store.set(String(args[0]), String(incrementedValue));
                response = encodeInteger(incrementedValue);
              }
              else {
                response = encodeError("Value is not an integer");
              }
            }
            break;
          case "DECR":
            if (args.length < 1) {
              response = encodeError("Not enough arguments for decr");
            } else {
              const value = store.get(String(args[0]));
              if (value === null) {
                store.set(String(args[0]), "-1");
                response = encodeInteger(-1);
              } else if (typeof value === "string" && /^-?\d+$/.test(value)) {
                const decrementedValue = Number(value) - 1;
                store.set(String(args[0]), String(decrementedValue));
                response = encodeInteger(decrementedValue);
              }
              else {
                response = encodeError("Value is not an integer");
              }
            }
            break;
        case 'LPUSH':
          if (args.length < 2) {
            response = encodeError("Not enough arguments for lpush");
          } else {
            const key = String(args[0]);
            const values = args.slice(1).map(String);
            const length = store.lpush(key, values);
            if (length === null) {
              response = encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
            } else {
              response = encodeInteger(length);
            }
          }
          break;
        case 'RPUSH':
          if (args.length < 2) {
            response = encodeError("Not enough arguments for rpush");
          } else {
            const key = String(args[0]);
            const values = args.slice(1).map(String);
            const length = store.rpush(key, values);
            if (length === null) {
              response = encodeError("WRONGTYPE Operation against a key holding the wrong kind of value");
            } else {
              response = encodeInteger(length);
            }
          }
          break;
        case "SAVE":
          store.save(); 
          response = encodeSimpleString("OK");
          break;
        default:
          response = encodeError("Unknown command");
          break;
    }
    return response;
}
