// app/lib/auth.ts

export type JWTPayload = {
  sub?: string | number
  email?: string
  nome?: string
  perfil?: string
  role?: string
  consultorioId?: string | number
  tenantId?: string | number
  clinicId?: string | number
  exp?: number
  [k: string]: any
}

// Fallback para ambientes SSR (Node) onde atob não existe
function safeAtob(b64: string): string {
  if (typeof atob !== "undefined") return atob(b64)
  return Buffer.from(b64, "base64").toString("utf-8")
}

/** Decodifica o JWT (retorna null se inválido) */
export function decodeJwt(token?: string | null): JWTPayload | null {
  if (!token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const json = safeAtob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Alias para compatibilidade caso você já tenha importado decodeJWT em algum lugar
export const decodeJWT = decodeJwt

/** Obtém o consultorioId do token (ou do localStorage como fallback) */
export function getConsultorioIdFromToken(token?: string | null): string | null {
  const tok =
    token ??
    (typeof window !== "undefined" ? localStorage.getItem("authToken") : null)

  const payload = decodeJwt(tok)
  const fromJwt =
    (payload?.consultorioId ??
      payload?.tenantId ??
      payload?.clinicId ??
      null) as string | number | null

  // fallback para localStorage
  const fromLs =
    typeof window !== "undefined" ? localStorage.getItem("consultorioId") : null

  const val = fromJwt ?? fromLs
  return val != null ? String(val) : null
}

/** Persiste o JWT e o consultorioId (se vier no token ou em `extra`) */
export function persistAuth(jwt: string, extra?: { consultorioId?: any }) {
  if (typeof window === "undefined") return
  localStorage.setItem("authToken", jwt)

  const fromJwt = getConsultorioIdFromToken(jwt)
  const cid = String(extra?.consultorioId ?? fromJwt ?? "")
  if (cid) localStorage.setItem("consultorioId", cid)
}

/** Limpa sessão local */
export function clearAuth() {
  if (typeof window === "undefined") return
  localStorage.removeItem("authToken")
  localStorage.removeItem("consultorioId")
}
