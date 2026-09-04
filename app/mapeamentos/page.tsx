import { cookies } from "next/headers";
import { LoginView } from "@/components/LoginView";
import { MappingsApp } from "@/components/MappingsApp";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MappingsPage() {
  const store = await cookies();
  const authenticated = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return authenticated ? <MappingsApp /> : <LoginView />;
}
