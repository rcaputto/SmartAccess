import { NextResponse } from "next/server"

export async function POST() {
  // Deprecated: this was a legacy "generate pending codes" workflow.
  // The canonical automation flow is:
  //   POST /api/cron/pre-checkin
  console.warn("[deprecated] /api/bookings/access-codes/process-pending called");

  return NextResponse.json(
    {
      deprecated: true,
      error: "This endpoint is deprecated. Use POST /api/cron/pre-checkin instead.",
      replacement: "/api/cron/pre-checkin",
    },
    { status: 410 }
  );
}