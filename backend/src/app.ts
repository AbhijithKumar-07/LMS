import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { borrowerRouter } from "./routes/borrower.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";

export function createApp() {
  const app = express();
  const allowedOrigins = env.CLIENT_ORIGINS.split(",").map((origin) => origin.trim());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (req, res) => {
    if (req.accepts("html")) {
      res.setHeader("Content-Type", "text/html");
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CreditSea LMS — Backend API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.75);
      --border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
      --accent: #10b981;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 50% 0%, #1e293b 0%, var(--bg) 70%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      position: relative;
      overflow-x: hidden;
    }
    .glow-orb {
      position: absolute;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 300px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 70%);
      filter: blur(80px);
      z-index: 0;
      pointer-events: none;
    }
    .container {
      position: relative;
      z-index: 1;
      max-width: 800px;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.75rem;
    }
    p.sub {
      color: var(--text-muted);
      font-size: 1rem;
      max-width: 540px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 1.75rem;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.85rem;
    }
    .endpoint-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.85rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    .endpoint-card:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }
    .endpoint-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.95rem;
      font-weight: 600;
    }
    .method-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 0.35rem;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }
    .endpoint-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      border-radius: 0.65rem;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .footer {
      text-align: center;
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="glow-orb"></div>
  <div class="container">
    <div class="header">
      <div class="badge">
        <span class="pulse-dot"></span>
        API Engine Active & Healthy
      </div>
      <h1>CreditSea LMS Engine</h1>
      <p class="sub">Production RESTful API powering enterprise multi-role loan origination, BRE automated underwriting, and collection workflows.</p>
    </div>

    <div class="card">
      <div class="section-title">Core API Modules</div>
      <div class="grid">
        <a href="/health" class="endpoint-card">
          <div class="endpoint-title">
            <span>Health Check</span>
            <span class="method-badge">GET</span>
          </div>
          <span class="endpoint-path">/health</span>
        </a>
        <div class="endpoint-card">
          <div class="endpoint-title">
            <span>Authentication</span>
            <span class="method-badge">POST/GET</span>
          </div>
          <span class="endpoint-path">/api/auth/*</span>
        </div>
        <div class="endpoint-card">
          <div class="endpoint-title">
            <span>Borrower & BRE</span>
            <span class="method-badge">REST</span>
          </div>
          <span class="endpoint-path">/api/borrower/*</span>
        </div>
        <div class="endpoint-card">
          <div class="endpoint-title">
            <span>Operations RBAC</span>
            <span class="method-badge">REST</span>
          </div>
          <span class="endpoint-path">/api/dashboard/*</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <a href="/health" class="btn btn-primary">Check System Health</a>
      <a href="https://github.com/AbhijithKumar-07/LMS" target="_blank" rel="noopener" class="btn btn-secondary">View GitHub Repository</a>
    </div>

    <div class="footer">
      CreditSea Loan Management System &bull; Version 1.0.0 &bull; Node.js + TypeScript + MongoDB
    </div>
  </div>
</body>
</html>`);
    }

    res.json({
      name: "CreditSea Loan Management System API",
      status: "active",
      version: "1.0.0",
      healthCheck: "/health",
      apiEndpoints: {
        auth: "/api/auth",
        borrower: "/api/borrower",
        dashboard: "/api/dashboard"
      }
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/borrower", borrowerRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(errorMiddleware);

  return app;
}
