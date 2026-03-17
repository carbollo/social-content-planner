import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

type SocialAccount = {
  id: string;
  platform: string;
  username: string;
  displayName?: string | null;
  timezone: string;
  accessToken?: string | null;
  apiAccountId?: string | null;
};

type ContentItem = {
  id: string;
  title: string;
  description?: string | null;
};

type ScheduledPost = {
  id: string;
  scheduledAt: string;
  status: string;
  account: SocialAccount;
  content: ContentItem;
};

export function App() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);

  const [newAccount, setNewAccount] = useState({
    platform: "instagram",
    username: "",
    displayName: "",
    timezone: "UTC",
  });

  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
  });

  const [newScheduled, setNewScheduled] = useState({
    accountId: "",
    contentId: "",
    datetime: "",
  });

  useEffect(() => {
    refreshAll();
  }, []);

  async function refreshAll() {
    const [accRes, contRes, schedRes] = await Promise.all([
      axios.get<SocialAccount[]>("/api/accounts"),
      axios.get<ContentItem[]>("/api/contents"),
      axios.get<ScheduledPost[]>("/api/scheduled-posts"),
    ]);
    setAccounts(accRes.data);
    setContents(contRes.data);
    setScheduled(schedRes.data);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccount.username.trim()) return;
    await axios.post("/api/accounts", newAccount);
    setNewAccount({
      platform: "instagram",
      username: "",
      displayName: "",
      timezone: "UTC",
    });
    refreshAll();
  }

  async function handleCreateContent(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.title.trim()) return;
    await axios.post("/api/contents", newContent);
    setNewContent({ title: "", description: "" });
    refreshAll();
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!newScheduled.accountId || !newScheduled.contentId || !newScheduled.datetime) return;
    await axios.post("/api/scheduled-posts", {
      accountId: newScheduled.accountId,
      contentId: newScheduled.contentId,
      scheduledAt: newScheduled.datetime,
    });
    setNewScheduled({ accountId: "", contentId: "", datetime: "" });
    refreshAll();
  }

  async function handleConnectInstagram(accountId: string) {
    const res = await axios.get<{ url: string }>("/api/auth/instagram/url", {
      params: { accountId },
    });
    window.location.href = res.data.url;
  }

  async function handleConnectTikTok(accountId: string) {
    const res = await axios.get<{ url: string }>("/api/auth/tiktok/url", {
      params: { accountId },
    });
    window.location.href = res.data.url;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="branding">
          <div className="logo-dot" />
          <div>
            <h1>Planner Social</h1>
            <p>Organiza tus cuentas de Instagram y TikTok</p>
          </div>
        </div>
        <div className="header-meta">
          <span>{accounts.length} cuentas</span>
          <span>{contents.length} contenidos</span>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Cuentas</h2>
          <p className="panel-subtitle">Registra las cuentas que vas a gestionar.</p>
          <form className="form-grid" onSubmit={handleCreateAccount}>
            <label>
              Plataforma
              <select
                value={newAccount.platform}
                onChange={(e) => setNewAccount((p) => ({ ...p, platform: e.target.value }))}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </label>
            <label>
              Usuario
              <input
                value={newAccount.username}
                onChange={(e) => setNewAccount((p) => ({ ...p, username: e.target.value }))}
                placeholder="@cuenta"
                required
              />
            </label>
            <label>
              Nombre visible
              <input
                value={newAccount.displayName}
                onChange={(e) => setNewAccount((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Marca / Proyecto"
              />
            </label>
            <label>
              Zona horaria
              <input
                value={newAccount.timezone}
                onChange={(e) => setNewAccount((p) => ({ ...p, timezone: e.target.value }))}
                placeholder="Ej: Europe/Madrid"
              />
            </label>
            <button type="submit" className="primary">
              Guardar cuenta
            </button>
          </form>

          <ul className="list">
            {accounts.map((acc) => (
              <li key={acc.id} className="list-item">
                <div className={`pill pill-${acc.platform}`}>
                  {acc.platform === "instagram" ? "Instagram" : "TikTok"}
                </div>
                <div className="list-main">
                  <div className="list-title">{acc.displayName || acc.username}</div>
                  <div className="list-subtitle">@{acc.username}</div>
                </div>
                <div className="list-meta">
                  <div>{acc.timezone}</div>
                  {acc.platform === "instagram" && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleConnectInstagram(acc.id)}
                    >
                      {acc.accessToken ? "Conectada" : "Conectar IG"}
                    </button>
                  )}
                  {acc.platform === "tiktok" && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleConnectTikTok(acc.id)}
                    >
                      {acc.accessToken ? "Conectada" : "Conectar TikTok"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Biblioteca de contenidos</h2>
          <p className="panel-subtitle">Ideas y piezas listas para programar.</p>
          <form className="form-grid" onSubmit={handleCreateContent}>
            <label>
              Título
              <input
                value={newContent.title}
                onChange={(e) => setNewContent((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej: Reel tips de crecimiento"
                required
              />
            </label>
            <label className="full-row">
              Descripción / copy
              <textarea
                value={newContent.description}
                onChange={(e) =>
                  setNewContent((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Texto, hashtags, notas…"
                rows={3}
              />
            </label>
            <button type="submit" className="primary">
              Guardar contenido
            </button>
          </form>

          <ul className="list">
            {contents.map((c) => (
              <li key={c.id} className="list-item">
                <div className="avatar-dot" />
                <div className="list-main">
                  <div className="list-title">{c.title}</div>
                  {c.description && (
                    <div className="list-subtitle">
                      {c.description.length > 80
                        ? c.description.slice(0, 80) + "…"
                        : c.description}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel panel-wide">
          <h2>Calendario de publicaciones</h2>
          <p className="panel-subtitle">
            Decide qué contenido va a cada cuenta y en qué día y hora.
          </p>
          <form className="form-grid" onSubmit={handleSchedule}>
            <label>
              Cuenta
              <select
                value={newScheduled.accountId}
                onChange={(e) =>
                  setNewScheduled((p) => ({ ...p, accountId: e.target.value }))
                }
                required
              >
                <option value="">Selecciona cuenta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName || a.username} ({a.platform})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Contenido
              <select
                value={newScheduled.contentId}
                onChange={(e) =>
                  setNewScheduled((p) => ({ ...p, contentId: e.target.value }))
                }
                required
              >
                <option value="">Selecciona contenido</option>
                {contents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Día y hora
              <input
                type="datetime-local"
                value={newScheduled.datetime}
                onChange={(e) =>
                  setNewScheduled((p) => ({ ...p, datetime: e.target.value }))
                }
                required
              />
            </label>
            <button type="submit" className="primary">
              Programar publicación
            </button>
          </form>

          <div className="calendar">
            {scheduled.length === 0 && (
              <p className="empty">Todavía no hay publicaciones programadas.</p>
            )}
            {scheduled.map((p) => (
              <div key={p.id} className="calendar-item">
                <div className={`pill pill-${p.account.platform}`}>
                  {p.account.platform === "instagram" ? "IG" : "TikTok"}
                </div>
                <div className="calendar-main">
                  <div className="calendar-title">{p.content.title}</div>
                  <div className="calendar-subtitle">
                    @{p.account.username} ·{" "}
                    {dayjs(p.scheduledAt).format("DD/MM/YYYY HH:mm")}
                  </div>
                </div>
                <div className={`status status-${p.status}`}>{p.status}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

