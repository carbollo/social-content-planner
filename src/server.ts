import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API base
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Listar cuentas
app.get("/api/accounts", async (_req, res) => {
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(accounts);
});

// Crear cuenta
app.post("/api/accounts", async (req, res) => {
  const { platform, username, displayName, timezone } = req.body;

  if (!platform || !username) {
    return res.status(400).json({ error: "platform y username son obligatorios" });
  }

  const account = await prisma.socialAccount.create({
    data: {
      platform,
      username,
      displayName,
      timezone: timezone || "UTC",
    },
  });

  res.status(201).json(account);
});

// Listar contenidos
app.get("/api/contents", async (_req, res) => {
  const contents = await prisma.contentItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(contents);
});

// Crear contenido
app.post("/api/contents", async (req, res) => {
  const { title, description, mediaUrl, notes } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title es obligatorio" });
  }

  const content = await prisma.contentItem.create({
    data: { title, description, mediaUrl, notes },
  });

  res.status(201).json(content);
});

// Listar calendario (posts programados)
app.get("/api/scheduled-posts", async (req, res) => {
  const { from, to } = req.query;

  const where: any = {};
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(String(from));
    if (to) where.scheduledAt.lte = new Date(String(to));
  }

  const posts = await prisma.scheduledPost.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      account: true,
      content: true,
    },
  });

  res.json(posts);
});

// Crear / programar un post
app.post("/api/scheduled-posts", async (req, res) => {
  const { accountId, contentId, scheduledAt } = req.body;

  if (!accountId || !contentId || !scheduledAt) {
    return res
      .status(400)
      .json({ error: "accountId, contentId y scheduledAt son obligatorios" });
  }

  const scheduled = await prisma.scheduledPost.create({
    data: {
      accountId,
      contentId,
      scheduledAt: new Date(scheduledAt),
    },
    include: {
      account: true,
      content: true,
    },
  });

  res.status(201).json(scheduled);
});

// En producción, servir la SPA construida
const clientBuildPath = path.join(__dirname, "..", "client-dist");
app.use(express.static(clientBuildPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor escuchando en puerto ${port}`);
});

