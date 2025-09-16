import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GitUtils } from "./utils/git_utils.js";
class GitMcpServer {
  private server: Server;

  constructor() {
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
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_git_log":
            return await new GitUtils().handleGetGitLogTerminal(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
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
