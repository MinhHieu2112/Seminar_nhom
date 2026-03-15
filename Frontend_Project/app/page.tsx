import { redirect } from "next/navigation"

export default async function HomePage() {
  // Redirect to dashboard - in a real app, this would check auth status
  // and show a landing page for non-authenticated users
  redirect("/dashboard")
}
