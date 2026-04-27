import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Users, RefreshCw, Shield } from "lucide-react";
import { TableSkeleton } from "@/components/PageSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ALL_ROLES, AppRole } from "@/hooks/useEffectiveRoles";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  profile_role: string;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire plateforme",
  admin: "مدير عام",
  supervisor: "صاحب محل",
  manager: "Gérant / Manager",
  employee: "موظف",
  customer: "عميل",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  admin: "bg-red-500/15 text-red-400 border-red-500/30",
  supervisor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  manager: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  employee: "bg-green-500/15 text-green-400 border-green-500/30",
  customer: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users-list");
    if (error) {
      toast.error("فشل تحميل المستخدمين");
      setLoading(false);
      return;
    }
    setUsers((data?.users ?? []) as AdminUser[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && !u.roles.includes(roleFilter) && u.profile_role !== roleFilter) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
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
    load();
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
            <p className="text-sm text-muted-foreground">
              {users.length} مستخدم مسجّل في النظام
            </p>
          </div>
        </div>
        <Button onClick={load} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          تحديث
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-[hsl(220_25%_8%)] border border-[hsl(220_20%_14%)]">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الإيميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 bg-[hsl(220_25%_10%)] border-[hsl(220_20%_16%)]"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-[hsl(220_25%_10%)] border-[hsl(220_20%_16%)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            {ALL_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد مستخدمون"
          description="لم يتم العثور على نتائج مطابقة"
        />
      ) : (
        <div className="rounded-xl border border-[hsl(220_20%_14%)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(220_25%_10%)] text-muted-foreground">
              <tr>
                <th className="text-start p-3 font-semibold">الاسم</th>
                <th className="text-start p-3 font-semibold">البريد</th>
                <th className="text-start p-3 font-semibold">الأدوار</th>
                <th className="text-start p-3 font-semibold">آخر دخول</th>
                <th className="text-start p-3 font-semibold">تغيير الدور</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-[hsl(220_20%_14%)] hover:bg-[hsl(220_25%_8%)] transition-colors"
                >
                  <td className="p-3 font-semibold text-foreground">
                    {u.name || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles.length ? u.roles : [u.profile_role]).map((r) => (
                        <Badge
                          key={r}
                          variant="outline"
                          className={ROLE_COLORS[r] || ""}
                        >
                          {ROLE_LABELS[r] || r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString("ar")
                      : "لم يدخل بعد"}
                  </td>
                  <td className="p-3">
                    <Select
                      value={u.profile_role}
                      onValueChange={(v) => handleRoleChange(u.id, v)}
                      disabled={updatingId === u.id}
                    >
                      <SelectTrigger className="w-[140px] h-9 bg-[hsl(220_25%_10%)] border-[hsl(220_20%_16%)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}