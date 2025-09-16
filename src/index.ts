import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { simpleGit } from "simple-git";
import { execSync } from "child_process";
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
            return await this.handleGetGitLogTerminal(args);
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

  private async handleGetGitLogTerminal(args: any) {
    try {
      const repoPath = args.repo_path || process.cwd();
      console.error("Using repoPath =", repoPath);

      const gitDir = path.join(repoPath, ".git");
      if (!fs.existsSync(gitDir)) {
        throw new Error(`Not a Git repository: ${repoPath}`);
      }

      const branch = args.branch;
      let gitCommand: string;
      const limit = args.number ?? 25;
      if (!branch || branch === "HEAD" || branch === "") {
        gitCommand = `git log --oneline -n ${limit} --pretty=format:"%H|%an|%ae|%ad|%s"`;
      } else {
        gitCommand = `git log ${branch} --oneline -n ${limit} --pretty=format:"%H|%an|%ae|%ad|%s"`;
      }

      // Add filters if present
      if (args.author) gitCommand += ` --author="${args.author}"`;
      if (args.since) gitCommand += ` --since="${args.since}"`;
      if (args.until) gitCommand += ` --until="${args.until}"`;

      const output = execSync(gitCommand, {
        cwd: repoPath,
        encoding: "utf8",
        maxBuffer: 1024 * 1024, // 1MB limit
      });

      const commits = output
        .trim()
        .split("\n")
        .map((line) => {
          const [hash, author_name, author_email, date, message] =
            line.split("|");
          return { hash, author_name, author_email, date, message };
        });

      // Format commits for LLM response
      const formattedCommits = commits
        .map(
          (c) =>
            `Commit: ${c.hash}\nAuthor: ${c.author_name} <${
              c.author_email
            }>\nDate: ${c.date}\nMessage: ${c.message}\n${"─".repeat(40)}\n`
        )
        .join("\n");

      const response = {
        content: [
          {
            type: "text",
            text: `Git log for ${repoPath} (showing ${commits.length} commits):\n\n${formattedCommits}`,
          },
        ],
      };
      return response;
    } catch (error) {
      console.error("Error in handleGetGitLog:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `handleGetGitLog failed: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  private async handleGetGitLog(args: any) {
    console.error("handleGetGitLog called with args:", args);
    try {
      const repoPath = args.repo_path || process.cwd();
      console.error("Using repoPath =", repoPath);

      const gitDir = path.join(repoPath, ".git");
      if (!fs.existsSync(gitDir)) {
        throw new Error(`Not a Git repository: ${repoPath}`);
      }
      console.error(".git directory exists");

      const git = simpleGit(repoPath);
      const options: any = {
        n: args.number ?? 10,
        ...(args.author && { "--author": args.author }),
        ...(args.since && { "--since": args.since }),
        ...(args.until && { "--until": args.until }),
      };
      console.error("Git log options:", options);

      const logResult = await git.log(options);
      console.error("git.log returned", logResult.all.length, "commits");

      const lines = logResult.all.map((c) =>
        [
          `Commit: ${c.hash}`,
          `Author: ${c.author_name} <${c.author_email}>`,
          `Date: ${c.date}`,
          `Message: ${c.message}`,
          "─".repeat(60),
        ].join("\n")
      );

      const response = {
        content: [
          {
            type: "text",
            text: `Git log for ${repoPath} (showing ${
              logResult.all.length
            } commits):\n\n${lines.join("\n")}`,
          },
        ],
      };
      console.error("Returning response successfully");
      return response;
    } catch (err) {
      console.error("Error in handleGetGitLog:", err);
      throw new McpError(
        ErrorCode.InternalError,
        `handleGetGitLog failed: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  private async validateGitRepo(repoPath: string): Promise<void> {
    const gitPath = path.join(repoPath, ".git");
    if (!fs.existsSync(gitPath)) {
      throw new Error(`Not a Git repository: ${repoPath}`);
    }
  }
}

const server = new GitMcpServer();
server.run().catch(console.error);
