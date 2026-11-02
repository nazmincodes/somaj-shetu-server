import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks;

// BetterAuth (JWT plugin) publishes its public keys at /api/auth/jwks on the client app.
function getJwks() {
  if (!jwks) {
    const base = String(process.env.CLIENT_URL || "").replace(/\/$/, "");
    jwks = createRemoteJWKSet(new URL(`${base}/api/auth/jwks`));
  }
  return jwks;
}

export async function verifyJWT(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: access token is missing" });
  }

  try {
    const { payload } = await jwtVerify(token, getJwks());
    if (!payload.email) throw new Error("No email in token");
    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      name: payload.name || "",
      image: payload.image || "",
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
}
