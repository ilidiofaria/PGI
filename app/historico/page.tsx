import { cookies } from "next/headers";
import { HistoryApp } from "@/components/HistoryApp";
import { LoginView } from "@/components/LoginView";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const store = await cookies();
  const authenticated = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return authenticated ? <HistoryApp /> : <LoginView />;
}
