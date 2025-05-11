# OpenAPI to MCP Server Converter

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![TypeScript Version](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

将 OpenAPI 规范自动转换为 Model Context Protocol（MCP）服务实例

## 功能特性

- 🚀 **自动化转换**：自动解析 OpenAPI 3.0 规范
- 🛠 **类型安全**：基于 TypeScript 的强类型校验
- 🔄 **请求代理**：自动处理工具调用参数映射

## 快速开始

### 前置条件

- Node.js 18+
- TypeScript 5.x

### 基础用法

引入依赖：

```bash
npm install openapi-mcp-converter
```

创建一个 Server 实例:

```typescript
import fs from 'fs';
import { OpenApiMCPSeverConverter } from '../index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const openApiDoc = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'openapi.json'), 'utf8'));

const converter = new OpenApiMCPSeverConverter(openApiDoc, { timeout: 100000, security: { apiKey: 'my-api-key' } });
const server = converter.getServer();
```

运行一个本地 Stdio Server:

```typescript
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("GitHub MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

运行一个本地 SSE Server:

```typescript
const app = express();
let transport = null;

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
```

运行一个本地 Streamable HTTP Server:

```typescript
const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        transports[sessionId] = transport;
      }
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);

app.delete('/mcp', handleSessionRequest);

app.listen(3000);
```

### 运行示例

```bash
npm test  # 执行示例测试用例
```

## 开发指南

### 项目结构

```
/openapi-to-mcp
├── dist/            # 编译输出
├── src/             # 源代码
│   ├── example/     # 示例配置
│   └── index.ts     # 核心实现
├── package.json
└── tsconfig.json
```

### 构建命令

```bash
npm run build    # 生产环境构建
npm run watch    # 开发模式监听
```
