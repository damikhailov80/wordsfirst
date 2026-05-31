import { NextResponse } from "next/server";
import { getStoryRepository } from "@/lib/stories";

export async function GET() {
  const stories = await getStoryRepository().listStories();
  return NextResponse.json(stories);
}
