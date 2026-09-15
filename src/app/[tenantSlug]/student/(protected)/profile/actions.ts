"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutStudentAction(tenantSlug: string) {
  const cookieStore = await cookies();
  cookieStore.delete("bimbelsync_session");
  redirect(`/${tenantSlug}/login`);
}
