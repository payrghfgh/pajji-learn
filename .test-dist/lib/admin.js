"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.ADMIN_EMAILS = exports.toCanonicalEmail = void 0;
const toCanonicalEmail = (value) => {
    const email = `${value || ""}`.trim().toLowerCase();
    const [local, domain] = email.split("@");
    if (!local || !domain)
        return email;
    if (domain === "gmail.com") {
        const noPlus = local.split("+")[0];
        const noDots = noPlus.replace(/\./g, "");
        return `${noDots}@gmail.com`;
    }
    return email;
};
exports.toCanonicalEmail = toCanonicalEmail;
exports.ADMIN_EMAILS = new Set([
    "rushanbindra@gmail.com",
    "rushianbindra@gmail.com",
].map(exports.toCanonicalEmail));
const isAdmin = (email) => {
    if (!email)
        return false;
    return exports.ADMIN_EMAILS.has((0, exports.toCanonicalEmail)(email));
};
exports.isAdmin = isAdmin;
