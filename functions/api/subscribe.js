// POST /api/subscribe { email } -> ajoute le contact a l'audience Resend.
// La cle API vit dans les secrets Cloudflare Pages, jamais dans le navigateur.
const AUDIENCE_ID = "74ead97f-053a-445e-babf-010de81e2c7e";

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return json(500, { error: "config" });

  let email = "";
  let honeypot = "";
  const type = request.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) {
      const body = await request.json();
      email = body.email || "";
      honeypot = body.email_address_check || "";
    } else {
      const form = await request.formData();
      email = form.get("EMAIL") || form.get("email") || "";
      honeypot = form.get("email_address_check") || "";
    }
  } catch {
    return json(400, { error: "payload" });
  }

  // Piege a bots : un humain ne remplit jamais ce champ cache.
  if (honeypot) return json(200, { ok: true });

  email = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(400, { error: "email" });

  const res = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.log("resend error", res.status, detail);
    // Un e-mail deja present renvoie une erreur : cote visiteur c'est un succes.
    if (res.status === 409 || detail.includes("already exists")) return json(200, { ok: true });
    return json(502, { error: "upstream" });
  }

  return json(200, { ok: true });
}
