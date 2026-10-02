import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  FileCheck2,
  GitBranch,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Wallet,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  breadcrumb,
  filterNodes,
  levels,
  maturity,
  money,
  type Collection,
  type Entity,
  type Issue,
  type Portfolio,
  type Workspace,
} from "./model";

const sections = [
  { id: "overview", name: "Visión ejecutiva", icon: LayoutDashboard },
  { id: "goals", name: "Estrategia y objetivos", icon: Target },
  { id: "nodes", name: "Mapa de capacidades", icon: Layers3 },
  { id: "assessments", name: "Madurez y evidencia", icon: Activity },
  { id: "priorities", name: "Priorización de inversión", icon: Wallet },
  { id: "traces", name: "Trazabilidad tecnológica", icon: Network },
  { id: "initiatives", name: "Hoja de ruta", icon: GitBranch },
  { id: "decisions", name: "Decisiones de arquitectura", icon: FileCheck2 },
  { id: "validation", name: "Gobernanza", icon: ShieldCheck },
];
const quadrantNames: Record<string, string> = {
  "strategic-bet": "Apuesta estratégica",
  protect: "Proteger",
  "quick-win": "Mejora rápida",
  monitor: "Observar",
};
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: [string, string][];
  optional?: boolean;
  min?: number;
  max?: number;
  step?: string;
};
type Editor = { collection: Collection; item?: Entity };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.title || `Error ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>();
  const [portfolio, setPortfolio] = useState<Portfolio>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [section, setSection] = useState("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("4");
  const [budget, setBudget] = useState(200000);
  const [token, setToken] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  const [draft, setDraft] = useState<Entity>({ id: "" });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState("orders");
  const [deleteItem, setDeleteItem] = useState<Editor>();
  async function load() {
    try {
      const [w, v] = await Promise.all([
        request<Workspace>("/api/workspace"),
        request<{ issues: Issue[] }>("/api/validation"),
      ]);
      setWorkspace(w);
      setIssues(v.issues);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!workspace) return;
    const controller = new AbortController();
    request<Portfolio>(`/api/priorities?budget=${budget}`, {
      signal: controller.signal,
    })
      .then(setPortfolio)
      .catch((e) => {
        if (e.name !== "AbortError") {
          setPortfolio(undefined);
          setError(e.message);
        }
      });
    return () => controller.abort();
  }, [workspace, budget]);
  const caps = workspace?.nodes.filter((n) => n.level === 4) || [];
  const find = (collection: Collection, id: unknown) =>
    workspace?.[collection].find((x) => x.id === id);
  const name = (collection: Collection, id: unknown) =>
    String(find(collection, id)?.name || id || "—");
  const opts = (collection: Collection, onlyCaps = false): [string, string][] =>
    (workspace?.[collection] || [])
      .filter((x) => !onlyCaps || x.level === 4)
      .map((x) => [x.id, String(x.name)]);
  const text = (key: string, label: string, optional = false): Field => ({
    key,
    label,
    optional,
  });
  const select = (
    key: string,
    label: string,
    options: [string, string][],
    optional = false,
  ): Field => ({ key, label, options, optional });
  const numeric = (
    key: string,
    label: string,
    min = 1,
    max = 5,
    step = "1",
  ): Field => ({ key, label, type: "number", min, max, step });
  const teams: [string, string][] = [
    ["stream-aligned", "Alineado al flujo"],
    ["platform", "Plataforma"],
    ["enabling", "Habilitador"],
    ["complicated-subsystem", "Subsistema especializado"],
  ];
  function fields(collection: Collection): Field[] {
    const cap = select("capabilityId", "Capacidad", opts("nodes", true));
    switch (collection) {
      case "goals":
        return [
          text("name", "Objetivo estratégico"),
          text("metric", "Indicador / unidad"),
          text("owner", "Responsable"),
          numeric("target", "Meta", 0.01, 100000000, ".01"),
        ];
      case "nodes":
        return [
          text("name", "Nombre de la capacidad"),
          select(
            "level",
            "Nivel",
            levels.map((l, i) => [String(i + 1), `${i + 1}. ${l}`]),
          ),
          select(
            "parentId",
            "Padre inmediato",
            opts("nodes").filter(
              ([id]) =>
                id !== editor?.item?.id &&
                find("nodes", id)?.level === Number(draft.level) - 1,
            ),
            true,
          ),
          text("definition", "Definición del resultado"),
          text("owner", "Responsable"),
          select("teamType", "Tipo de equipo", teams),
          text("journey", "Recorrido del cliente", true),
        ];
      case "alignments":
        return [
          cap,
          select("goalId", "Objetivo", opts("goals")),
          numeric("weight", "Peso de contribución", 0.01, 1, ".01"),
        ];
      case "assessments":
        return [
          cap,
          ...["people", "process", "data", "technology", "target"].map(
            (key, i) =>
              numeric(
                key,
                [
                  "Personas",
                  "Proceso",
                  "Datos",
                  "Tecnología",
                  "Madurez objetivo",
                ][i],
              ),
          ),
          ...["revenue", "cost", "risk", "customer", "feasibility"].map(
            (key, i) =>
              numeric(
                key,
                [
                  "Impacto en ingresos",
                  "Impacto en costo",
                  "Impacto en riesgo",
                  "Impacto en cliente",
                  "Viabilidad",
                ][i],
                1,
                5,
                ".1",
              ),
          ),
          text("evidence", "Evidencia verificable y alcance de muestra"),
          text("assessor", "Evaluador"),
        ];
      case "assets":
        return [
          text("name", "Nombre del activo"),
          select("kind", "Capa", [
            ["process", "Proceso"],
            ["data", "Datos"],
            ["application", "Aplicación"],
            ["technology", "Tecnología"],
          ]),
          text("description", "Descripción"),
          text("owner", "Responsable"),
          select("state", "Estado", [
            ["current", "Actual"],
            ["target", "Objetivo"],
            ["retiring", "En retiro"],
          ]),
        ];
      case "traces":
        return [
          cap,
          select("assetId", "Activo", opts("assets")),
          text("rationale", "Justificación de soporte"),
        ];
      case "initiatives":
        return [
          text("name", "Iniciativa"),
          cap,
          text("owner", "Responsable"),
          text("quarter", "Trimestre (YYYY-Q1 a Q4)"),
          numeric("budget", "Inversión estimada USD", 0, 100000000, ".01"),
          select("status", "Estado", [
            ["planned", "Planificada"],
            ["in-progress", "En ejecución"],
            ["completed", "Completada"],
          ]),
          text("dependencies", "IDs de dependencias, separados por coma", true),
          text("outcome", "Resultado esperado / criterio de éxito"),
        ];
      case "decisions":
        return [
          text("title", "Título"),
          cap,
          text("context", "Contexto"),
          text("choice", "Decisión"),
          text("tradeoffs", "Consecuencias y compromisos"),
          select("status", "Estado", [
            ["proposed", "Propuesta"],
            ["accepted", "Aceptada"],
            ["superseded", "Sustituida"],
          ]),
        ];
    }
  }
  function openEditor(collection: Collection, item?: Entity) {
    setError("");
    setEditor({ collection, item });
    setDraft(
      item
        ? { ...item }
        : {
            id: crypto.randomUUID(),
            level: 4,
            teamType: "stream-aligned",
            weight: 0.8,
            people: 2,
            process: 2,
            data: 2,
            technology: 2,
            target: 4,
            revenue: 3,
            cost: 3,
            risk: 3,
            customer: 3,
            feasibility: 3,
            budget: 0,
            status: collection === "decisions" ? "proposed" : "planned",
            quarter: "2027-Q1",
            state: "target",
            kind: "application",
            capabilityId: selected,
            parentId: "operations-sub",
          },
    );
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setError("");
    const payload: Entity = { id: draft.id, version: draft.version ?? 1 };
    for (const f of fields(editor.collection))
      payload[f.key] =
        f.type === "number" || f.key === "level"
          ? Number(draft[f.key])
          : (draft[f.key] ?? "");
    if (editor.collection === "nodes" && !payload.parentId)
      payload.parentId = null;
    try {
      await request(
        `/api/${editor.collection}${editor.item ? `/${draft.id}` : ""}`,
        {
          method: editor.item ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Editor-Token": token,
          },
          body: JSON.stringify(payload),
        },
      );
      setEditor(undefined);
      setNotice("Cambio guardado. Trazabilidad y priorización actualizadas.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!deleteItem?.item) return;
    setSaving(true);
    try {
      await request(`/api/${deleteItem.collection}/${deleteItem.item.id}`, {
        method: "DELETE",
        headers: { "X-Editor-Token": token },
      });
      setDeleteItem(undefined);
      setNotice("Registro eliminado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const actions = (collection: Collection, item: Entity) => (
    <div className="row-actions">
      <button
        title="Editar"
        aria-label={`Editar ${item.name || item.title || item.id}`}
        onClick={() => openEditor(collection, item)}
      >
        <Pencil size={15} />
      </button>
      <button
        title="Eliminar"
        aria-label={`Eliminar ${item.name || item.title || item.id}`}
        onClick={() => {
          setError("");
          setDeleteItem({ collection, item });
        }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
  const add = (collection: Collection, label = "Nuevo registro") => (
    <button className="button primary" onClick={() => openEditor(collection)}>
      <Plus size={16} />
      {label}
    </button>
  );
  const avg = workspace?.assessments.length
    ? workspace.assessments.reduce((a, b) => a + maturity(b), 0) /
      workspace.assessments.length
    : 0;
  function Matrix() {
    return (
      <div className="matrix">
        <div className="matrix-label vertical">IMPACTO EN EL NEGOCIO</div>
        <svg
          role="img"
          aria-label="Matriz de impacto y oportunidad"
          viewBox="0 0 550 280"
        >
          <rect x="45" y="15" width="180" height="75" fill="#f1f5f3" />
          <rect x="225" y="15" width="270" height="75" fill="#d5eee3" />
          <rect x="45" y="90" width="180" height="175" fill="#f7f8f6" />
          <rect x="225" y="90" width="270" height="175" fill="#eef5e8" />
          <path
            d="M45 90H495 M225 15V265"
            stroke="#c2cec5"
            strokeDasharray="5 5"
          />
          <text x="65" y="37">
            PROTEGER
          </text>
          <text x="245" y="37">
            APOSTAR
          </text>
          <text x="65" y="250">
            OBSERVAR
          </text>
          <text x="245" y="250">
            MEJORAR
          </text>
          {[1, 2, 3, 4, 5].map((v) => (
            <text key={v} x="25" y={270 - v * 50}>
              {v}
            </text>
          ))}
          {(portfolio?.priorities || []).map((p) => {
            const cluster = (portfolio?.priorities || []).map((point, index) => ({ point, index })).filter(({ point }) => point.impact === p.impact && point.opportunity === p.opportunity);
            if (cluster[0].point.id !== p.id) return null;
            return <g key={p.id}>
              <circle
                cx={45 + p.opportunity * 90}
                cy={265 - p.impact * 50}
                r={cluster.length > 1 ? 17 : 13}
                fill={cluster.some(({ point }) => point.funded) ? "#116453" : "#95aaa0"}
                stroke="white"
                strokeWidth="2"
              >
                <title>{`${cluster.map(({ point }) => point.name).join(' · ')}: impacto ${p.impact}, oportunidad ${p.opportunity}`}</title>
              </circle>
              <text
                x={45 + p.opportunity * 90}
                y={269 - p.impact * 50}
                textAnchor="middle"
                className="dot-label"
              >
                {cluster.map(({ index }) => index + 1).join('/')}
              </text>
            </g>;
          })}
        </svg>
        <div className="matrix-label">OPORTUNIDAD DE MEJORA →</div>
        <p className="hint">
          Verde: incluye una capacidad financiable · Números: posición en el ranking
        </p>
      </div>
    );
  }
  function PriorityTable() {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Capacidad</th>
              <th>Impacto</th>
              <th>Oportunidad</th>
              <th>Puntaje</th>
              <th>Decisión</th>
            </tr>
          </thead>
          <tbody>
            {portfolio?.priorities.map((p, i) => (
              <tr key={p.id}>
                <td>
                  <span className="rank">{i + 1}</span>
                  {p.name}
                </td>
                <td>{p.impact.toFixed(2)}</td>
                <td>{p.opportunity.toFixed(2)}</td>
                <td>
                  <strong>{p.score.toFixed(2)}</strong>
                </td>
                <td>
                  <span
                    title={p.reason}
                    className={`badge ${p.funded ? "green" : ""}`}
                  >
                    {p.funded ? "Financiable" : quadrantNames[p.quadrant]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!portfolio && (
          <p className="empty">Esperando al motor de decisiones…</p>
        )}
      </div>
    );
  }
  if (!workspace)
    return (
      <main className="loading">
        <Compass size={40} />
        <h1>Enterprise Architecture Hub</h1>
        <p>{error || "Cargando el catálogo empresarial…"}</p>
        {error && (
          <button className="button" onClick={() => void load()}>
            Reintentar
          </button>
        )}
      </main>
    );

  return (
    <div className="shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setSection("overview");
          }}
        >
          <span className="brand-mark">
            <Compass size={25} />
          </span>
          <span>
            Enterprise<span className="brand-sub">ARCHITECTURE HUB</span>
          </span>
        </a>
        <div className="workspace-label">ESPACIO DE ARQUITECTURA</div>
        <div className="workspace-name">
          <span className="company-icon">M</span>
          <div>
            Meridian Commerce<small>Escenario de demostración</small>
          </div>
        </div>
        <div className="nav-label">PLANIFICACIÓN EMPRESARIAL</div>
        <nav>
          {sections.map((s) => (
            <button
              className={section === s.id ? "active" : ""}
              key={s.id}
              onClick={() => {
                setSection(s.id);
                setNotice("");
              }}
            >
              <s.icon size={18} />
              {s.name}
              {s.id === "validation" && issues.length > 0 && (
                <span className="count">{issues.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="system-status">
            <span />
            Catálogo conectado
          </div>
          <p>
            Estrategia que se convierte
            <br />
            en decisiones verificables.
          </p>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            Workspace <ChevronRight size={14} />{" "}
            {sections.find((s) => s.id === section)?.name}
          </span>
          <div>
            <button className="edit-access" aria-label="Configurar clave de edición" title="Configurar clave de edición" onClick={() => setShowKey(true)}>
              <ShieldCheck size={16} />
              <span>{token ? "Edición habilitada" : "Clave de edición"}</span>
            </button>
            <span className="demo-tag">DATOS FICTICIOS</span>
            <span className="avatar">EA</span>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                ESTRATEGIA · CAPACIDADES · TECNOLOGÍA
              </div>
              <h1>{sections.find((s) => s.id === section)?.name}</h1>
              <p>
                Conecta la intención del negocio con una arquitectura que puedas
                defender.
              </p>
            </div>
            <a className="button" href="/api/export/capabilities.csv">
              <ArrowDownToLine size={16} />
              Exportar capacidades
            </a>
          </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
              <button aria-label="Cerrar error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              <Check size={17} />
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {section === "overview" && (
            <>
              <div className="hero">
                <div>
                  <span className="hero-tag">
                    <span />
                    PORTAFOLIO ESTRATÉGICO
                  </span>
                  <h2>
                    Una visión compartida.
                    <br />
                    Decisiones con evidencia.
                  </h2>
                  <p>
                    De los objetivos empresariales a la inversión tecnológica,
                    <br />
                    con capacidades como punto de conexión.
                  </p>
                  <button onClick={() => setSection("priorities")}>
                    Explorar prioridades <ArrowRight size={17} />
                  </button>
                </div>
                <div className="hero-art">
                  {["Estrategia", "Capacidades", "Tecnología"].map((l, i) => (
                    <div className={`architecture-layer layer-${i}`} key={l}>
                      <span>0{i + 1}</span>
                      {l}
                      <Layers3 size={22} />
                    </div>
                  ))}
                  <span className="art-caption">
                    TRAZABILIDAD DE EXTREMO A EXTREMO
                  </span>
                </div>
              </div>
              <div className="stats">
                {[
                  {
                    label: "Objetivos estratégicos",
                    value: workspace.goals.length,
                    caption: "Anclaje del portafolio",
                    icon: Target,
                  },
                  {
                    label: "Capacidades de negocio",
                    value: caps.length,
                    caption: "Modelo de cinco niveles",
                    icon: Layers3,
                  },
                  {
                    label: "Madurez promedio",
                    value: `${avg.toFixed(2)} / 5`,
                    caption: "Personas, procesos, datos y tecnología",
                    icon: Activity,
                  },
                  {
                    label: "Inversión propuesta",
                    value: money(portfolio?.allocated || 0),
                    caption: `Escenario de ${money(budget)}`,
                    icon: Wallet,
                  },
                ].map((s) => (
                  <div className="stat" key={s.label}>
                    <div>
                      {s.label}
                      <s.icon size={19} />
                    </div>
                    <strong>{s.value}</strong>
                    <small>{s.caption}</small>
                  </div>
                ))}
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Impacto × oportunidad</h2>
                      <p>
                        Una lectura ejecutiva de las apuestas del portafolio
                      </p>
                    </div>
                    <span className="badge green">
                      {portfolio?.strategicBets || 0} apuestas
                    </span>
                  </div>
                  <Matrix />
                </section>
                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <h2>Objetivos del negocio</h2>
                      <p>Resultados que orientan la arquitectura</p>
                    </div>
                    <Target size={20} />
                  </div>
                  <div className="goal-list">
                    {workspace.goals.map((g, i) => (
                      <div key={g.id}>
                        <span className="goal-number">0{i + 1}</span>
                        <div>
                          <h3>{String(g.name)}</h3>
                          <p>{String(g.metric)}</p>
                          <span className="goal-meta">
                            Meta: {String(g.target)} ·{" "}
                            {
                              workspace.alignments.filter(
                                (a) => a.goalId === g.id,
                              ).length
                            }{" "}
                            capacidades
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setSection("goals")}
                  >
                    Ver alineación estratégica <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h2>Capacidades prioritarias</h2>
                    <p>
                      Inversión ordenada por impacto, brecha de madurez y
                      viabilidad
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setSection("priorities")}
                  >
                    Ver simulación <ArrowRight size={16} />
                  </button>
                </div>
                <PriorityTable />
              </section>
            </>
          )}
          {section === "goals" && (
            <>
              <div className="toolbar">
                {add("goals", "Nuevo objetivo")}
                {add("alignments", "Vincular capacidad")}
              </div>
              <div className="card-grid">
                {workspace.goals.map((g) => (
                  <article className="panel goal-card" key={g.id}>
                    <div className="card-top">
                      <Target size={22} />
                      {actions("goals", g)}
                    </div>
                    <h2>{String(g.name)}</h2>
                    <p>{String(g.metric)}</p>
                    <div className="goal-target">
                      {String(g.target)}
                      <small>Meta objetivo</small>
                    </div>
                    <p className="hint">Responsable: {String(g.owner)}</p>
                    {workspace.alignments
                      .filter((a) => a.goalId === g.id)
                      .map((a) => (
                        <div className="alignment" key={a.id}>
                          <span>
                            {name("nodes", a.capabilityId)}
                            <small>Contribución: {String(a.weight)}</small>
                          </span>
                          {actions("alignments", a)}
                        </div>
                      ))}
                  </article>
                ))}
              </div>
            </>
          )}
          {section === "nodes" && (
            <section className="panel">
              <div className="toolbar">
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Buscar capacidades"
                    placeholder="Buscar nombre, responsable o dominio…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Filtrar nivel"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="">Todos los niveles</option>
                  {levels.map((l, i) => (
                    <option key={l} value={i + 1}>
                      {l}
                    </option>
                  ))}
                </select>
                {add("nodes", "Nueva capacidad")}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Capacidad / alcance</th>
                      <th>Nivel</th>
                      <th>Responsable</th>
                      <th>Equipo</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filterNodes(workspace.nodes, search, level).map((n) => (
                      <tr key={n.id}>
                        <td>
                          <strong>{String(n.name)}</strong>
                          <small>
                            {breadcrumb(n, workspace.nodes)
                              .slice(0, -1)
                              .join(" › ")}
                          </small>
                          <p className="definition">{String(n.definition)}</p>
                        </td>
                        <td>
                          <span className="badge">N{String(n.level)}</span>
                        </td>
                        <td>{String(n.owner)}</td>
                        <td>{teams.find((t) => t[0] === n.teamType)?.[1]}</td>
                        <td>{actions("nodes", n)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filterNodes(workspace.nodes, search, level).length === 0 && (
                  <p className="empty">No hay registros para este alcance.</p>
                )}
              </div>
              <div className="panel-footer">
                {filterNodes(workspace.nodes, search, level).length} registros ·
                Las capacidades describen resultados de negocio.
              </div>
            </section>
          )}
          {section === "assessments" && (
            <section className="panel">
              <div className="panel-title">
                <div>
                  <h2>Mapa de madurez</h2>
                  <p>
                    L1: inicial · L2: repetible · L3: definido · L4: medido ·
                    L5: optimizado
                  </p>
                </div>
                {add("assessments", "Nueva evaluación")}
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Capacidad / evidencia</th>
                      <th>Personas</th>
                      <th>Proceso</th>
                      <th>Datos</th>
                      <th>Tecnología</th>
                      <th>Objetivo</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {caps.map((c) => {
                      const a = workspace.assessments.find(
                        (a) => a.capabilityId === c.id,
                      );
                      return (
                        <tr key={c.id}>
                          <td>
                            <strong>{String(c.name)}</strong>
                            <small>
                              {a
                                ? `${a.assessor} · ${new Date(String(a.assessedAt)).toLocaleDateString("es-EC")}`
                                : "Sin evaluación"}
                            </small>
                            {a && (
                              <details>
                                <summary>Ver evidencia</summary>
                                <p>{String(a.evidence)}</p>
                              </details>
                            )}
                          </td>
                          {["people", "process", "data", "technology"].map(
                            (k) => (
                              <td key={k}>
                                <span className={`heat heat-${a?.[k] || 0}`}>
                                  {a ? `L${a[k]}` : "—"}
                                </span>
                              </td>
                            ),
                          )}
                          <td>{a ? `L${a.target}` : "—"}</td>
                          <td>{a && actions("assessments", a)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {section === "priorities" && (
            <>
              <div className="scenario panel">
                <div>
                  <h2>Escenario de inversión</h2>
                  <p>
                    Asigna el presupuesto según prioridad. La selección es
                    orientativa y no optimiza dependencias.
                  </p>
                </div>
                <label>
                  Presupuesto USD
                  <input
                    aria-label="Presupuesto USD"
                    type="number"
                    min="0"
                    step="1000"
                    value={budget}
                    onChange={(e) =>
                      setBudget(Math.max(0, Number(e.target.value)))
                    }
                  />
                </label>
                <div>
                  <small>Asignado</small>
                  <strong>{money(portfolio?.allocated || 0)}</strong>
                </div>
                <div>
                  <small>Disponible</small>
                  <strong>{money(portfolio?.remaining || 0)}</strong>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-title">
                    <h2>Matriz de decisión</h2>
                    <CircleHelp size={18} />
                  </div>
                  <Matrix />
                </section>
                <section className="panel formula">
                  <h2>Decisiones explicables</h2>
                  <p>
                    <strong>Impacto</strong> = ingresos × 30% + costo × 25% +
                    riesgo × 25% + cliente × 20%.
                  </p>
                  <p>
                    <strong>Oportunidad</strong> = brecha de madurez / 4 ×
                    viabilidad.
                  </p>
                  <p>
                    <strong>Puntaje</strong> = impacto × oportunidad ×
                    contribución estratégica (máximo 1).
                  </p>
                  <p>
                    Las capacidades sin brecha o sin objetivo no reciben
                    inversión. Se recorre el ranking y se financia cada
                    estimación que cabe en el saldo.
                  </p>
                  <span className="badge green">
                    Motor Java · cálculo determinista
                  </span>
                </section>
              </div>
              <section className="panel">
                <div className="panel-title">
                  <h2>Ranking del portafolio</h2>
                </div>
                <PriorityTable />
              </section>
            </>
          )}
          {section === "traces" && (
            <>
              <div className="toolbar">
                <select
                  aria-label="Seleccionar capacidad"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {opts("nodes", true).map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
                {add("traces", "Nuevo vínculo")}
                {add("assets", "Nuevo activo")}
              </div>
              <section className="panel trace-focus">
                <span className="eyebrow">TRAZABILIDAD BIDIRECCIONAL</span>
                <h2>{name("nodes", selected)}</h2>
                <p>{String(find("nodes", selected)?.definition || "")}</p>
                <div className="trace-goals">
                  {workspace.alignments
                    .filter((a) => a.capabilityId === selected)
                    .map((a) => (
                      <span className="badge green" key={a.id}>
                        <Target size={14} />
                        {name("goals", a.goalId)}
                      </span>
                    ))}
                </div>
                <div className="trace-grid">
                  {[
                    ["process", "Procesos"],
                    ["data", "Datos"],
                    ["application", "Aplicaciones"],
                    ["technology", "Tecnología"],
                  ].map(([kind, label]) => (
                    <div className="trace-column" key={kind}>
                      <h3>{label}</h3>
                      {workspace.traces
                        .filter(
                          (t) =>
                            t.capabilityId === selected &&
                            find("assets", t.assetId)?.kind === kind,
                        )
                        .map((t) => (
                          <div className="trace-asset" key={t.id}>
                            <strong>{name("assets", t.assetId)}</strong>
                            <small>
                              {String(find("assets", t.assetId)?.state)}
                            </small>
                            <p>{String(t.rationale)}</p>
                            {actions("traces", t)}
                          </div>
                        ))}
                      {!workspace.traces.some(
                        (t) =>
                          t.capabilityId === selected &&
                          find("assets", t.assetId)?.kind === kind,
                      ) && <p className="hint">Sin vínculo en esta capa.</p>}
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>Catálogo de activos</h2>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Activo</th>
                        <th>Capa</th>
                        <th>Estado</th>
                        <th>Capacidades soportadas</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {workspace.assets.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong>{String(a.name)}</strong>
                            <small>{String(a.description)}</small>
                          </td>
                          <td>{String(a.kind)}</td>
                          <td>
                            <span className="badge">{String(a.state)}</span>
                          </td>
                          <td>
                            {workspace.traces
                              .filter((t) => t.assetId === a.id)
                              .map((t) => (
                                <button
                                  className="asset-cap"
                                  key={t.id}
                                  onClick={() =>
                                    setSelected(String(t.capabilityId))
                                  }
                                >
                                  {name("nodes", t.capabilityId)}
                                </button>
                              ))}
                          </td>
                          <td>{actions("assets", a)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {section === "initiatives" && (
            <>
              <div className="toolbar">
                {add("initiatives", "Nueva iniciativa")}
                <span className="hint">
                  Presupuesto estimado total:{" "}
                  {money(
                    workspace.initiatives.reduce(
                      (sum, i) => sum + Number(i.budget),
                      0,
                    ),
                  )}
                </span>
              </div>
              <div className="roadmap">
                {[
                  ...new Set(
                    workspace.initiatives.map((i) => String(i.quarter)),
                  ),
                ]
                  .sort()
                  .map((q) => (
                    <section key={q}>
                      <h2>
                        {q}
                        <span>
                          {
                            workspace.initiatives.filter((i) => i.quarter === q)
                              .length
                          }
                        </span>
                      </h2>
                      {workspace.initiatives
                        .filter((i) => i.quarter === q)
                        .map((i) => (
                          <article className="roadmap-card" key={i.id}>
                            <div className="card-top">
                              <span
                                className={`badge ${i.status === "completed" ? "green" : ""}`}
                              >
                                {String(i.status)}
                              </span>
                              {actions("initiatives", i)}
                            </div>
                            <h3>{String(i.name)}</h3>
                            <p>{name("nodes", i.capabilityId)}</p>
                            <strong>{money(Number(i.budget))}</strong>
                            <p className="hint">{String(i.owner)}</p>
                            <details>
                              <summary>Resultado y dependencias</summary>
                              <p>{String(i.outcome)}</p>
                              <p>
                                Depende de:{" "}
                                {String(i.dependencies)
                                  .split(",")
                                  .filter(Boolean)
                                  .map((id) => name("initiatives", id))
                                  .join(", ") || "Sin dependencias"}
                              </p>
                              <code>{i.id}</code>
                            </details>
                          </article>
                        ))}
                    </section>
                  ))}
              </div>
            </>
          )}
          {section === "decisions" && (
            <>
              <div className="toolbar">
                {add("decisions", "Nueva decisión")}
              </div>
              <div className="card-grid">
                {workspace.decisions.map((d) => (
                  <article className="panel decision-card" key={d.id}>
                    <div className="card-top">
                      <span className="badge green">{String(d.status)}</span>
                      {actions("decisions", d)}
                    </div>
                    <h2>{String(d.title)}</h2>
                    <p className="hint">{name("nodes", d.capabilityId)}</p>
                    {[
                      ["context", "Contexto"],
                      ["choice", "Decisión"],
                      ["tradeoffs", "Consecuencias y compromisos"],
                    ].map(([k, l]) => (
                      <div key={k}>
                        <h3>{l}</h3>
                        <p>{String(d[k])}</p>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </>
          )}
          {section === "validation" && (
            <>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h2>
                      <ListChecks size={21} /> Calidad del modelo
                    </h2>
                    <p>
                      Controles de anclaje, evidencia, nombres, recorridos y
                      trazabilidad
                    </p>
                  </div>
                  <span className={`badge ${issues.length ? "" : "green"}`}>
                    {issues.length} hallazgos
                  </span>
                </div>
                {issues.length === 0 ? (
                  <div className="quality-ok">
                    <ShieldCheck size={36} />
                    <h3>Modelo consistente</h3>
                    <p>
                      Todas las capacidades están ancladas, evaluadas y
                      trazadas.
                    </p>
                  </div>
                ) : (
                  issues.map((i, ix) => (
                    <div className="issue" key={`${i.entityId}-${ix}`}>
                      <span
                        className={`badge ${i.severity === "error" ? "red" : ""}`}
                      >
                        {i.severity}
                      </span>
                      <div>
                        <strong>{i.message}</strong>
                        <small>{i.rule}</small>
                      </div>
                      <button
                        className="text-button"
                        onClick={() =>
                          setSection(
                            i.rule === "evidence"
                              ? "assessments"
                              : i.rule === "technology-trace"
                                ? "traces"
                                : "goals",
                          )
                        }
                      >
                        Revisar <ArrowRight size={15} />
                      </button>
                    </div>
                  ))
                )}
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>Registro de cambios</h2>
                  <p>Últimos 100 eventos</p>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Acción</th>
                        <th>Entidad</th>
                        <th>Actor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workspace.audit.map((a) => (
                        <tr key={a.id}>
                          <td>
                            {new Date(String(a.at)).toLocaleString("es-EC")}
                          </td>
                          <td>{String(a.action)}</td>
                          <td>
                            <code>{String(a.entityId)}</code>
                          </td>
                          <td>{String(a.actor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          <footer>
            Enterprise Architecture Hub{" "}
            <span>Arquitectura guiada por capacidades · C# + Java + React</span>
          </footer>
        </div>
      </main>
      {showKey && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="key-title"
          >
            <button
              className="modal-close"
              aria-label="Cerrar"
              onClick={() => setShowKey(false)}
            >
              <X />
            </button>
            <h2 id="key-title">Clave de edición</h2>
            <p>
              Introduce el valor de EDITOR_TOKEN configurado en el entorno
              local. La clave permanece solo en memoria durante esta sesión.
            </p>
            <label>
              Clave
              <input
                aria-label="Clave de edición"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>
            <button
              className="button primary"
              onClick={() => setShowKey(false)}
            >
              Guardar clave en esta sesión
            </button>
          </section>
        </div>
      )}
      {editor && (
        <div className="modal-backdrop">
          <section
            className="modal wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <button
              className="modal-close"
              aria-label="Cerrar"
              onClick={() => setEditor(undefined)}
            >
              <X />
            </button>
            <h2 id="edit-title">
              {editor.item ? "Editar registro" : "Nuevo registro"}
            </h2>
            <p>Los cambios se validan antes de actualizar el catálogo.</p>
            {!token && (
              <div className="alert error">
                Configura la clave de edición para guardar.
              </div>
            )}
            {error && (
              <div className="alert error" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={save}>
              <div className="form-grid">
                {fields(editor.collection).map((f) => (
                  <label
                    key={f.key}
                    className={
                      [
                        "definition",
                        "evidence",
                        "outcome",
                        "context",
                        "choice",
                        "tradeoffs",
                      ].includes(f.key)
                        ? "full"
                        : ""
                    }
                  >
                    {f.label}
                    {f.options ? (
                      <select
                        value={String(draft[f.key] ?? "")}
                        required={!f.optional}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            [f.key]: e.target.value,
                            ...(f.key === "level" ? { parentId: "" } : {}),
                          }))
                        }
                      >
                        <option value="">
                          {f.optional
                            ? "Sin padre (solo estrategia)"
                            : "Seleccionar…"}
                        </option>
                        {f.options.map(([v, l]) => (
                          <option value={v} key={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : [
                        "definition",
                        "evidence",
                        "outcome",
                        "context",
                        "choice",
                        "tradeoffs",
                        "rationale",
                      ].includes(f.key) ? (
                      <textarea
                        required={!f.optional}
                        maxLength={2000}
                        rows={3}
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                        }
                      />
                    ) : (
                      <input
                        required={!f.optional}
                        type={f.type || "text"}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        maxLength={2000}
                        pattern={
                          f.key === "quarter" ? "20[0-9]{2}-Q[1-4]" : undefined
                        }
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => setEditor(undefined)}
                >
                  Cancelar
                </button>
                <button className="button primary" disabled={saving || !token}>
                  {saving ? "Guardando…" : "Guardar registro"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleteItem && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Eliminar registro</h2>
            <p>
              Se eliminará{" "}
              {String(
                deleteItem.item?.name ||
                  deleteItem.item?.title ||
                  deleteItem.item?.id,
              )}
              . Las entidades con referencias se protegen automáticamente.
            </p>
            {error && <div className="alert error">{error}</div>}
            <div className="modal-actions">
              <button
                className="button"
                onClick={() => setDeleteItem(undefined)}
              >
                Cancelar
              </button>
              <button
                className="button danger"
                disabled={saving || !token}
                onClick={() => void remove()}
              >
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
