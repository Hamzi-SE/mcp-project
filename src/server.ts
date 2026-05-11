import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
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

server.registerResource(
  "users",
  "users://all",
  {
    title: "Users",
    description: "Get all users from the database",
    mimeType: "application/json",
  },
  async (uri) => {
    const users = await getUsers();

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(users),
        },
      ],
    };
  },
);

server.registerResource(
  "user-details",
  new ResourceTemplate("users://{userId}/details", {
    list: undefined,
  }),
  {
    title: "User Details",
    description: "Get details of a specific user by ID",
    mimeType: "application/json",
  },
  async (uri, { userId }) => {
    const users = await getUsers();
    const user = users.find((u) => u.id === parseInt(userId as string));

    if (!user) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify({ error: `User with ID ${userId} not found` }),
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(user),
        },
      ],
    };
  },
);

async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  const users = await getUsers();

  const id = users.length + 1;

  users.push({ id, ...user });

  await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));

  return id;
}

async function getUsers() {
  const users = await import("./data/users.json", {
    with: { type: "json" },
  }).then((m) => m.default);

  return users;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
