import fs from "fs/promises";
import path from "path";
import type { Desk } from "./types";

const DESKS_DIR = path.join(process.cwd(), "data", "desks");

async function readDeskFile(id: string): Promise<Desk | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  try {
    const raw = await fs.readFile(path.join(DESKS_DIR, `${id}.json`), "utf-8");
    return JSON.parse(raw) as Desk;
  } catch {
    return null;
  }
}

export async function listDesks(): Promise<Desk[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(DESKS_DIR);
  } catch {
    return [];
  }

  const ids = entries
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""));

  const desks = await Promise.all(ids.map(readDeskFile));
  return desks.filter((d): d is Desk => d !== null);
}

export async function getDesk(id: string): Promise<Desk | null> {
  return readDeskFile(id);
}
