import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Users, RefreshCw, Shield } from "lucide-react";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ALL_ROLES, AppRole, useEffectiveRoles } from "@/hooks/useEffectiveRoles";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  profile_role: string;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
  reference: string | null;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  perPage: number;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك المنصة",
  admin: "مدير عام",
  supervisor: "صاحب محل",
  manager: "Manager",
  employee: "موظف",
  customer: "عميل",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-accent/15 text-accent border-accent/30",
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  supervisor: "bg-warning/15 text-warning border-warning/30",
  manager: "bg-info/15 text-info border-info/30",
  employee: "bg-success/15 text-success border-success/30",
  customer: "bg-primary/15 text-primary border-primary/30",
};

const PAGE_SIZE = 50;

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { roles: myRoles } = useEffectiveRoles();
  const isPlatformOwner = (myRoles ?? []).includes("owner" as AppRole);
  const assignableRoles = ALL_ROLES.filter((r) => isPlatformOwner || r !== "owner");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["owner-users", page],
    staleTime: 45_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-users-list", {
        body: { page, perPage: PAGE_SIZE },
      });
      if (error) throw error;
      return (data ?? { users: [], total: 0, page, perPage: PAGE_SIZE }) as UsersResponse;
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? users.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && !u.roles.includes(roleFilter) && u.profile_role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          u.id.includes(q) ||
          (u.reference || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (updatingId) return;
    const target = users.find((u) => u.id === userId);
    const targetIsOwner = target?.profile_role === "owner" || target?.roles.includes("owner");
    if ((targetIsOwner || newRole === "owner") && !isPlatformOwner) {
      toast.error("فقط مالك المنصة يمكنه تعديل دور owner");
      return;
    }
    setUpdatingId(userId);
    const { error } = await supabase.functions.invoke("admin-update-user-role", {
      body: { user_id: userId, role: newRole },
    });
    setUpdatingId(null);
    if (error) {
      toast.error("فشل تعديل الدور");
      return;
    }
    toast.success("تم تعديل الدور بنجاح");
    refetch();
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString("ar-MA")} مستخدم من قاعدة البيانات</p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2" disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card/70 border border-border">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="بحث ضمن الصفحة بالاسم أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 bg-card border-border" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          فشل تحميل المستخدمين. <Button variant="outline" size="sm" onClick={() => refetch()} className="ms-2">إعادة المحاولة</Button>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مستخدمون" description="لم يتم العثور على نتائج مطابقة" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card/70">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start p-3 font-semibold">المرجع</th>
                  <th className="text-start p-3 font-semibold">الاسم</th>
                  <th className="text-start p-3 font-semibold">البريد</th>
                  <th className="text-start p-3 font-semibold">الأدوار</th>
                  <th className="text-start p-3 font-semibold">آخر دخول</th>
                  <th className="text-start p-3 font-semibold">تغيير الدور</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border/70 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      {u.reference ? (
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 tracking-wider">
                          {u.reference}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-foreground">{u.name || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles.length ? u.roles : [u.profile_role]).map((r) => (
                          <Badge key={r} variant="outline" className={ROLE_COLORS[r] || ""}>{ROLE_LABELS[r] || r}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ar") : "لم يدخل بعد"}</td>
                    <td className="p-3">
                      <Select
                        value={u.profile_role}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                        disabled={updatingId === u.id || ((u.profile_role === "owner" || u.roles.includes("owner")) && !isPlatformOwner)}
                      >
                        <SelectTrigger className="w-[140px] h-9 bg-card border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>{assignableRoles.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>صفحة {page.toLocaleString("ar-MA")} من {pageCount.toLocaleString("ar-MA")}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>السابق</Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount || isFetching} onClick={() => setPage((p) => p + 1)}>التالي</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
