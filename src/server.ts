import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Mock customer data
const customers: Record<string, { name: string; usage: number }> = {
  "123": { name: "Acme Corp", usage: 1200 },
  "456": { name: "Globex Ltd", usage: 800 },
};

// Create server instance (use the real SDK Server, not the stub)
const server = new Server(
  {
    name: "Product Analytics MCP",
    version: "1.0.0",
  },
  {} as any
);

// Define tools
const tools: Tool[] = [
  {
    name: "getCustomerUsage",
    description: "Get usage details for a customer by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        customerId: {
          type: "string",
          description: "The customer ID (e.g., '123' or '456')",
        },
      },
      required: ["customerId"],
    },
  },
  {
    name: "generateUsageReport",
    description: "Generate a summary report of all customers and average usage",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "getCustomerUsage") {
    const customerId = (args as any)?.customerId;
    if (!customerId) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: "customerId parameter required" }),
          },
        ],
        isError: true,
      };
    }

    const customer = customers[customerId];
    if (!customer) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Customer ${customerId} not found` }),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            customerId,
            name: customer.name,
            usage: customer.usage,
          }),
        },
      ],
    };
  }

  if (name === "generateUsageReport") {
    const total = Object.keys(customers).length;
    const avgUsage =
      total === 0
        ? 0
        : Math.round(
            Object.values(customers).reduce((sum, c) => sum + c.usage, 0) / total
          );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            totalCustomers: total,
            averageUsage: avgUsage,
            report: `Total customers: ${total}, Average usage: ${avgUsage}`,
          }),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: `Unknown tool: ${name}` }),
      },
    ],
    isError: true,
  };
});

// Main async function to start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Product Analytics MCP server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});