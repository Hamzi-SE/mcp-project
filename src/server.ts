import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs/promises";

const server = new McpServer({
  name: "My MCP Server",
  version: "1.0.0",
  description: "A simple MCP server implemented in TypeScript",
});

server.registerTool(
  "create-user",
  {
    title: "Create User",
    description: "Creates a new user",
    inputSchema: {
      name: z.string().min(1, "Name is required"),
      email: z.email("Invalid email address"),
      address: z.string(),
      phone: z.string(),
    },
    annotations: {
      title: "Create User",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const id = await createUser(params);
      return {
        content: [
          {
            type: "text",
            text: `User created successfully with ID: ${id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating user: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  const users = await import("./data/users.json", {
    with: { type: "json" },
  }).then((m) => m.default);

  const id = users.length + 1;

  users.push({ id, ...user });

  await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));

  return id;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
