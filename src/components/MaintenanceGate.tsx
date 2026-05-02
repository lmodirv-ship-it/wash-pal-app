import { ReactNode } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useEffectiveRoles } from "@/hooks/useEffectiveRoles";
import { Wrench } from "lucide-react";

/**
 * Blocks the entire app when maintenance_mode is on, except for platform owners.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { data: settings } = useAppSettings();
  const { roles } = useEffectiveRoles();
  const isOwner = (roles ?? []).includes("owner");

  if (settings?.maintenance_mode && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6" dir="rtl">
        <div className="max-w-md text-center space-y-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-100">الموقع تحت الصيانة</h1>
          <p className="text-sm text-amber-200/80 leading-relaxed">
            {settings.maintenance_message || "نعمل على تحسين الخدمة. يرجى العودة لاحقاً."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}