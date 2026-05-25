import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
const MAX_DIST_BYTES = 600 * 1024;
const MAX_FONT_BYTES = 100 * 1024;

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const html = readFileSync(join(DIST, "index.html"), "utf8");
const files = filesUnder(DIST);
const totalBytes = files.reduce((total, path) => total + statSync(path).size, 0);
const fontBytes = files
  .filter((path) => /\.woff2?$/.test(path))
  .reduce((total, path) => total + statSync(path).size, 0);

if (
  !html.includes(
    "worker-src &#39;self&#39; blob:; connect-src &#39;self&#39; https://api.github.com; script-src &#39;self&#39;;"
  )
) {
  throw new Error("Production CSP must separate worker, GitHub connection, and script directives.");
}
if (html.includes("localhost") || html.includes("127.0.0.1") || html.includes("sha256-mSIC")) {
  throw new Error("Development-only CSP permissions were included in the production document.");
}
if (totalBytes > MAX_DIST_BYTES) {
  throw new Error(`Production artifact is ${totalBytes} bytes; limit is ${MAX_DIST_BYTES} bytes.`);
}
if (fontBytes > MAX_FONT_BYTES) {
  throw new Error(`Font payload is ${fontBytes} bytes; limit is ${MAX_FONT_BYTES} bytes.`);
}

console.log(`build policy: CSP restricted, dist ${totalBytes} bytes, fonts ${fontBytes} bytes`);
