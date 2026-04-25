export const toCanonicalEmail = (value: string) => {
  const email = `${value || ""}`.trim().toLowerCase();
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (domain === "gmail.com") {
    const noPlus = local.split("+")[0];
    const noDots = noPlus.replace(/\./g, "");
    return `${noDots}@gmail.com`;
  }
  return email;
};

export const ADMIN_EMAILS = new Set([
  "rushanbindra@gmail.com",
  "rushianbindra@gmail.com",
].map(toCanonicalEmail));

export const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.has(toCanonicalEmail(email));
};
