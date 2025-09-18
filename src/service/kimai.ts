import fetch, { Headers } from "node-fetch";
import { KimaiEntry, TimeSheetEntry } from "../types/index.js";

export class KimaiService {
  constructor() {}

  async pushKimaiEntries(args: { entries: KimaiEntry[] }) {
    if (!process.env.KIMAI_API_URL || !process.env.KIMAI_API_TOKEN) {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ Kimai API URL and/or API Token are not set in the environment variables. Please set `KIMAI_API_URL` and `KIMAI_API_TOKEN` in your `.env` file and restart the server and client.",
          },
        ],
      };
    }

    const results: string[] = [];

    const headers = this.getHeaders();

    for (const [index, entry] of args.entries.entries()) {
      try {

        const response = await fetch(`${process.env.KIMAI_API_URL}/timesheets`, {
          method: "POST",
          headers,
          body: JSON.stringify(entry),
        });

        const data = (await response.json()) as TimeSheetEntry;

        if (!response.ok) {
          results.push(
            `Entry ${index + 1}: ❌ Failed - ${JSON.stringify(data)}`
          );
        } else {
          results.push(`Entry ${index + 1}: ✅ Success - ID ${data.id}`);
        }
      } catch (err) {
        results.push(
          `Entry ${index + 1}: ❌ Exception - ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    return {
      content: [
        {
          type: "text",
          text: results.join("\n"),
        },
      ],
    };
  }

  private getHeaders() {
    const headers = new Headers();
    headers.append("accept", "application/json");
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${process.env.KIMAI_API_TOKEN}`);
    return headers;
  }
}
