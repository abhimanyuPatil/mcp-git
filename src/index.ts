import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GitUtils } from "./service/git.js";
import { KimaiService } from "./service/kimai.js";
import { KimaiEntry } from "./types/index.js";
import dotenv from "dotenv";

class GitMcpServer {
  private server: Server;

  constructor() {
    dotenv.config({ quiet: true });
    this.server = new Server(
      {
        name: "mcp-git",
        version: "1.0.0",
        title: "MCP Git",
      },
      {
        capabilities: {
          tools: {
            get_git_log: {},
            push_kimai_entries: {},
          },
        },
      }
    );

    this.setupTools();
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Running 🚀🚀");
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_git_log",
            description: "Get git log of repository",
            inputSchema: {
              type: "object",
              properties: {
                repo_path: {
                  type: "string",
                  description:
                    "Path to the Git repository (defaults to current directory)",
                },
                number: {
                  type: "number",
                  description: "Number of commits to retrieve (default: 10)",
                  default: 10,
                },
                author: {
                  type: "string",
                  description: "Filter commits by author name",
                },
                since: {
                  type: "string",
                  description:
                    'Show commits since date (e.g., "2024-01-01", "1 week ago")',
                },
                until: {
                  type: "string",
                  description:
                    'Show commits until date (e.g., "2024-12-31", "yesterday")',
                },
                branches: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of branch names to fetch logs from",
                },
              },
              required: [],
            },
          },
          {
            name: "push_kimai_entries",
            description: "Push multiple time entries to Kimai",
            inputSchema: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      begin: { type: "string", format: "date-time" },
                      end: { type: "string", format: "date-time" },
                      project: { type: "number" },
                      activity: { type: "number" },
                      description: { type: "string" },
                    },
                    required: [
                      "begin",
                      "end",
                      "project",
                      "activity",
                      "description",
                    ],
                  },
                  minItems: 1,
                },
              },
              required: ["entries"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_git_log":
            return await new GitUtils().handleGetGitLogTerminal(args);
          case "push_kimai_entries":
            return await new KimaiService().pushKimaiEntries(
              args as { entries: KimaiEntry[] }
            );
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        console.error("Error setting request handler", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        throw new McpError(
          ErrorCode.MethodNotFound,
          `Execution Failed: ${errorMessage}`
        );
      }
    });
  }
}

const server = new GitMcpServer();
server.run().catch(console.error);
