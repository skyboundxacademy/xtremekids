
// This file is being removed to prevent routing conflicts.
// The new structure uses /academy/[category]/[targetClass]/[id]/page.tsx
import { redirect } from "next/navigation";

export default function RedirectPage() {
  redirect("/academy");
}
