import fs from 'fs';
import { OpenApiMCPSeverConverter } from '../index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const openApiDoc = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'openapi.json'), 'utf8'));

const converter = new OpenApiMCPSeverConverter(openApiDoc, { timeout: 100000 });
const server = converter.getServer();
console.log(JSON.stringify(converter.getMcpTools(), null, 2));
console.log(JSON.stringify(converter.getTools(), null, 2));
const app = express();
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  server.onclose = async () => {
    await server.close();
  };
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
  return;
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
      throw new Error("sessionId query parameter is required");
  }
  await transport.handlePostMessage(req, res);
  return;
});

app.listen(8080, () => {
  console.log('MCP Server running on port 8080');
});