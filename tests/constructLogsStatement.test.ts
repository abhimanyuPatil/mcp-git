import { describe, it, expect } from "vitest";
import { constructLogsStatement } from "../src/service/git.js";

describe("constructLogsStatement", () => {
  it("builds default command with limit 25 when no args", () => {
    const cmd = constructLogsStatement({});
    expect(cmd).toBe(
      'git log --oneline -n 25 --pretty=format:"%H|%an|%ae|%ad|%s"'
    );
  });

  it("includes explicit limit and filters", () => {
    const cmd = constructLogsStatement({ number: 5, author: "Alice", since: "2024-01-01", until: "2024-12-31" });
    expect(cmd).toBe(
      'git log --oneline -n 5 --pretty=format:"%H|%an|%ae|%ad|%s" --author="Alice" --since="2024-01-01" --until="2024-12-31"'
    );
  });

  it("targets a specific branch when provided", () => {
    const cmd = constructLogsStatement({ number: 7 }, "main");
    expect(cmd).toBe(
      'git log main --oneline -n 7 --pretty=format:"%H|%an|%ae|%ad|%s"'
    );
  });

  it("treats HEAD or empty branch as default", () => {
    expect(constructLogsStatement({ number: 3 }, "")).toBe(
      'git log --oneline -n 3 --pretty=format:"%H|%an|%ae|%ad|%s"'
    );
    expect(constructLogsStatement({ number: 3 }, "HEAD")).toBe(
      'git log --oneline -n 3 --pretty=format:"%H|%an|%ae|%ad|%s"'
    );
  });
});


