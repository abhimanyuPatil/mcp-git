
# 🕒 MCP Server for Kimai Timesheets using Git Logs

A Model Context Protocol (MCP) server that lets your favorite desktop AI applications (Claude Desktop, VS Code Agents, ChatGPT with tool support, etc.) log work hours in Kimai automatically by analyzing your Git commit history.

## 🚩 Features
- Fetch git logs from multiple branches, authors, and date ranges.
- Push timesheet entries to Kimai using information from your Git activity.
- Integrates with LLMs: Ask your AI to fetch logs, summarize, and log time effortlessly.
- Secure API token usage for Kimai.
## 📥 Installation

#### Clone the repository

```bash
git clone https://github.com/your-org/git-kimai-mcp.git
cd git-kimai-mcp
```

#### Environmental Setup
Create a `.env` file and add:

```text
KIMAI_API_URL=https://your.kimai.instance/api/timesheets
KIMAI_API_TOKEN=your_kimai_api_token
```

#### Install dependencies

```bash
npm install
Build and start the server
```

```bash
npm run build-start
```

## 🤖 AI Application Integration

Edit your config:

Path: `~/.config/claude-desktop/mcp_servers.json` (Linux/macOS)

Path: `%APPDATA%/Claude/mcp_servers.json` (Windows)

```json
{
  "mcpServers": {
    "git-kimai": {
      "command": "node",
      "args": ["/path/to/build/index.js"]
    }
  }
}
```

## 💡 Example Workflow

With your AI running and MCP server enabled, ask:

“Fetch my commits for branch feature/foo this week and log as a timesheet entry under ‘Development’ in Kimai.”

AI will:

Call MCP server to get git logs

Summarize activity

Push timesheet(s) to Kimai via API
## 🛠️ Usage Notes
Make sure your repo path is a valid git repository.

Token must have appropriate Kimai permissions.