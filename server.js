const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;
const ownerPin = process.env.OWNER_PIN;
const ownerCookieSecret = process.env.OWNER_COOKIE_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const ownerAccessDays = 30;

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((item) => item.trim().split("=")).filter(([key, value]) => key && value));
}

function signOwnerToken(expiresAt) {
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", ownerCookieSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function hasOwnerAccess(request) {
  if (!ownerCookieSecret) return false;
  const token = parseCookies(request.headers.cookie).owner_access;
  if (!token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", ownerCookieSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()).expiresAt > Date.now();
  } catch {
    return false;
  }
}

function supabaseReady() {
  return Boolean(supabaseUrl && supabaseSecretKey);
}

async function supabaseRequest(route, options = {}) {
  if (!supabaseReady()) throw new Error("Supabase is not configured");
  const response = await fetch(`${supabaseUrl}/rest/v1/${route}`, {
    ...options,
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${supabaseSecretKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? null : response.json();
}

app.disable("x-powered-by");
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/owner/access", (request, response) => {
  response.json({ ownerMode: hasOwnerAccess(request) });
});

app.post("/api/owner/unlock", (request, response) => {
  if (!ownerPin || !ownerCookieSecret || String(request.body.code || "") !== ownerPin) {
    return response.status(401).json({ ownerMode: false, message: "That code is not correct." });
  }

  const maxAge = ownerAccessDays * 24 * 60 * 60;
  response.cookie("owner_access", signOwnerToken(Date.now() + maxAge * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAge * 1000,
    path: "/",
  });
  response.json({ ownerMode: true, expiresInDays: ownerAccessDays });
});

app.post("/api/owner/lock", (_request, response) => {
  response.clearCookie("owner_access", { path: "/" });
  response.json({ ownerMode: false });
});

function signRequestAccess(id) {
  const payload = Buffer.from(id).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", ownerCookieSecret).update(payload).digest("base64url")}`;
}

function hasRequestAccess(request, id) {
  const token = parseCookies(request.headers.cookie).customer_request;
  if (!token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", ownerCookieSecret).update(payload).digest("base64url");
  return signature === expected && Buffer.from(payload, "base64url").toString() === id;
}

app.post("/api/requests", async (request, response) => {
  if (!supabaseReady()) return response.status(503).json({ message: "Live requests are still being configured." });
  try {
    const rows = await supabaseRequest("service_requests", { method: "POST", body: JSON.stringify({ request_type: request.body.type, customer_details: {} }) });
    const id = rows[0].id;
    response.cookie("customer_request", signRequestAccess(id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 86400000, path: "/" });
    response.json({ id });
  } catch { response.status(503).json({ message: "Unable to start this request right now." }); }
});

app.get("/api/requests/:id", async (request, response) => {
  if (!hasRequestAccess(request, request.params.id)) return response.status(403).json({ message: "Request access expired." });
  try {
    const rows = await supabaseRequest(`service_requests?id=eq.${encodeURIComponent(request.params.id)}&select=id,status,customer_details,pickup_details,dropoff_details`);
    response.json(rows[0] || {});
  } catch { response.status(503).json({ message: "Unable to check request status." }); }
});

app.post("/api/requests/:id/messages", async (request, response) => {
  if (!hasRequestAccess(request, request.params.id)) return response.status(403).json({ message: "Request access expired." });
  try { await supabaseRequest("request_messages", { method: "POST", body: JSON.stringify({ request_id: request.params.id, sender_type: "customer", body: String(request.body.body || "").trim() }) }); response.status(201).json({ sent: true }); }
  catch { response.status(503).json({ message: "Unable to send message." }); }
});

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "hopes-go-launch" });
});

app.get("/api/driver-availability", async (_request, response) => {
  if (!supabaseReady()) {
    return response.status(503).json({ available: false, clockedInDrivers: 0 });
  }
  try {
    const drivers = await supabaseRequest("driver_shifts?clocked_in=eq.true&select=driver_username");
    response.json({ available: drivers.length > 0, clockedInDrivers: drivers.length });
  } catch {
    response.status(503).json({ available: false, clockedInDrivers: 0 });
  }
});

app.use((_request, response) => {
  response.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Hope's & Go is running on port ${port}`);
});
