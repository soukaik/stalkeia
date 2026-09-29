const d = "/api/proxy";
const H = "/api/proxy/hikerapi.php";
function q() {
    try { return localStorage.getItem("api_primary_source") || "hikerapi" } catch { return "hikerapi" }
}
function V(o) {
    if (o !== "proxy" && o !== "hikerapi") return console.warn('Invalid API source, use "proxy" or "hikerapi"'), !1;
    try { return localStorage.setItem("api_primary_source", o), !0 } catch (e) { return console.error("Failed to set API source:", e), !1 }
}
async function W(o, e = {}) {
    const n = new URLSearchParams(e).toString(), r = `${H}?path=${encodeURIComponent(o)}${n ? `&${n}` : ""}`, t = await (await fetch(r, { method: "GET", headers: { "Content-Type": "application/json", "X-Site-Key": "f36ea0b8b6c2a6bbd745bc50e473bfc5b39d0c2a075a38e9" } })).json();
    if (t.error) throw new Error(t.error);
    return t;
}
function J(o) {
    if (!o || typeof o !== "string") return o;
    if (o.startsWith("/api/proxy/image-proxy.php?url=")) return o;
    if (o.includes("workers.dev")) {
        try {
            const parsed = new URL(o, typeof window !== "undefined" ? window.location.origin : "http://localhost");
            const u = parsed.searchParams.get("url");
            if (u) return `/api/proxy/image-proxy.php?url=${encodeURIComponent(u)}`;
        } catch {}
    }
    return o.includes("cdninstagram.com") || o.includes("fbcdn.net") ? `/api/proxy/image-proxy.php?url=${encodeURIComponent(o)}` : o;
}
function K(o) {
    return (o || []).map((e) => ({ ...e, profile_pic_url: J(e.profile_pic_url) || e.profile_pic_url }));
}
function Y(o, e) {
    const rawPic = o.hd_profile_pic_url_info?.url || o.profile_pic_url_hd || o.profile_pic_url || (o.hd_profile_pic_versions && o.hd_profile_pic_versions[0]?.url) || "";
    return {
        pk: o.pk || o.id || "",
        username: o.username || e,
        full_name: o.full_name || "",
        biography: o.biography || "",
        profile_pic_url: J(rawPic) || "/images/avatars/perfil-sem-foto.jpeg",
        is_private: o.is_private || !1,
        is_verified: o.is_verified || !1,
        is_business: o.is_business || !1,
        media_count: o.media_count || 0,
        follower_count: o.follower_count || 0,
        following_count: o.following_count || 0,
        pk_id: o.pk_id || o.pk || "",
    };
}
function R(o) {
    if (!o) return "/images/avatars/perfil-sem-foto.jpeg";
    if (o.startsWith("/") || o.startsWith("data:")) return o;
    if (o.includes("image-proxy.php")) return o;
    return J(o);
}
function z(o, e = 640) {
    if (!o || o.length === 0) return "";
    const n = o
        .filter((t) => t.width && t.width >= e)
        .sort((t, a) => (t.width || 0) - (a.width || 0));
    return n.length > 0
        ? n[0].url
        : [...o].sort((t, a) => (a.width || 0) - (t.width || 0))[0]?.url ||
        o[0]?.url ||
        "";
}
function M(o, e = 640) {
    if (!o) return "";
    if (o.startsWith("/") || o.startsWith("data:")) return o;
    let n = o,
        r = !1;
    if (o.includes("workers.dev") || o.includes("image-proxy.php"))
        try {
            const c = new URL(o, typeof window !== "undefined" ? window.location.origin : "http://localhost").searchParams.get("url");
            c && ((n = decodeURIComponent(c)), (r = !0));
        } catch {
            return o;
        }
    if (!n.includes("cdninstagram.com") && !n.includes("fbcdn.net")) return o;
    const a = `s${e}x${e}`;
    let s = !1;
    try {
        const i = n.match(/([?&])stp=([^&]+)/);
        if (i) {
            const l = i[2];
            if (/s\d+x\d+/.test(l)) {
                const u = l.replace(/s\d+x\d+/, a);
                ((n = n.replace(`stp=${l}`, `stp=${u}`)), (s = !0));
            }
        }
        !s &&
            /\/s\d+x\d+\//.test(n) &&
            ((n = n.replace(/\/s\d+x\d+\//, `/${a}/`)), (s = !0));
        return `/api/proxy/image-proxy.php?url=${encodeURIComponent(n)}`;
    } catch {
        return `/api/proxy/image-proxy.php?url=${encodeURIComponent(n)}`;
    }
}
async function f(o, e = {}, n = 3e4) {
    const r = new AbortController(),
        t = setTimeout(() => r.abort(), n);
    try {
        const a = await fetch(o, { ...e, signal: r.signal });
        return (clearTimeout(t), a);
    } catch (a) {
        throw (clearTimeout(t), a);
    }
}
async function b() {
    return "local_device_fingerprint";
}
async function w(o) {
    return "local_device_hash";
}
async function v() {
    return "127.0.0.1";
}
async function N() {
    return {
        city: "São Paulo",
        region: "SP",
        country: "Brasil",
        country_code: "BR",
        latitude: "-23.5505",
        longitude: "-46.6333",
        ip: "127.0.0.1",
        timezone: "America/Sao_Paulo",
        organization: "Local"
    };
}
async function D(o, e) {
    return "São Paulo";
}
async function G(o, e, n, r = 4) {
    return ["Campinas", "Santos", "Sorocaba", "São José dos Campos"];
}
async function k() {
    return { leadId: "local_lead_id", fingerprint: "local_device_fingerprint", ip: "127.0.0.1" };
}
async function C(o) {
    try {
        const e = o.replace(/^@+/, "").trim();
        if (!e) throw new Error("Invalid username");
        const n = q() === "hikerapi";
        let r, t, a;
        if (n) {
            try {
                a = await W("/v2/user/by/username", { username: e });
                if (!a.user) throw new Error("User not found");
                return Y(a.user, e);
            } catch (s) {
                console.warn("HikerAPI failed, falling back to proxy:", s);
                r = `${d}/instagram.php?tipo=perfil&username=${encodeURIComponent(e)}`;
                t = await f(r, { method: "GET", headers: { "Content-Type": "application/json" } });
                if (!t.ok) throw new Error(`HTTP ${t.status}`);
                a = await t.json();
                if (a.error) throw new Error(a.error);
            }
        } else {
            try {
                r = `${d}/instagram.php?tipo=perfil&username=${encodeURIComponent(e)}`;
                t = await f(r, { method: "GET", headers: { "Content-Type": "application/json" } }, 6e3);
                if (!t.ok) throw new Error(`HTTP ${t.status}`);
                a = await t.json();
                if (a.error) throw new Error(a.error);
            } catch (s) {
                console.warn("Proxy API failed, falling back to HikerAPI:", s);
                a = await W("/v2/user/by/username", { username: e });
                if (!a.user) throw new Error("User not found");
                return Y(a.user, e);
            }
        }
        return {
            pk: a.pk || a.user_id || "",
            username: a.username || e,
            full_name: a.full_name || "",
            biography: a.biography || "",
            profile_pic_url:
                J(a.hd_profile_pic_url_info?.url ||
                a.profile_pic_url ||
                a.profile_pic_url_hd ||
                (a.hd_profile_pic_versions && a.hd_profile_pic_versions[0]?.url)) ||
                "/images/avatars/perfil-sem-foto.jpeg",
            is_private: a.is_private || !1,
            is_verified: a.is_verified || !1,
            is_business: a.is_business || !1,
            media_count: a.media_count || 0,
            follower_count: a.follower_count || 0,
            following_count: a.following_count || 0,
        };
    } catch (e) {
        throw (console.error("Error fetching Instagram profile:", e), e);
    }
}
async function Z(o) {
    try {
        const e = o.pk || o.id || "";
        if (!e) return [];
        const n = await W("/g2/user/medias", { user_id: e, flat: "true" });
        return (n.response?.items || n.items || []).map((r) => ({
            ...r,
            user: r.user ? { ...r.user, profile_pic_url: J(r.user.profile_pic_url) || r.user.profile_pic_url } : r.user,
            owner: r.owner ? { ...r.owner, profile_pic_url: J(r.owner.profile_pic_url) || r.owner.profile_pic_url } : r.owner,
        }));
    } catch (e) {
        return console.warn("HikerAPI medias fetch failed:", e), [];
    }
}
async function T(o, e) {
    try {
        const n = o.replace(/^@+/, "").trim();
        if (!n) throw new Error("Invalid username");
        const a = q() === "hikerapi";
        let r, t;
        if (a) {
            try {
                const s = await W("/v2/user/by/username", { username: n });
                if (!s.user) throw new Error("User not found");
                const i = Y(s.user, n);
                let l = null;
                try {
                    console.log("Fetching HikerAPI following list for:", n);
                    const u = await W("/v2/user/following", { user_id: s.user.pk || s.user.id, page_id: "1" });
                    l = K(u.response?.users);
                    console.log("HikerAPI following list fetched:", l?.length || 0, "users");
                } catch (u) { console.warn("HikerAPI following fetch failed:", u) }
                let p = [];
                try {
                    p = await Z(s.user);
                    console.log("HikerAPI medias fetched:", p.length, "posts");
                } catch (u) { console.warn("HikerAPI medias fetch failed:", u) }
                return {
                    pk: i.pk,
                    username: i.username,
                    full_name: i.full_name,
                    biography: i.biography,
                    profile_pic_url: i.profile_pic_url,
                    is_private: i.is_private,
                    is_verified: i.is_verified,
                    is_business: i.is_business,
                    media_count: i.media_count,
                    follower_count: i.follower_count,
                    following_count: i.following_count,
                    lista_perfis_publicos: l || [],
                    followers: l || [],
                    chaining_results: l || [],
                    posts: p,
                    followers_posts: p,
                    feed_posts: p,
                    error_count: 0,
                    results: [{ source: "hikerapi" }],
                };
            } catch (s) {
                console.warn("HikerAPI complete data failed, falling back to proxy:", s);
                r = `${d}/instagram.php?tipo=busca_completa&username=${encodeURIComponent(n)}`;
                r += `&is_private=${e ? "true" : "false"}`;
                t = await f(r, { method: "GET", headers: { "Content-Type": "application/json" } }, 6e4);
                if (!t.ok) throw new Error(`HTTP ${t.status}`);
                const i = await t.json();
                if (i.error) throw new Error(i.error);
                if (i.profile_pic_url) i.profile_pic_url = J(i.profile_pic_url);
                if (i.lista_perfis_publicos) i.lista_perfis_publicos = K(i.lista_perfis_publicos);
                if (i.followers) i.followers = K(i.followers);
                return i;
            }
        }
        try {
            r = `${d}/instagram.php?tipo=busca_completa&username=${encodeURIComponent(n)}`;
            r += `&is_private=${e ? "true" : "false"}`;
            t = await f(r, { method: "GET", headers: { "Content-Type": "application/json" } }, 15e3);
            if (!t.ok) throw new Error(`HTTP ${t.status}`);
            const s = await t.json();
            if (s.error) throw new Error(s.error);
            if (s.profile_pic_url) s.profile_pic_url = J(s.profile_pic_url);
            if (s.lista_perfis_publicos) s.lista_perfis_publicos = K(s.lista_perfis_publicos);
            if (s.followers) s.followers = K(s.followers);
            return s;
        } catch (s) {
            console.warn("Proxy complete data failed, falling back to HikerAPI:", s);
            const i = await W("/v2/user/by/username", { username: n });
            if (!i.user) throw new Error("User not found");
            const l = Y(i.user, n);
            let u = null;
            try {
                console.log("Fetching HikerAPI following list for:", n);
                const p = await W("/v2/user/following", { user_id: i.user.pk || i.user.id, page_id: "1" });
                u = K(p.response?.users);
                console.log("HikerAPI following list fetched:", u?.length || 0, "users");
            } catch (p) { console.warn("HikerAPI following fetch failed:", p) }
            let p = [];
            try {
                p = await Z(i.user);
                console.log("HikerAPI medias fetched:", p.length, "posts");
            } catch (g) { console.warn("HikerAPI medias fetch failed:", g) }
            return {
                pk: l.pk,
                username: l.username,
                full_name: l.full_name,
                biography: l.biography,
                profile_pic_url: l.profile_pic_url,
                is_private: l.is_private,
                is_verified: l.is_verified,
                is_business: l.is_business,
                media_count: l.media_count,
                follower_count: l.follower_count,
                following_count: l.following_count,
                lista_perfis_publicos: u || [],
                followers: u || [],
                chaining_results: u || [],
                posts: p,
                followers_posts: p,
                feed_posts: p,
                error_count: 0,
                results: [{ source: "hikerapi" }],
            };
        }
    } catch (n) {
        throw (console.error("Error fetching complete Instagram data:", n), n);
    }
}
async function B(o) {
    try {
        const e = o.replace(/^@+/, "").trim();
        if (!e) throw new Error("Invalid username");
        const n = q() === "hikerapi";
        let r, t;
        if (n) {
            try {
                const a = await W("/v2/user/by/username", { username: e });
                if (!a.user) throw new Error("User not found");
                const s = Y(a.user, e);
                let i = null;
                try {
                    const l = await W("/v2/user/following", { user_id: a.user.pk || a.user.id, page_id: "1" });
                    i = K(l.response?.users);
                } catch (l) { console.warn("HikerAPI following fetch failed:", l) }
                let l = [];
                try { l = await Z(a.user) } catch (u) { console.warn("HikerAPI medias fetch failed:", u) }
                return { success: !0, profile: s, lista_perfis_publicos: i || [], followers: i || [], chaining_results: i || [], posts: l, followers_posts: l, feed_posts: l, error_count: 0, source: "hikerapi" };
            } catch (a) {
                console.warn("HikerAPI all data failed, falling back to proxy:", a);
                r = `${d}/instagram.php?tipo=all&username=${encodeURIComponent(e)}`;
                t = await f(r, { method: "GET", headers: { "Content-Type": "application/json" } }, 13e4);
                if (!t.ok) throw new Error(`HTTP ${t.status}`);
                const s = await t.json();
                if (s.error && !s.success) throw new Error(s.error);
                return s;
            }
        }
        try {
            r = `${d}/instagram.php?tipo=all&username=${encodeURIComponent(e)}`;
            t = await f(r, { method: "GET", headers: { "Content-Type": "application/json" } }, 6e3);
            if (!t.ok) throw new Error(`HTTP ${t.status}`);
            const a = await t.json();
            if (a.error && !a.success) throw new Error(a.error);
            return a;
        } catch (a) {
            console.warn("Proxy all data failed, falling back to HikerAPI:", a);
            const s = await W("/v2/user/by/username", { username: e });
            if (!s.user) throw new Error("User not found");
            const i = Y(s.user, e);
            let l = null;
            try {
                const u = await W("/v2/user/following", { user_id: s.user.pk || s.user.id, page_id: "1" });
                l = K(u.response?.users);
            } catch (u) { console.warn("HikerAPI following fetch failed:", u) }
            let u = [];
            try { u = await Z(s.user) } catch (p) { console.warn("HikerAPI medias fetch failed:", p) }
            return { success: !0, profile: i, lista_perfis_publicos: l || [], followers: l || [], chaining_results: l || [], posts: u, followers_posts: u, feed_posts: u, error_count: 0, source: "hikerapi" };
        }
    } catch (e) {
        throw (console.error("Error fetching all Instagram data:", e), e);
    }
}
async function E(o) {
    return {
        success: !0,
        exists: !1,
        searchCount: 0,
        canSearch: !0,
        leadData: null,
    };
}
async function $(o, e) {
    return {
        success: !0,
        exists: !1,
        searchCount: 0,
        canSearch: !0,
        blockReason: null,
        gracePeriodExpired: !1,
        gracePeriodRemaining: 0,
        gracePeriodMinutes: 15,
        previousUsername: null,
        leadData: null,
    };
}
async function j(o, e, n, r) {
    return !0;
}
async function P() {
    return "local_lead_id";
}
function U() {
    return {
        leadId: localStorage.getItem("stalkea_lead_id"),
        fingerprint: localStorage.getItem("stalkea_fingerprint"),
        ip: localStorage.getItem("stalkea_ip"),
    };
}
function A() {
    (localStorage.removeItem("stalkea_lead_id"),
        localStorage.removeItem("stalkea_fingerprint"),
        localStorage.removeItem("stalkea_ip"),
        localStorage.removeItem("instagram_profile"),
        localStorage.removeItem("chaining_results_publicos"),
        localStorage.removeItem("chaining_results_privados"));
}
const L = {
    fetchProfile: C,
    fetchCompleteData: T,
    fetchAllData: B,
    checkLeadStatus: E,
    checkLeadStatusByIP: $,
    saveLeadSearch: j,
    getCurrentLeadId: P,
    generateLeadIdentifier: k,
    getClientIP: v,
    getStoredLeadData: U,
    clearStoredLeadData: A,
    setPrimaryApi: V,
};
typeof window < "u" && (window.InstagramAPI = L);
export {
    D as a,
    G as b,
    $ as c,
    v as d,
    k as e,
    C as f,
    N as g,
    T as h,
    M as i,
    z as j,
    R as k,
    B as l,
    j as s,
    V as m,
};
