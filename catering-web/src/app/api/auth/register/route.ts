import { encrypt } from "@/lib/jwt";
import { registerUser } from "@/services/users";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  { name, email, password } -> { token, user }
export async function POST(req: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) {
    return apiError("Name must be at least 2 characters.", 400);
  }
  if (!EMAIL_RE.test(email)) {
    return apiError("Please enter a valid email.", 400);
  }
  if (password.length < 6) {
    return apiError("Password must be at least 6 characters.", 400);
  }

  const res = await registerUser(name, email, password);
  if ("error" in res) return apiError(res.error, res.status);

  const token = await encrypt(res.user.id);
  return apiJson({ token, user: res.user }, 201);
}
