import { encrypt } from "@/lib/jwt";
import { authenticateUser } from "@/services/users";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

// POST /api/auth/login  { email, password } -> { token, user }
export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return apiError("Email and password are required.", 400);
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    return apiError("Invalid email or password.", 401);
  }

  const token = await encrypt(user.id);
  return apiJson({ token, user });
}
