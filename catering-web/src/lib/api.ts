import { NextResponse } from "next/server";

// Permissive CORS so the Expo client (incl. Expo Web) can call the API.
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function apiJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders });
}

// Handles CORS preflight requests.
export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
