import { route } from "@/server/http.ts";

export const GET = () => route(() => ({ ok: true }));
