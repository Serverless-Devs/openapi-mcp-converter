import fs from 'fs';
import { OpenApiMCPSeverConverter } from '../index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const openApiDoc = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'openapi.json'), 'utf8'));

const converter = new OpenApiMCPSeverConverter(openApiDoc, { timeout: 100000 });
const server = converter.getServer();
console.log(JSON.stringify(converter.getMcpTools(), null, 2));
console.log(JSON.stringify(converter.getTools(), null, 2));
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("GitHub MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});