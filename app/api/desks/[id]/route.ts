import { NextResponse } from "next/server";
import { getDesk } from "@/lib/desks/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const desk = await getDesk(id);

  if (!desk) {
    return NextResponse.json({ error: "Desk not found" }, { status: 404 });
  }

  return NextResponse.json(desk);
}
