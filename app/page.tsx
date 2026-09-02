import { cookies } from "next/headers";
import { LoginView } from "@/components/LoginView";
import { PrototypeApp } from "@/components/PrototypeApp";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await cookies();
  const authenticated = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return authenticated ? <PrototypeApp /> : <LoginView />;
}
