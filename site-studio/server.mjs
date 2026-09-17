import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4317);

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(body);
}

async function github(url, raw = false) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SRAKAJ-Site-Studio",
      "X-GitHub-Api-Version": "2022-11-28",
      "Accept": raw ? "application/vnd.github.raw+json" : "application/vnd.github+json"
    }
  });
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  return response;
}

const encodePath = value => value.split("/").map(encodeURIComponent).join("/");

function mime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ({
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff",
    ".woff2": "font/woff2", ".ttf": "font/ttf"
  })[ext] || "application/octet-stream";
}

function injectBridge(html, owner, repo, ref, filePath) {
  const folder = path.posix.dirname(filePath);
  const prefix = `/preview/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/`;
  const base = prefix + (folder === "." ? "" : `${encodePath(folder)}/`);
  const tag = `<base href="${base}"><script src="/bridge.js"></script>`;
  return /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${tag}`) : `${tag}${html}`;
}

async function serveStatic(reqPath, res) {
  const safe = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
  const target = path.join(publicDir, safe === "/" ? "index.html" : safe);
  if (!target.startsWith(publicDir) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) return false;
  res.writeHead(200, { "Content-Type": mime(target), "Cache-Control": "no-store" });
  res.end(fs.readFileSync(target));
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);

    if (url.pathname === "/api/auth/status") return json(res, 200, { connected: false });
    if (url.pathname === "/api/auth") return json(res, 403, { error: "Repository publishing is disabled in this GitHub-hosted preview build." });

    const fileMatch = url.pathname.match(/^\/api\/repo\/([^/]+)\/([^/]+)\/file$/);
    if (fileMatch && req.method === "GET") {
      const [, owner, repo] = fileMatch;
      const ref = url.searchParams.get("ref") || "main";
      const filePath = url.searchParams.get("path");
      if (!filePath) return json(res, 400, { error: "Missing path." });
      const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(ref)}`;
      const response = await github(api);
      const data = await response.json();
      const content = Buffer.from((data.content || "").replace(/\n/g, ""), "base64").toString("utf8");
      return json(res, 200, { path: filePath, sha: data.sha, content });
    }

    if (/^\/api\/repo\/[^/]+\/[^/]+\/publish$/.test(url.pathname)) {
      return json(res, 403, { error: "Publishing is disabled in this preview build." });
    }

    const previewMatch = url.pathname.match(/^\/preview\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/);
    if (previewMatch) {
      const [, owner, repo, ref, rawPath] = previewMatch;
      const filePath = decodeURIComponent(rawPath || "");
      const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(ref)}`;
      const response = await github(api, true);
      let buffer = Buffer.from(await response.arrayBuffer());
      const type = mime(filePath);
      if (type.startsWith("text/html")) buffer = Buffer.from(injectBridge(buffer.toString("utf8"), owner, repo, ref, filePath), "utf8");
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(buffer);
      return;
    }

    if (url.pathname === "/bridge.js") {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
      res.end(fs.readFileSync(path.join(publicDir, "bridge.js")));
      return;
    }

    if (await serveStatic(url.pathname, res)) return;
    text(res, 404, "Not found");
  } catch (error) {
    console.error(error);
    json(res, 500, { error: error.message || "Unexpected error" });
  }
});

server.listen(port, host, () => console.log(`SRAKAJ Site Studio preview: http://${host}:${port}`));
