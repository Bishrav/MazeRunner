const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8001);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function ensureProgressFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROGRESS_FILE)) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ unlocked: 1, completions: [] }, null, 2));
  }
}

function readProgress() {
  ensureProgressFile();
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return { unlocked: 1, completions: [] };
  }
}

function writeProgress(progress) {
  ensureProgressFile();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/progress" && request.method === "GET") {
    sendJson(response, 200, readProgress());
    return true;
  }

  if (pathname === "/api/progress" && request.method === "POST") {
    const body = JSON.parse((await readBody(request)) || "{}");
    const current = readProgress();
    const unlocked = Math.max(1, Math.min(7, Number(body.unlocked || current.unlocked || 1)));
    const completion = body.completion && typeof body.completion === "object" ? body.completion : null;
    const completions = Array.isArray(current.completions) ? current.completions.slice(-49) : [];
    if (completion) completions.push({ ...completion, savedAt: new Date().toISOString() });
    const next = { unlocked, completions };
    writeProgress(next);
    sendJson(response, 200, next);
    return true;
  }

  if (pathname === "/api/reset" && request.method === "POST") {
    const reset = { unlocked: 1, completions: [] };
    writeProgress(reset);
    sendJson(response, 200, reset);
    return true;
  }

  return false;
}

function serveStatic(response, pathname) {
  const normalized = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(ROOT, `.${decodeURIComponent(normalized)}`);
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const type = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(data);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/") && (await handleApi(request, response, url.pathname))) return;
    serveStatic(response, url.pathname);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`MazeRunner server running at http://localhost:${PORT}`);
});
