"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    TrendingUp,
    Fish,
    DollarSign,
    Share2,
    Bell,
    Settings,
    BarChart3,
    AlertTriangle,
    LogOut,
    Activity,
} from "lucide-react";

const navSections = [
    {
        title: "Overview",
        links: [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        ],
    },
    {
        title: "Management",
        links: [
            { href: "/admin/users", label: "Users", icon: Users },
            { href: "/admin/catches", label: "Catches", icon: Fish },
            { href: "/admin/moderation", label: "Moderation", icon: AlertTriangle },
        ],
    },
    {
        title: "Metrics",
        links: [
            { href: "/admin/growth", label: "Growth", icon: TrendingUp },
            { href: "/admin/engagement", label: "Engagement", icon: Activity },
            { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
            { href: "/admin/referrals", label: "Referrals", icon: Share2 },
        ],
    },
    {
        title: "System",
        links: [
            { href: "/admin/notifications", label: "Notifications", icon: Bell },
            { href: "/admin/settings", label: "Settings", icon: Settings },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
                <Link href="/admin" className="admin-sidebar-logo">
                    <div className="admin-sidebar-logo-icon">🎣</div>
                    <span className="admin-sidebar-logo-text">Ulov</span>
                    <span className="admin-sidebar-logo-badge">Admin</span>
                </Link>
            </div>

            <nav className="admin-sidebar-nav">
                {navSections.map((section) => (
                    <div key={section.title} className="admin-sidebar-section">
                        <div className="admin-sidebar-section-title">{section.title}</div>
                        {section.links.map((link) => {
                            const isActive =
                                pathname === link.href ||
                                (link.href !== "/admin" && pathname.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`admin-sidebar-link ${isActive ? "active" : ""}`}
                                >
                                    <link.icon />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="admin-sidebar-footer">
                <Link href="/" className="admin-sidebar-link">
                    <LogOut />
                    Back to App
                </Link>
            </div>
        </aside>
    );
}

