import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { simpleGit } from "simple-git";
import * as path from "path";
import * as fs from "fs";

export function constructLogsStatement(args: any, branch?: string) {
  let gitCommand: string;
  const limit = args.number ?? 25;
  if (!branch || branch === "HEAD" || branch === "") {
    gitCommand = `git log --oneline -n ${limit} --pretty=format:"%H|%an|%ae|%ad|%s"`;
  } else {
    gitCommand = `git log ${branch} --oneline -n ${limit} --pretty=format:"%H|%an|%ae|%ad|%s"`;
  }

  if (args.author) gitCommand += ` --author="${args.author}"`;
  if (args.since) gitCommand += ` --since="${args.since}"`;
  if (args.until) gitCommand += ` --until="${args.until}"`;

  return gitCommand;
}

export class GitService {
  constructor() {}

  async handleGetGitLogTerminal(args: any) {
    try {
      const repoPath = args.repo_path || process.cwd();

      const gitDir = path.join(repoPath, ".git");
      if (!fs.existsSync(gitDir)) {
        throw new Error(`Not a Git repository: ${repoPath}`);
      }

      const branches = args.branches as string[];

      let response: string = "";
      if (!branches && !Array.isArray(branches)) {
        const gitCommand = constructLogsStatement(args);
        const result = await this.getAndFormatLogs(gitCommand, repoPath);
        response += result;
      } else {
        for (const branch of branches) {
          const gitCommand = constructLogsStatement(args, branch);
          const result = await this.getAndFormatLogs(gitCommand, repoPath);
          response += `\n=== Branch: ${branch} ===\n${result}`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Git log for ${repoPath} :\n\n${response}`,
          },
        ],
      };
    } catch (error) {
      // console.error("Error in handleGetGitLog:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `handleGetGitLog failed: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  private async getAndFormatLogs(
    command: string,
    repoPath: string
  ): Promise<string> {
    const output = execSync(command, {
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
    return commits
      .map((c) => `Date: ${c.date}\nMessage: ${c.message}\n${"─".repeat(40)}\n`)
      .join("\n");
  }

  

  async handleGetGitLog(args: any) {
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
