const c = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "sck",
    "src",
    "fbclid",
    "gclid",
    "ttclid",
    "utm_id",
    "xcod",
],
    a = "stalkea_utm_params";
function u() {
    if (typeof window > "u") return {};
    const t = new URLSearchParams(window.location.search),
        r = {};
    t.forEach((val, key) => {
        if (val) r[key] = val;
    });
    c.forEach((k) => {
        if (!r[k]) {
            try {
                const val = localStorage.getItem(k);
                if (val && val !== "null") r[k] = val;
            } catch (e) {}
        }
    });
    return r;
}
function f() {
    if (typeof window > "u") return {};
    try {
        const t = localStorage.getItem(a);
        return t ? JSON.parse(t) : {};
    } catch {
        return {};
    }
}
function m(t) {
    if (!(typeof window > "u"))
        try {
            const e = { ...f(), ...t };
            localStorage.setItem(a, JSON.stringify(e));
            Object.keys(t).forEach((k) => {
                if (t[k]) {
                    localStorage.setItem(k, t[k]);
                    const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                    localStorage.setItem(k + "_exp", exp);
                }
            });
        } catch { }
}
function g() {
    const t = u(),
        e = { ...f() };
    Object.keys(t).forEach((k) => {
        if (t[k]) e[k] = t[k];
    });
    Object.keys(t).length > 0 && m(e);
    return e;
}
function d(t, r) {
    const e = g(),
        n = new URLSearchParams();
    if (e && typeof e === "object") {
        Object.entries(e).forEach(([o, s]) => {
            if (s && s !== "null" && s !== "undefined") n.set(o, s);
        });
    }
    if (r && typeof r === "object") {
        Object.entries(r).forEach(([o, s]) => {
            if (s && s !== "null" && s !== "undefined") n.set(o, s);
        });
    }
    const i = n.toString();
    return i ? `${t}?${i}` : t;
}
function h() {
    const t = u();
    Object.keys(t).length > 0 && m(t);
}
export { d as b, g, h as i };
