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

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

// API base
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ===== Instagram OAuth =====

app.get("/api/auth/instagram/url", async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({ error: "accountId es obligatorio" });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.platform !== "instagram") {
      return res.status(404).json({ error: "Cuenta de Instagram no encontrada" });
    }

    const clientId = ensureEnv("INSTAGRAM_CLIENT_ID");
    const redirectUri = ensureEnv("INSTAGRAM_REDIRECT_URI");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "instagram_basic",
      response_type: "code",
      state: accountId,
    });

    const url = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    res.json({ url });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error generando URL de Instagram" });
  }
});

app.get("/api/auth/instagram/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== "string" || typeof state !== "string") {
    return res.status(400).send("Parámetros inválidos");
  }

  try {
    const clientId = ensureEnv("INSTAGRAM_CLIENT_ID");
    const clientSecret = ensureEnv("INSTAGRAM_CLIENT_SECRET");
    const redirectUri = ensureEnv("INSTAGRAM_REDIRECT_URI");

    // Intercambiar code por short-lived access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      // eslint-disable-next-line no-console
      console.error("Error token Instagram:", text);
      return res.status(500).send("Error obteniendo token de Instagram");
    }

    const tokenData: any = await tokenResponse.json();

    const accessToken = tokenData.access_token as string | undefined;
    const userId = tokenData.user_id as string | number | undefined;

    if (!accessToken) {
      return res.status(500).send("Instagram no devolvió access_token");
    }

    await prisma.socialAccount.update({
      where: { id: state },
      data: {
        accessToken,
        apiAccountId: userId ? String(userId) : undefined,
      },
    });

    res.redirect("/");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).send("Error procesando callback de Instagram");
  }
});

// ===== TikTok OAuth (v2) =====

app.get("/api/auth/tiktok/url", async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId || typeof accountId !== "string") {
      return res.status(400).json({ error: "accountId es obligatorio" });
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account || account.platform !== "tiktok") {
      return res.status(404).json({ error: "Cuenta de TikTok no encontrada" });
    }

    const clientKey = ensureEnv("TIKTOK_CLIENT_KEY");
    const redirectUri = ensureEnv("TIKTOK_REDIRECT_URI");

    const params = new URLSearchParams({
      client_key: clientKey,
      response_type: "code",
      scope: "user.info.basic,video.upload",
      redirect_uri: redirectUri,
      state: accountId,
    });

    const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    res.json({ url });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error generando URL de TikTok" });
  }
});

app.get("/api/auth/tiktok/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== "string" || typeof state !== "string") {
    return res.status(400).send("Parámetros inválidos");
  }

  try {
    const clientKey = ensureEnv("TIKTOK_CLIENT_KEY");
    const clientSecret = ensureEnv("TIKTOK_CLIENT_SECRET");
    const redirectUri = ensureEnv("TIKTOK_REDIRECT_URI");

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      // eslint-disable-next-line no-console
      console.error("Error token TikTok:", text);
      return res.status(500).send("Error obteniendo token de TikTok");
    }

    const tokenData: any = await tokenResponse.json();

    const accessToken = tokenData.access_token as string | undefined;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const openId =
      (tokenData.open_id as string | undefined) ||
      (tokenData.user && (tokenData.user.open_id as string | undefined));

    if (!accessToken) {
      return res.status(500).send("TikTok no devolvió access_token");
    }

    await prisma.socialAccount.update({
      where: { id: state },
      data: {
        accessToken,
        refreshToken,
        apiAccountId: openId,
      },
    });

    res.redirect("/");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).send("Error procesando callback de TikTok");
  }
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

