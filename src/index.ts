import * as net from "node:net";
import { parseRESP } from "./parser.js";
import { executeCommand } from "./command.js";
import { store } from "./store.js";

const PORT = Number(process.env.PORT) || 6379;
const HOST = process.env.HOST || "127.0.0.1";

store.load();

const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

  let buffer = "";

  socket.on("data", (data) => {
    buffer += data.toString();
    let offset = 0;
    let fullResponse = "";

    try {
      while (offset < buffer.length) {
        let responseMessage;
        try {
          responseMessage = parseRESP(buffer, offset);
        } catch {
          // Incomplete frame in buffer, wait for more data
          break;
        }

        if (!Array.isArray(responseMessage.value) || responseMessage.value.length === 0) {
          offset = responseMessage.next;
          continue;
        }

        const command = String(responseMessage.value[0]).toUpperCase();
        const args = responseMessage.value.slice(1).map(String);

        const response = executeCommand(store, command, args);

        fullResponse += response;
        offset = responseMessage.next;
      }

      // Slice off fully consumed commands, keep remaining partial frame in buffer
      buffer = buffer.substring(offset);

      if (fullResponse.length > 0) {
        socket.write(fullResponse);
      }
    } catch (error) {
      console.error("Error processing client request:", error);
      buffer = "";
      socket.write("-ERR protocol error\r\n");
    }
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
