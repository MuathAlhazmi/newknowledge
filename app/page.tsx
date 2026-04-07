import { redirect } from "next/navigation";
import { getCurrentUser, resolvePostLoginPath } from "@/lib/auth";
import { LandingHome } from "@/components/landing-home";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect(await resolvePostLoginPath(user));
  }

  return <LandingHome />;
}
