import { describe, it, expect } from "vitest";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { GitUtils } from "../src/utils/git_utils.js";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

describe("handleGetGitLogTerminal", () => {
  it("throws McpError when path is not a git repo", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nogit-"));
    const utils = new GitUtils();
    await expect(
      utils.handleGetGitLogTerminal({ repo_path: tmp, number: 1 })
    ).rejects.toMatchObject({ code: ErrorCode.InternalError });
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});


