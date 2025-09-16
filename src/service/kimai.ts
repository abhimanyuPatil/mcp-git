import { KimaiEntry } from "../types/index.js";

export class KimaiService {
  constructor() {}

  async pushKimaiEntries(args: { entries: KimaiEntry[] }) {
    const kimaiApiUrl = `${process.env.KIMAI_API_URL}/timesheets`;

    if (!kimaiApiUrl) {
      throw new Error(`Kimai Endpoint not set`);
    }

    const results: string[] = [];

    const headers = this.getHeaders();

    for (const [index, entry] of args.entries.entries()) {
      try {
        const response = await fetch(kimaiApiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(entry),
        });

        const data = await response.json();
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
    const kimaiToken = process.env.KIMAI_API_TOKEN;
    if (!kimaiToken) {
      throw new Error(`Kimai Endpoint not set`);
    }
    const headers = new Headers();
    headers.append("accept", "application/json");
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Bearer ${kimaiToken}`);
    return headers;
  }
}
