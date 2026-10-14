import { fitGrid, spotlightLayout, type TileRect } from "../lib/call-layout";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowLeft,
  CheckCheck,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  Pin,
  Plus,
  Send,
  ShieldCheck,
  Signal,
  Smile,
  Users,
  Video,
  VideoOff,
  X,
  Grid2X2,
  Expand,
  Camera,
  ChevronLeft,
  ChevronRight,
  UserMinus,
} from "lucide-react";
import type { Chat, Message } from "../lib/chat-data";
import { Avatar } from "./chat-ui";
export type DemoCall = {
  name: string;
  video: boolean;
  state: "ringing" | "connected";
  seconds: number;
};
type Person = { id: string; name: string; photo?: string; muted?: boolean; self?: boolean };
export default function CallStage({
  call,
  chat,
  profileName,
  onAnswer,
  onEnd,
  onSend,
}: {
  call: DemoCall;
  chat?: Chat;
  profileName: string;
  onAnswer: () => void;
  onEnd: () => void;
  onSend: (value: string) => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const [panel, setPanel] = useState<"chat" | "people" | null>(null);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(call.video);
  const [sharing, setSharing] = useState(false);
  const [reactions, setReactions] = useState(false);
  const [more, setMore] = useState(false);
  const [layout, setLayout] = useState<"grid" | "focus">("grid");
  const [focus, setFocus] = useState("remote");
  const [draft, setDraft] = useState("");
  const [bursts, setBursts] = useState<{ id: number; emoji: string }[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [notice, setNotice] = useState("");
  const [localPreview, setLocalPreview] = useState(false);
  const [cameraPending, setCameraPending] = useState(false);
  const [people, setPeople] = useState<Person[]>(() =>
    chat?.group
      ? [
          { id: "remote", name: "Frank Martin", photo: "1" },
          { id: "alex", name: "Alexandra", photo: "2" },
          { id: "john", name: "John Hudson", photo: "3" },
          { id: "self", name: profileName, photo: "4", self: true },
        ]
      : [
          { id: "remote", name: call.name, photo: "1" },
          { id: "self", name: profileName, photo: "4", self: true },
        ],
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [page, setPage] = useState(0);
  useEffect(() => {
    const element = gridRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setGridSize((previous) =>
        Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const stage = useRef<HTMLDialogElement>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const connected = call.state === "connected";
  const timer = `${Math.floor(call.seconds / 60)
    .toString()
    .padStart(2, "0")}:${(call.seconds % 60).toString().padStart(2, "0")}`;
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => {
    if (localPreview && cameraRef.current) cameraRef.current.srcObject = stream.current;
  }, [localPreview, minimized, panel, layout, camera]);
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length, localMessages.length, panel]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3300);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMore(false);
        setReactions(false);
        setPanel(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  async function enableCamera() {
    if (localPreview) {
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setLocalPreview(false);
      return;
    }
    setCameraPending(true);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setLocalPreview(true);
      setCamera(true);
      setNotice("Caméra locale activée. Aucun flux n’est envoyé.");
    } catch {
      setNotice("Caméra non autorisée ou indisponible. La démonstration reste disponible.");
    } finally {
      setCameraPending(false);
      setMore(false);
    }
  }
  function toggleCamera() {
    setCamera((v) => {
      stream.current?.getVideoTracks().forEach((t) => (t.enabled = !v));
      return !v;
    });
  }
  function react(e: string) {
    setBursts((b) => [...b, { id: Date.now() + Math.random(), emoji: e }]);
    setReactions(false);
  }
  function submit() {
    if (!draft.trim()) return;
    if (chat) onSend(draft.trim());
    else
      setLocalMessages((ms) => [
        ...ms,
        {
          id: String(Date.now()),
          mine: true,
          text: draft.trim(),
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    setDraft("");
  }
  function addParticipant() {
    setPage(0);
    const n = people.length;
    if (n >= 32) {
      setNotice("Limite : 32 participants dans cette démo");
      return;
    }
    setPeople((ps) => [
      ...ps,
      {
        id: `demo-${Date.now()}-${Math.random()}`,
        name: `Invité ${n - 1}`,
        photo: String((n % 4) + 1),
      },
    ]);
    setNotice("Participant de démonstration ajouté");
  }
  async function browserFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice(
        "Le plein écran du navigateur n’est pas autorisé ici. Le mode immersif reste actif.",
      );
    }
    setMore(false);
  }
  const mobileGrid = gridSize.width < 560;
  const featured = !minimized && (sharing || layout === "focus");
  const gridCapacity = Math.max(
    1,
    Array.from({ length: 32 }, (_, i) => i + 1)
      .filter((n) =>
        fitGrid(n, gridSize.width, gridSize.height, mobileGrid ? 8 : 12).every(
          (r) => r.width >= (mobileGrid ? 115 : 170) && r.height >= (mobileGrid ? 72 : 106),
        ),
      )
      .pop() || 1,
  );
  const perPage = minimized
    ? 4
    : featured
      ? mobileGrid
        ? 3
        : 6
      : Math.min(mobileGrid ? 6 : 16, gridCapacity);
  useEffect(() => setPage(0), [perPage]);
  const pool = featured && !sharing ? people.filter((p) => p.id !== focus) : people;
  const pageCount = Math.max(1, Math.ceil(pool.length / perPage));
  const activePage = Math.min(page, pageCount - 1);
  const pagedPeople = pool.slice(activePage * perPage, (activePage + 1) * perPage);
  const featuredPerson = people.find((p) => p.id === focus) || people[0];
  const visiblePeople = featured && !sharing ? [featuredPerson, ...pagedPeople] : pagedPeople;
  const gap = minimized ? 6 : mobileGrid ? 8 : 12;
  const focusedLayout = spotlightLayout(gridSize.width, gridSize.height, pagedPeople.length, gap);
  const rectangles: TileRect[] = featured
    ? sharing
      ? focusedLayout.thumbnails
      : [focusedLayout.main, ...focusedLayout.thumbnails]
    : fitGrid(visiblePeople.length, gridSize.width, gridSize.height, gap);
  function tileStyle(rect?: TileRect) {
    return rect
      ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      : { left: 0, top: 0, width: 0, height: 0 };
  }
  function removePerson(id: string) {
    setPeople((ps) => ps.filter((p) => p.id !== id));
    if (focus === id) setFocus("remote");
  }
  const messages = chat?.messages.slice(-12) || localMessages;
  return (
    <MotionConfig reducedMotion="user">
      <motion.dialog
        open
        ref={stage}
        className={`call-stage ${minimized ? "is-minimized" : ""}`}
        aria-modal={!minimized}
        aria-label="Appel simulé"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="cs-header">
          <button
            className="cs-back"
            aria-label={minimized ? "Agrandir l’appel" : "Réduire l’appel"}
            onClick={() => setMinimized((v) => !v)}
          >
            {minimized ? <Maximize2 size={20} /> : <ArrowLeft size={21} />}
          </button>
          <span className="cs-call-icon">
            <Video size={22} />
          </span>
          <div className="cs-title">
            <h2>{call.name}</h2>
            <p>
              {people.length} participants <span>·</span>{" "}
              {call.video ? "Appel vidéo" : "Appel vocal"}
            </p>
          </div>
          <span className="cs-demo">
            <i /> Démonstration
          </span>
          <div className="cs-header-buttons">
            <button
              title="Participants"
              aria-label="Participants"
              onClick={() => setPanel((p) => (p === "people" ? null : "people"))}
            >
              <Users size={20} />
              <span>{people.length}</span>
            </button>
            <button
              title="Réduire l’appel"
              aria-label="Réduire l’appel"
              onClick={() => setMinimized(true)}
            >
              <Minimize2 size={20} />
            </button>
            <button
              title="Options d’affichage"
              aria-label="Options d’affichage"
              onClick={() => setMore((v) => !v)}
            >
              <MoreHorizontal size={23} />
            </button>
          </div>
        </header>
        <div className="cs-body">
          <section className="cs-workspace" aria-label="Participants vidéo">
            <div className="cs-stage-meta">
              <span className={`cs-status ${connected ? "connected" : ""}`}>
                <i />
                {connected ? "En appel" : "Appel en cours…"}
                <b>{connected ? timer : "En attente"}</b>
              </span>
              <div className="cs-layout">
                <button
                  aria-label="Vue grille"
                  className={layout === "grid" ? "selected" : ""}
                  onClick={() => {
                    setPage(0);
                    setLayout("grid");
                    setSharing(false);
                  }}
                >
                  <Grid2X2 size={16} />
                  Grille
                </button>
                <button
                  aria-label="Vue intervenant"
                  className={layout === "focus" ? "selected" : ""}
                  onClick={() => {
                    setPage(0);
                    setLayout("focus");
                  }}
                >
                  <Expand size={16} />
                  Focus
                </button>
              </div>
            </div>
            <div
              ref={gridRef}
              data-visible-count={visiblePeople.length}
              className={`cs-grid adaptive-grid ${layout === "focus" ? "focus-layout" : ""} ${people.length === 2 ? "duo" : ""} ${sharing ? "is-sharing" : ""}`}
            >
              {sharing && !minimized && (
                <motion.div
                  className="cs-shared-screen"
                  style={tileStyle(focusedLayout.main)}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="cs-share-top">
                    <MonitorUp size={17} /> Écran partagé · Simulation
                    <button onClick={() => setSharing(false)}>Arrêter</button>
                  </div>
                  <div className="cs-demo-desktop">
                    <span className="cs-desktop-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <div className="cs-desktop-sidebar">
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="cs-desktop-content">
                      <span>ESPACE DE TRAVAIL</span>
                      <h3>Un projet. Toute l’équipe.</h3>
                      <p>Exemple de partage d’écran</p>
                      <div className="cs-demo-chart">
                        {[30, 56, 42, 77, 58, 95, 82].map((h, i) => (
                          <motion.i
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.07 }}
                          />
                        ))}
                      </div>
                      <small>Aucun écran réel n’est capturé ou partagé.</small>
                    </div>
                  </div>
                </motion.div>
              )}
              {visiblePeople.map((p, i) => (
                <motion.article
                  layout
                  style={tileStyle(rectangles[i])}
                  data-person-id={p.id}
                  key={p.id}
                  className={`cs-person ${rectangles[i]?.height < 150 ? "compact-tile" : ""} ${layout === "focus" && p.id === focus ? "is-focused" : ""} ${!connected ? "is-ringing" : ""}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    layout: { duration: 0.25 },
                    opacity: { duration: 0.2 },
                    y: { duration: 0.2 },
                  }}
                >
                  {connected && call.video && (!p.self || camera) ? (
                    p.self && localPreview ? (
                      <video
                        ref={(element) => {
                          cameraRef.current = element;
                          if (element) element.srcObject = stream.current;
                        }}
                        autoPlay
                        muted
                        playsInline
                        aria-label="Aperçu de votre caméra locale"
                      />
                    ) : (
                      <img
                        className="cs-person-photo"
                        src={`/images/call-person-${p.photo}.webp`}
                        alt={`${p.name} — participant de démonstration`}
                      />
                    )
                  ) : (
                    <div className="cs-person-placeholder">
                      <div className="cs-avatar-rings">
                        <Avatar
                          chat={p.self ? { avatar: "profile" } : chat || { name: p.name }}
                          size={94}
                        />
                        {!connected && (
                          <>
                            <i />
                            <i />
                          </>
                        )}
                      </div>
                      <h3>{p.self ? "Vous" : p.name}</h3>
                      <p>
                        {!connected
                          ? p.self
                            ? "Prêt à rejoindre"
                            : "Sonnerie simulée…"
                          : call.video
                            ? "Caméra désactivée"
                            : "Appel vocal"}
                      </p>
                    </div>
                  )}
                  <div className="cs-tile-top">
                    <span>{p.self && localPreview ? "CAMÉRA LOCALE" : "IMAGE DÉMO"}</span>
                    <button
                      title="Mettre en avant"
                      aria-label={`Mettre en avant ${p.name}`}
                      onClick={() => {
                        setPage(0);
                        setFocus(p.id);
                        setLayout("focus");
                      }}
                    >
                      <Pin size={15} />
                    </button>
                  </div>
                  <div className="cs-person-bottom">
                    <span className="cs-name-tag">
                      {(p.self && !mic) || p.muted ? (
                        <MicOff size={13} />
                      ) : (
                        <span className={`cs-speaking ${connected ? "live" : ""}`}>
                          <i />
                          <i />
                          <i />
                        </span>
                      )}
                      {p.self ? "Vous" : p.name}
                    </span>
                    {connected && <Signal size={15} />}
                  </div>
                </motion.article>
              ))}
            </div>
            <div className="cs-grid-pagination">
              <span>
                {people.length} participants
                {pageCount > 1
                  ? ` · ${activePage * perPage + 1}–${Math.min((activePage + 1) * perPage, pool.length)} affichés`
                  : ""}
              </span>
              {pageCount > 1 && (
                <div>
                  <button
                    aria-label="Participants précédents"
                    disabled={activePage === 0}
                    onClick={() => setPage(activePage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <b>
                    {activePage + 1} / {pageCount}
                  </b>
                  <button
                    aria-label="Participants suivants"
                    disabled={activePage >= pageCount - 1}
                    onClick={() => setPage(activePage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
            {!connected && (
              <div className="cs-answer">
                <p>Vos participants sont prêts dans cette démonstration.</p>
                <button onClick={onAnswer}>
                  <Video size={17} />
                  Simuler une réponse
                </button>
              </div>
            )}
            <div className="cs-bottom">
              <div className="cs-toolbar">
                <Control
                  icon={MonitorUp}
                  label={sharing ? "Arrêter le partage" : "Partager l’écran"}
                  active={sharing}
                  onClick={() => {
                    setSharing((v) => !v);
                    setNotice("Partage d’écran de démonstration uniquement");
                  }}
                />
                <Control
                  icon={MessageSquare}
                  label="Conversation"
                  active={panel === "chat"}
                  onClick={() => setPanel((v) => (v === "chat" ? null : "chat"))}
                />
                <span className="cs-control-divider" />
                <Control
                  icon={mic ? Mic : MicOff}
                  label={mic ? "Micro" : "Micro coupé"}
                  active={!mic}
                  onClick={() => setMic((v) => !v)}
                />
                {call.video && (
                  <Control
                    icon={camera ? Video : VideoOff}
                    label={camera ? "Caméra" : "Caméra coupée"}
                    active={!camera}
                    onClick={toggleCamera}
                  />
                )}
                <div className="cs-reaction-control">
                  <Control
                    icon={Smile}
                    label="Réactions"
                    active={reactions}
                    onClick={() => setReactions((v) => !v)}
                  />
                  <AnimatePresence>
                    {reactions && (
                      <motion.div
                        className="cs-emoji-tray"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8 }}
                      >
                        {["👍", "❤️", "😂", "👏", "🎉", "😍"].map((e) => (
                          <button key={e} aria-label={`Réagir ${e}`} onClick={() => react(e)}>
                            {e}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Control
                  icon={MoreHorizontal}
                  label="Plus"
                  active={more}
                  onClick={() => setMore((v) => !v)}
                />
                <span className="cs-control-divider" />
                <Control icon={PhoneOff} label="Raccrocher" danger onClick={onEnd} />
              </div>
              <p className="cs-footer-note">
                <ShieldCheck size={12} />
                Démo locale · Aucun appel ni flux vidéo transmis
              </p>
            </div>
          </section>
          <AnimatePresence>
            {panel && !minimized && (
              <motion.aside
                className="cs-side-panel"
                initial={{ opacity: 0, x: 30, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 340 }}
                exit={{ opacity: 0, x: 30, width: 0 }}
                transition={{ duration: 0.23 }}
              >
                <header>
                  <h3>{panel === "chat" ? "Conversation de groupe" : "Participants"}</h3>
                  <button aria-label="Fermer le panneau d’appel" onClick={() => setPanel(null)}>
                    <X size={20} />
                  </button>
                </header>
                {panel === "chat" ? (
                  <>
                    <div className="cs-messages">
                      <span className="cs-chat-date">Aujourd’hui</span>
                      <div className="cs-chat-notice">
                        <ShieldCheck size={15} />
                        Vos messages restent dans ce navigateur.
                      </div>
                      {messages.length ? (
                        messages.map((m) => (
                          <div key={m.id} className={`cs-message ${m.mine ? "mine" : ""}`}>
                            <small>
                              {m.mine ? "Vous" : chat?.name || call.name}
                              <time>{m.time}</time>
                            </small>
                            <p>
                              {m.text || m.fileName || "Pièce jointe"}
                              {m.mine && <CheckCheck size={13} />}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="cs-empty-chat">
                          <MessageSquare size={32} />
                          <h4>La conversation continue ici</h4>
                          <p>Partagez un message sans quitter l’appel.</p>
                        </div>
                      )}
                      <div ref={messagesEnd} />
                    </div>
                    <form
                      className="cs-chat-compose"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                      }}
                    >
                      <input
                        aria-label="Message pendant l’appel"
                        placeholder="Écrivez un message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <button aria-label="Envoyer pendant l’appel" disabled={!draft.trim()}>
                        <Send size={19} />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="cs-people-list">
                    <p>{people.length} personnes dans la démonstration</p>
                    {people.map((p) => (
                      <div key={p.id}>
                        <img src={`/images/call-person-${p.photo}.webp`} alt="" />
                        <span>
                          <b>{p.self ? "Vous" : p.name}</b>
                          <small>{p.self ? "Votre aperçu" : "Participant simulé"}</small>
                        </span>
                        {p.muted ? <MicOff size={17} /> : <Mic size={17} />}
                        {!p.self && p.id.startsWith("demo-") && (
                          <button
                            aria-label={`Retirer ${p.name}`}
                            onClick={() => removePerson(p.id)}
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button className="cs-add-person" onClick={addParticipant}>
                      <Plus size={18} />
                      Ajouter un participant de démo
                    </button>
                  </div>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
        {minimized && (
          <button className="cs-restore" onClick={() => setMinimized(false)}>
            <Maximize2 size={15} /> Revenir à l’appel <span>{timer}</span>
          </button>
        )}
        <AnimatePresence>
          {more && (
            <motion.div
              className="cs-more-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <button
                onClick={() => {
                  setMinimized((v) => !v);
                  setMore(false);
                }}
              >
                <Minimize2 size={17} />
                {minimized ? "Agrandir" : "Réduire"} l’appel
              </button>
              <button onClick={browserFullscreen}>
                <Maximize2 size={17} />
                Plein écran du navigateur
              </button>
              <button disabled={cameraPending} onClick={enableCamera}>
                <Camera size={17} />
                {cameraPending
                  ? "Activation…"
                  : localPreview
                    ? "Arrêter ma caméra locale"
                    : "Essayer ma caméra locale"}
              </button>
              <button
                onClick={() => {
                  setPanel("people");
                  setMore(false);
                }}
              >
                <Users size={17} />
                Gérer les participants
              </button>
              <small>Caméra locale optionnelle, sans transmission.</small>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="cs-burst-layer" aria-live="polite">
          {bursts.map((b) => (
            <motion.span
              key={b.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -360, scale: [0.5, 1.4, 1] }}
              transition={{ duration: 2.4 }}
              onAnimationComplete={() => setBursts((bs) => bs.filter((x) => x.id !== b.id))}
            >
              {b.emoji}
            </motion.span>
          ))}
        </div>
        <AnimatePresence>
          {notice && (
            <motion.div
              className="cs-notice"
              role="note"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.dialog>
    </MotionConfig>
  );
}
function Control({
  icon: Icon,
  label,
  onClick,
  active = false,
  danger = false,
}: {
  icon: typeof Mic;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className={`cs-control ${active ? "active" : ""} ${danger ? "end-call" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <span>
        <Icon size={23} />
      </span>
      <small>{label}</small>
    </motion.button>
  );
}
