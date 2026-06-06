import { readFileSync } from "fs";
import { join } from "path";

// GET /api/docs -> human-readable HTML documentation for the mobile REST API.
export function GET() {
  const html = readFileSync(
    join(process.cwd(), "src/app/api/docs/docs.html"),
    "utf-8",
  );
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
