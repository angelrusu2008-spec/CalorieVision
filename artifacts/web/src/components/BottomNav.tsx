import { Home, Camera, Clock } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useColors } from "../hooks/useColors";

export function BottomNav() {
  const colors = useColors();
  const [location] = useLocation();

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const tabs = [
    { href: "/", label: "Hoy", Icon: Home },
    { href: "/scan", label: "Escanear", Icon: Camera },
    { href: "/history", label: "Historial", Icon: Clock },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: colors.card,
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 100,
      }}
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = href === "/" ? location === "/" || location === "" : location.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 10,
              gap: 4,
              textDecoration: "none",
              color: active ? colors.primary : colors.mutedForeground,
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
