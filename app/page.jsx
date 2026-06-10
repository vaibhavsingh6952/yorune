import React, {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Star,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from "lucide-react";

const DAYS_ORDER = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
];
const DAY_LABELS = {
    monday: "MON",
    tuesday: "TUE",
    wednesday: "WED",
    thursday: "THU",
    friday: "FRI",
    saturday: "SAT",
    sunday: "SUN",
};
const JS_DAY = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

export default function AnimeSchedulePage() {
    const [mode, setMode] = useState("anime");
    const [animeData, setAnimeData] = useState({});
    const [isAnimeLoading, setIsAnimeLoading] = useState(false);
    const [selectedShow, setSelectedShow] = useState(null);

    const accentColor = mode === "anime" ? "#ec4899" : "#f59e0b";
    const todayDay = JS_DAY[new Date().getDay()];
    const isMobile = typeof window !== "undefined" && window.innerWidth < 480;

    // ── Donghua fetch ────────────────────────────────────────────
    const { data: donghuaRaw, isFetching: isDonghuaFetching, isLoading: isDonghuaLoading, error: donghuaError } = useQuery({
        queryKey: ["donghua"],
        queryFn: async () => {
            const query = `query {
      Page(page:1, perPage:100) {
        media(type:ANIME, status:RELEASING, countryOfOrigin:"CN", sort:POPULARITY_DESC) {
          id title { english romaji } coverImage { medium }
          episodes averageScore siteUrl
          nextAiringEpisode { airingAt episode }
        }
      }
    }`;
            const res = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            if (!res.ok) throw new Error("AniList fetch failed");
            const json = await res.json();
            return json.data.Page.media;
        },
        staleTime: 1000 * 60 * 5,
    });
    console.log({ isDonghuaLoading, isDonghuaFetching, donghuaRaw, donghuaError });

    // ── Anime staggered fetch ────────────────────────────────────
    useEffect(() => {
        if (mode !== "anime") {
            setAnimeData({});
            return;
        }
        let cancelled = false;
        const run = async () => {
            setIsAnimeLoading(true);
            setAnimeData({});

            // fetch all days in parallel with a small stagger
            await Promise.all(
                DAYS_ORDER.map(async (day, i) => {
                    await new Promise((r) => setTimeout(r, i * 150)); // 150ms stagger instead of 450ms sequential
                    if (cancelled) return;
                    try {
                        const res = await fetch(
                            `https://api.jikan.moe/v4/schedules?filter=${day}&limit=25`,
                        );
                        if (res.ok && !cancelled) {
                            const json = await res.json();
                            setAnimeData((prev) => ({
                                ...prev,
                                [day]: json.data.map((item) => ({
                                    id: item.mal_id,
                                    title: item.title,
                                    image: item.images.jpg.image_url,
                                    score: item.score,
                                    episodes: item.episodes,
                                    url: item.url,
                                    type: "anime",
                                })),
                            }));
                        }
                    } catch (e) {
                        console.error(`Error fetching ${day}:`, e);
                        if (!cancelled) setAnimeData((prev) => ({ ...prev, [day]: [] }));
                    }
                })
            );
            if (!cancelled) setIsAnimeLoading(false);
        };
        run();
        return () => {
            cancelled = true;
            setIsAnimeLoading(false);
        };
    }, [mode]);
    
    // ── Process donghua into day buckets ────────────────────────
    const donghuaData = useMemo(() => {
        if (!donghuaRaw) return {};
        const schedule = Object.fromEntries(DAYS_ORDER.map((d) => [d, []]));
        const unscheduled = [];
        donghuaRaw.forEach((item) => {
            const show = {
                id: item.id,
                title: item.title.english || item.title.romaji,
                romaji: item.title.romaji,
                image: item.coverImage.medium,
                score: item.averageScore ? (item.averageScore / 10).toFixed(1) : null,
                nextEpisode: item.nextAiringEpisode?.episode,
                url: item.siteUrl,
                type: "donghua",
            };
            if (item.nextAiringEpisode?.airingAt) {
                schedule[
                    JS_DAY[new Date(item.nextAiringEpisode.airingAt * 1000).getDay()]
                ].push(show);
            } else {
                unscheduled.push(show);
            }
        });
        unscheduled.forEach((item) => {
            const least = DAYS_ORDER.reduce((a, b) =>
                schedule[a].length <= schedule[b].length ? a : b,
            );
            schedule[least].push(item);
        });
        return schedule;
    }, [donghuaRaw]);
    const currentData = mode === "anime" ? animeData : donghuaData;

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#0a0a0a",
                color: "#fff",
                fontFamily: "'Inter', system-ui, sans-serif",
            }}
        >
            <style>{`
        :root { --accent: ${accentColor}; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .no-scroll::-webkit-scrollbar { display: none; }
        .no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse { 0%,100%{opacity:.45} 50%{opacity:.15} }
        .skeleton { animation: pulse 1.8s ease-in-out infinite; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        .modal-in { animation: fadeIn .22s ease-out both; }
        .card { cursor: pointer; transition: transform .18s ease; }
        .card:hover { transform: translateY(-4px); }
        .card:hover .card-img { box-shadow: 0 0 0 2px var(--accent); }
        .card-img { transition: box-shadow .18s ease; border-radius: 8px; overflow: hidden; }
        .watch-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none; transition: opacity .15s, transform .15s; }
        .watch-btn:hover { opacity: .85; transform: translateY(-1px); }
        .toggle-btn { padding: 5px 10px; border-radius: 8px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s; }
        .read-more-btn { background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; }
        .close-btn { background: rgba(255,255,255,.1); border: none; color: #fff; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .close-btn:hover { background: rgba(255,255,255,.2); }
        .genre-pill { padding: 3px 10px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 20px; font-size: 11px; color: #9ca3af; }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
        .scroll-arrow { position: absolute; right: 0; top: 0; bottom: 0; width: 56px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; background: linear-gradient(to right, transparent, rgba(10,10,10,.92) 55%); pointer-events: none; transition: opacity .18s ease; }
        .scroll-arrow-btn { pointer-events: all; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,.12); background: rgba(20,20,20,.85); backdrop-filter: blur(6px); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s, border-color .15s, transform .15s; flex-shrink: 0; }
        .scroll-arrow-btn:hover { transform: scale(1.12); }
      `}</style>

            {/* ── Fixed Header ── */}
            <header
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 58,
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    backgroundColor: "rgba(10,10,10,.88)",
                    backdropFilter: "blur(14px)",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                }}
            >
                <h1 style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.4px" }}>
                    <span style={{ color: accentColor }}>YORUNE</span>.SPACE
                </h1>
                <div
                    style={{
                        display: "flex",
                        gap: 5,
                        padding: 4,
                        background: "rgba(255,255,255,.05)",
                        borderRadius: 10,
                    }}
                >
                    <button
                        className="toggle-btn"
                        onClick={() => setMode("anime")}
                        style={{
                            background: mode === "anime" ? "#ec4899" : "transparent",
                            color: mode === "anime" ? "#fff" : "rgba(255,255,255,.5)",
                        }}
                    >
                        Anime
                    </button>
                    <button
                        className="toggle-btn"
                        onClick={() => setMode("donghua")}
                        style={{
                            background: mode === "donghua" ? "#f59e0b" : "transparent",
                            color: mode === "donghua" ? "#fff" : "rgba(255,255,255,.5)",
                        }}
                    >
                        Donghua
                    </button>
                </div>
            </header>

            {/* ── Schedule ── */}
            <main style={{ paddingTop: 58 }}>
                {DAYS_ORDER.map((day) => {
                    const shows = currentData[day];
                    const isToday = todayDay === day;
                    const loading = mode === "anime"
                        ? !(day in currentData)
                        : isDonghuaLoading || isDonghuaFetching || !donghuaRaw;
                    const empty = !loading && shows != null && shows.length === 0;
                    return (
                        <DayRow
                            key={day}
                            day={day}
                            shows={shows}
                            isToday={isToday}
                            loading={loading}
                            empty={empty}
                            accentColor={accentColor}
                            onOpenShow={setSelectedShow}
                            mode={mode}
                            isMobile={isMobile}
                        />
                    );
                })}
            </main>

            {/* ── Modal ── */}
            {selectedShow && (
                <ShowModal
                    show={selectedShow}
                    mode={mode}
                    accentColor={accentColor}
                    onClose={() => setSelectedShow(null)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
function ShowCard({ show, accentColor, onOpen, isMobile }) {
    const ep =
        show.type === "donghua"
            ? show.nextEpisode
                ? `ep ${show.nextEpisode} next`
                : "RELEASING"
            : `${show.episodes || "?"} EPS`;

    return (
        <div
            className="card"
            onClick={onOpen}
            style={{ flexShrink: 0, width: isMobile ? 85 : 115 }}
        >
            <div
                className="card-img"
                style={{
                    position: "relative",
                    height: isMobile ? 80 : 110,
                    background: "rgba(255,255,255,.05)",
                    marginBottom: 7,
                    boxShadow: "0 0 0 1px rgba(255,255,255,.08)",
                }}
            >
                <img
                    src={show.image}
                    alt={show.title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                    loading="eager"
                />
                {show.score && (
                    <div
                        style={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            padding: "2px 6px",
                            background: "rgba(0,0,0,.65)",
                            backdropFilter: "blur(4px)",
                            borderRadius: 5,
                            fontSize: 9,
                            fontWeight: 700,
                        }}
                    >
                        <Star size={9} fill="#fbbf24" color="#fbbf24" />
                        <span>{show.score}</span>
                    </div>
                )}
            </div>
            <p
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    marginBottom: 4,
                }}
            >
                {show.title}
            </p>
            <p
                style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: show.type === "donghua" ? accentColor : "#6b7280",
                }}
            >
                {ep}
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="skeleton" style={{ flexShrink: 0, width: 115 }}>
            <div
                style={{
                    height: 110,
                    borderRadius: 8,
                    background: "rgba(255,255,255,.06)",
                    marginBottom: 7,
                }}
            />
            <div
                style={{
                    height: 9,
                    width: "100%",
                    borderRadius: 4,
                    background: "rgba(255,255,255,.06)",
                    marginBottom: 5,
                }}
            />
            <div
                style={{
                    height: 9,
                    width: "60%",
                    borderRadius: 4,
                    background: "rgba(255,255,255,.06)",
                }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
function ShowModal({ show, mode, accentColor, onClose }) {
    const [info, setInfo] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [expanded, setExpanded] = useState(false);

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Fetch detail
    useEffect(() => {
        let alive = true;
        setFetching(true);
        setExpanded(false);
        const load = async () => {
            try {
                if (mode === "anime") {
                    const res = await fetch(
                        `https://api.jikan.moe/v4/anime/${show.id}/full`,
                    );
                    if (!res.ok) throw new Error("Jikan full fetch failed");
                    const json = await res.json();
                    const d = json.data;
                    if (alive)
                        setInfo({
                            title: d.title,
                            title: item.title_english || item.title, 
                            image: d.images?.jpg?.large_image_url || d.images?.jpg?.image_url,
                            score: d.score,
                            status: d.status,
                            synopsis:
                                d.synopsis?.replace(/\[Written by.*?\]/gi, "").trim() || "",
                            genres: d.genres?.map((g) => g.name) || [],
                            episodes: d.episodes,
                            season: d.season
                                ? `${d.season.charAt(0).toUpperCase() + d.season.slice(1)} ${d.year || ""}`.trim()
                                : null,
                            studio: d.studios?.[0]?.name || null,
                        });
                } else {
                    const query = `
            query($id:Int) {
              Media(id:$id, type:ANIME) {
                title { english romaji }
                coverImage { large }
                averageScore status description genres episodes
                season seasonYear startDate { year }
                studios(isMain:true) { nodes { name } }
              }
            }`;
                    const res = await fetch("https://graphql.anilist.co", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ query, variables: { id: show.id } }),
                    });
                    if (!res.ok) throw new Error("AniList modal fetch failed");
                    const json = await res.json();
                    const d = json.data.Media;
                    const synopsis =
                        d.description
                            ?.replace(/<[^>]*>/g, "")
                            .replace(/\n+/g, " ")
                            .trim() || "";
                    if (alive)
                        setInfo({
                            title: d.title.english || d.title.romaji,
                            titleSub: d.title.romaji,
                            image: d.coverImage?.large,
                            score: d.averageScore ? (d.averageScore / 10).toFixed(1) : null,
                            status: d.status,
                            synopsis,
                            genres: d.genres || [],
                            episodes: d.episodes,
                            season:
                                d.season && d.seasonYear
                                    ? `${d.season.charAt(0) + d.season.slice(1).toLowerCase()} ${d.seasonYear}`
                                    : d.startDate?.year || null,
                            studio: d.studios?.nodes?.[0]?.name || null,
                        });
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setFetching(false);
            }
        };
        load();
        return () => {
            alive = false;
        };
    }, [show.id, mode]);

    const synopsis = info?.synopsis || "";
    const LIMIT = 420;
    const needsExpand = synopsis.length > LIMIT;
    const displaySynopsis = expanded ? synopsis : synopsis.slice(0, LIMIT);

    const watchTitle = info?.title || show.title;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                backgroundColor: "rgba(0,0,0,.78)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
            }}
        >
            <div
                className="modal-in modal-scroll"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 680,
                    maxHeight: "92vh",
                    overflowY: "auto",
                    backgroundColor: "#141414",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,.09)",
                    boxShadow: "0 32px 96px rgba(0,0,0,.85)",
                }}
            >
                {/* Close */}
                <button
                    className="close-btn"
                    onClick={onClose}
                    style={{ position: "absolute", top: 14, right: 14, zIndex: 10 }}
                >
                    ×
                </button>

                {fetching ? (
                    <ModalSkeleton />
                ) : (
                    <>
                        {/* ── Header ── */}
                        <div style={{ display: "flex", gap: 20, padding: "24px 24px 0" }}>
                            <img
                                src={info?.image || show.image}
                                alt={info?.title}
                                style={{
                                    width: 120,
                                    minWidth: 120,
                                    height: 170,
                                    objectFit: "cover",
                                    borderRadius: 10,
                                    boxShadow: "0 8px 28px rgba(0,0,0,.6)",
                                    flexShrink: 0,
                                }}
                            />
                            <div style={{ flex: 1, paddingTop: 2 }}>
                                <h2
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 800,
                                        lineHeight: 1.35,
                                        marginBottom: 5,
                                        paddingRight: 36,
                                    }}
                                >
                                    {info?.title || show.title}
                                </h2>
                                {info?.titleSub && info.titleSub !== info.title && (
                                    <p
                                        style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}
                                    >
                                        {info.titleSub}
                                    </p>
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 7,
                                        flexWrap: "wrap",
                                        marginBottom: 12,
                                    }}
                                >
                                    {info?.score && (
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                padding: "3px 9px",
                                                background: "rgba(0,0,0,.45)",
                                                borderRadius: 7,
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            <Star size={11} fill="#fbbf24" color="#fbbf24" />{" "}
                                            {info.score}
                                        </span>
                                    )}
                                    {info?.status && (
                                        <span
                                            style={{
                                                padding: "3px 11px",
                                                background: `${accentColor}1a`,
                                                border: `1px solid ${accentColor}40`,
                                                borderRadius: 20,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: accentColor,
                                            }}
                                        >
                                            {info.status.charAt(0) +
                                                info.status.slice(1).toLowerCase().replace(/_/g, " ")}
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                                >
                                    {info?.episodes && (
                                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                            📺{" "}
                                            <strong style={{ color: "#d1d5db" }}>
                                                {info.episodes}
                                            </strong>{" "}
                                            episodes
                                        </span>
                                    )}
                                    {info?.season && (
                                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                            📅{" "}
                                            <strong style={{ color: "#d1d5db" }}>
                                                {info.season}
                                            </strong>
                                        </span>
                                    )}
                                    {info?.studio && (
                                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                            🎬{" "}
                                            <strong style={{ color: "#d1d5db" }}>
                                                {info.studio}
                                            </strong>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ padding: "20px 24px 24px" }}>
                            {/* Synopsis */}
                            {synopsis && (
                                <div style={{ marginBottom: 18 }}>
                                    <p
                                        style={{
                                            fontSize: 13,
                                            lineHeight: 1.75,
                                            color: "rgba(255,255,255,.78)",
                                        }}
                                    >
                                        {displaySynopsis}
                                        {needsExpand && !expanded && "…"}
                                    </p>
                                    {needsExpand && (
                                        <button
                                            className="read-more-btn"
                                            onClick={() => setExpanded((p) => !p)}
                                            style={{ color: accentColor }}
                                        >
                                            {expanded ? (
                                                <>
                                                    <ChevronUp size={13} /> Show less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown size={13} /> Read more
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Genres */}
                            {info?.genres?.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                        marginBottom: 22,
                                    }}
                                >
                                    {info.genres.map((g) => (
                                        <span key={g} className="genre-pill">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Where to watch */}
                            <div
                                style={{
                                    borderTop: "1px solid rgba(255,255,255,.07)",
                                    paddingTop: 18,
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: "#4b5563",
                                        textTransform: "uppercase",
                                        letterSpacing: 1.2,
                                        marginBottom: 12,
                                    }}
                                >
                                    Where to Watch
                                </p>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    {mode === "anime" ? (
                                        <a
                                            href={`https://www.crunchyroll.com/search?q=${encodeURIComponent(watchTitle)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="watch-btn"
                                            style={{
                                                background: "linear-gradient(135deg,#f47521,#e05a00)",
                                                color: "#fff",
                                            }}
                                        >
                                            <ExternalLink size={14} /> Watch on Crunchyroll
                                        </a>
                                    ) : (
                                        <>
                                            <a
                                                href={`https://www.bilibili.tv/search?keyword=${encodeURIComponent(watchTitle)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="watch-btn"
                                                style={{
                                                    background: "linear-gradient(135deg,#00b5e2,#0081a7)",
                                                    color: "#fff",
                                                }}
                                            >
                                                <ExternalLink size={14} /> Watch on Bilibili
                                            </a>
                                            <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(watchTitle + " episode 1")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="watch-btn"
                                                style={{
                                                    background: "linear-gradient(135deg,#ff4444,#cc0000)",
                                                    color: "#fff",
                                                }}
                                            >
                                                <ExternalLink size={14} /> Search on YouTube
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
function ModalSkeleton() {
    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 20, marginBottom: 22 }}>
                <div
                    className="skeleton"
                    style={{
                        width: 120,
                        height: 170,
                        borderRadius: 10,
                        background: "rgba(255,255,255,.07)",
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        flex: 1,
                        paddingTop: 4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    <div
                        className="skeleton"
                        style={{
                            height: 18,
                            width: "80%",
                            borderRadius: 6,
                            background: "rgba(255,255,255,.07)",
                        }}
                    />
                    <div
                        className="skeleton"
                        style={{
                            height: 12,
                            width: "55%",
                            borderRadius: 5,
                            background: "rgba(255,255,255,.07)",
                        }}
                    />
                    <div
                        className="skeleton"
                        style={{
                            height: 22,
                            width: 90,
                            borderRadius: 20,
                            background: "rgba(255,255,255,.07)",
                            marginTop: 4,
                        }}
                    />
                    <div
                        className="skeleton"
                        style={{
                            height: 12,
                            width: "40%",
                            borderRadius: 5,
                            background: "rgba(255,255,255,.07)",
                        }}
                    />
                    <div
                        className="skeleton"
                        style={{
                            height: 12,
                            width: "35%",
                            borderRadius: 5,
                            background: "rgba(255,255,255,.07)",
                        }}
                    />
                </div>
            </div>
            {[100, 90, 85, 70].map((w) => (
                <div
                    key={w}
                    className="skeleton"
                    style={{
                        height: 11,
                        width: `${w}%`,
                        borderRadius: 4,
                        background: "rgba(255,255,255,.07)",
                        marginBottom: 8,
                    }}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
function DayRow({
    day,
    shows,
    isToday,
    loading,
    empty,
    accentColor,
    onOpenShow,
    mode,
    isMobile,
}) {
    const scrollRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            ro.disconnect();
        };
    }, [checkScroll, shows, loading]);

    const scrollRight = useCallback((e) => {
        e.stopPropagation();
        scrollRef.current?.scrollBy({ left: 360, behavior: "smooth" });
    }, []);

    const showArrow = isHovered && canScrollRight;

    return (
        <div
            style={{
                display: "flex",
                minHeight: 192,
                borderBottom: "1px solid rgba(255,255,255,.055)",
                position: "relative",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Day label — sticky on the left within the row */}
            <div
                style={{
                    width: isMobile ? 44 : 70,
                    minWidth: isMobile ? 44 : 70,
                    position: "sticky",
                    left: 0,
                    zIndex: 5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0a0a0a",
                    borderRight: "1px solid rgba(255,255,255,.055)",
                    gap: 5,
                }}
            >
                {isToday && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: "18%",
                            bottom: "18%",
                            width: 3,
                            borderRadius: "0 3px 3px 0",
                            background: accentColor,
                        }}
                    />
                )}
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 1,
                        color: isToday ? accentColor : "#6b7280",
                    }}
                >
                    {DAY_LABELS[day]}
                </span>
                {shows != null && (
                    <span style={{ fontSize: 9, color: "#4b5563", fontWeight: 600 }}>
                        {shows.length}
                    </span>
                )}
                {isToday && (
                    <span
                        style={{
                            fontSize: 8,
                            background: accentColor,
                            color: "#fff",
                            padding: "2px 5px",
                            borderRadius: 4,
                            fontWeight: 800,
                            letterSpacing: 0.5,
                        }}
                    >
                        TODAY
                    </span>
                )}
            </div>

            {/* Horizontally scrollable cards */}
            <div
                ref={scrollRef}
                className="no-scroll"
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    overflowX: "auto",
                    gap: 12,
                    padding: "14px 16px",
                }}
            >
                {loading &&
                    Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                {!loading &&
                    shows &&
                    shows.map((show) => (
                        <ShowCard
                            key={show.id}
                            show={show}
                            accentColor={accentColor}
                            onOpen={() => onOpenShow(show)}
                            isMobile={isMobile}
                        />
                    ))}
                {empty && (
                    <span
                        style={{
                            color: "#4b5563",
                            fontSize: 13,
                            fontStyle: "italic",
                            flex: 1,
                            textAlign: "center",
                        }}
                    >
                        none this day
                    </span>
                )}
            </div>

            {/* Scroll-right arrow — only when hovered AND more content exists */}
            <div
                className="scroll-arrow"
                style={{ opacity: showArrow ? 1 : 0, zIndex: 6 }}
                aria-hidden={!showArrow}
            >
                <button
                    className="scroll-arrow-btn"
                    onClick={scrollRight}
                    style={{
                        borderColor: showArrow
                            ? `${accentColor}55`
                            : "rgba(255,255,255,.12)",
                    }}
                    tabIndex={showArrow ? 0 : -1}
                >
                    <ChevronRight size={16} color={showArrow ? accentColor : "#fff"} />
                </button>
            </div>
        </div>
    );
}
