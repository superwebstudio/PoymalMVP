import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { AdminSidebar } from "@/admin/components/AdminSidebar";
import { getCurrentUser } from "@/lib/get-current-user";
import "@/admin/admin.css";

export const metadata: Metadata = {
  title: "Poymal Admin Dashboard",
  description: "Admin dashboard for Poymal fishing app",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt the entire /admin tree out of static prerender (uses cookies + DB).
  await connection();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (!user.isAdmin) {
    notFound();
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
