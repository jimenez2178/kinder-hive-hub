import { useEffect, useState } from "react";
import {
  Home, Bell, Calendar, FileText, GraduationCap, Image, DollarSign,
  Cake, Heart, LogOut, ChevronLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Avisos", url: "/avisos", icon: Bell, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Calendario", url: "/calendario", icon: Calendar, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Comunicados", url: "/comunicados", icon: FileText, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Notas Maestros", url: "/notas", icon: GraduationCap, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Galería", url: "/galeria", icon: Image, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Pagos", url: "/pagos", icon: DollarSign, roles: ["directora"], badgeKey: "pagos" as const },
  { title: "Cumpleaños", url: "/cumpleanos", icon: Cake, roles: ["directora", "maestro"], badgeKey: null },
  { title: "Agradecimientos", url: "/agradecimientos", icon: Heart, roles: ["directora", "maestro"], badgeKey: null },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const [pendingPayments, setPendingPayments] = useState(0);

  const roleEmoji = user?.role === "directora" ? "👑" : "🧑‍🏫";
  const visibleItems = NAV_ITEMS.filter(item => user?.role && item.roles.includes(user.role));

  // Fetch pending counts for directora
  useEffect(() => {
    if (user?.role !== "directora") return;
    supabase.from("pagos").select("id", { count: "exact", head: true }).eq("estado", "por_revisar")
      .then(({ count }) => setPendingPayments(count || 0));
  }, [user?.role]);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-sm text-sidebar-foreground truncate">EduConnect</h2>
              <p className="text-xs text-sidebar-foreground/60">Centro Educativo</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-sidebar-foreground/60 hover:text-sidebar-foreground h-7 w-7">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!collapsed && user && (
          <div className="mx-4 mb-3 p-2 rounded-lg bg-sidebar-accent">
            <div className="flex items-center gap-2">
              <span className="text-lg">{roleEmoji}</span>
              <div>
                <p className="text-xs font-semibold text-sidebar-foreground">{user.displayName}</p>
                <p className="text-[10px] text-sidebar-foreground/60 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider">
            {collapsed ? "" : "Menú"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const badge = item.badgeKey === "pagos" ? pendingPayments : 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground relative"
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      >
                        <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                        {badge > 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-3">
        <Button
          variant="ghost"
          onClick={() => logout()}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!collapsed && "Cerrar sesión"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
