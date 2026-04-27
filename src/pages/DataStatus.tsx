import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, ArrowLeft, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Row = {
  key: string;
  table: string;
  labelKey: string;
  link?: string;
  count: number | null;
  error?: string | null;
};

const TABLES: Omit<Row, "count" | "error">[] = [
  { key: "shops",         table: "shops",         labelKey: "ds.shops",         link: "/shops" },
  { key: "branches",      table: "branches",      labelKey: "ds.branches",      link: "/branches" },
  { key: "employees",     table: "employees",     labelKey: "ds.employees",     link: "/employees" },
  { key: "customers",     table: "customers",     labelKey: "ds.customers",     link: "/customers" },
  { key: "services",      table: "services",      labelKey: "ds.services",      link: "/services" },
  { key: "orders",        table: "orders",        labelKey: "ds.orders",        link: "/orders" },
  { key: "invoices",      table: "invoices",      labelKey: "ds.invoices",      link: "/invoices" },
  { key: "subscriptions", table: "subscriptions", labelKey: "ds.subscriptions", link: "/shops" },
  { key: "user_roles",    table: "user_roles",    labelKey: "ds.userRoles" },
  { key: "profiles",      table: "profiles",      labelKey: "ds.profiles" },
];

export default function DataStatus() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>(
    TABLES.map((r) => ({ ...r, count: null, error: null }))
  );
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = async () => {
    setLoading(true);
    const next: Row[] = [];
    for (const r of TABLES) {
      const { count, error } = await supabase
        .from(r.table as any)
        .select("*", { count: "exact", head: true });
      next.push({ ...r, count: count ?? 0, error: error?.message ?? null });
    }
    setRows(next);
    setLastChecked(new Date());
    setLoading(false);
    if (next.some((r) => r.error)) {
      toast.error(t("ds.partialError"));
    } else {
      toast.success(t("ds.checkOk"));
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = rows.reduce((s, r) => s + (r.count ?? 0), 0);
  const okCount = rows.filter((r) => !r.error).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-glow">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("ds.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("ds.subtitle")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>
          </Link>
          <Button onClick={refresh} disabled={loading} className="lavage-btn gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("common.loading") : t("ds.recheck")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="lavage-card p-4">
          <p className="text-xs text-muted-foreground">{t("ds.totalRecords")}</p>
          <p className="text-3xl font-bold text-primary">{total.toLocaleString()}</p>
        </div>
        <div className="lavage-card p-4">
          <p className="text-xs text-muted-foreground">{t("ds.healthyTables")}</p>
          <p className="text-3xl font-bold text-success">
            {okCount} / {rows.length}
          </p>
        </div>
        <div className="lavage-card p-4">
          <p className="text-xs text-muted-foreground">{t("ds.lastChecked")}</p>
          <p className="text-lg font-semibold text-foreground">
            {lastChecked ? lastChecked.toLocaleString() : "—"}
          </p>
        </div>
      </div>

      <div className="lavage-card overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-3 border-b border-border text-xs font-bold text-muted-foreground uppercase">
          <div className="col-span-1">#</div>
          <div className="col-span-5">{t("ds.tableLabel")}</div>
          <div className="col-span-2 text-end">{t("ds.records")}</div>
          <div className="col-span-2 text-center">{t("common.status")}</div>
          <div className="col-span-2 text-end">{t("ds.review")}</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.key}
            className="grid grid-cols-12 items-center px-4 py-3 border-b border-border last:border-b-0 hover:bg-secondary/40 transition-colors"
          >
            <div className="col-span-1 text-xs text-muted-foreground">{i + 1}</div>
            <div className="col-span-5">
              <p className="font-semibold text-foreground">{t(r.labelKey)}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{r.table}</p>
            </div>
            <div className="col-span-2 text-end font-mono font-bold text-foreground">
              {r.count === null ? "…" : r.count.toLocaleString()}
            </div>
            <div className="col-span-2 flex justify-center">
              {r.error ? (
                <span className="inline-flex items-center gap-1 text-destructive text-xs" title={r.error}>
                  <AlertCircle className="w-4 h-4" />
                  {t("ds.errorBadge")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-success text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  {t("ds.okBadge")}
                </span>
              )}
            </div>
            <div className="col-span-2 flex justify-end">
              {r.link ? (
                <Link to={r.link}>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary">
                    {t("ds.open")}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        {t("ds.footerHint")}
      </p>
    </div>
  );
}
