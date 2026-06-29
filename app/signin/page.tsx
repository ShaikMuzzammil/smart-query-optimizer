import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignInClient from "@/app/(auth)/signin/SignInClient";

export default async function SignInRedirectPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return <SignInClient />;
}
