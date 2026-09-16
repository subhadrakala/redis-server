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
              }
              else {
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
        default:
            response = encodeError("Unknown command");
        }
        return response;
}
