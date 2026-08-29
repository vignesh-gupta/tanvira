import { NextResponse } from "next/server"

// Standard error envelope — see API_SPEC.md § Error Codes.
export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}
