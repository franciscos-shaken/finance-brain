"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY } from "./config";

export function criarClienteBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
