import * as net from "node:net";
import { parseRESP, encodeBulkString, encodeError, encodeSimpleString } from "./parser.js";

const PORT = Number(process.env.PORT) || 6379;
const HOST = process.env.HOST || "127.0.0.1";

const inMemoryStore: Map<string, string> = new Map();

const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", (data) => {
    let dataString = data.toString();
    console.log(`Received data from client: ${dataString}`);
    let responseMessage = parseRESP(dataString);
    if (!Array.isArray(responseMessage.value) || responseMessage.value.length === 0) {
      return;
    }

    const command = String(responseMessage.value[0]).toUpperCase();
    const args = responseMessage.value.slice(1);
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
        } else {
          inMemoryStore.set(String(args[0]), String(args[1]));
          response = encodeSimpleString("OK");
        }
        break;
      case "GET":
        if (args.length < 1) {
          response = encodeError("Not enough arguments for get");
        } else {
          const value = inMemoryStore.get(String(args[0]));
          if (value === undefined) {
            response = encodeBulkString(null);
          } else {
            response = encodeBulkString(value);
          }
        }
        break;
      default:
        response = encodeError("Unknown command");
    }

    socket.write(response);


  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Redis server listening on ${HOST}:${PORT}`);
});
