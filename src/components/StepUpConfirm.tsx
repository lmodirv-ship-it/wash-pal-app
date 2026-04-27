import { ReactNode, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClientMeta } from "@/lib/clientMeta";

export interface StepUpConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Phrase the user must type to enable the confirm button. */
  confirmPhrase: string;
  destructive?: boolean;
  /** Audit logging metadata (sent to log_owner_action_v2). */
  audit: {
    action: string;
    target_type: string;
    target_id: string;
    old_value?: unknown;
    new_value?: unknown;
    metadata?: Record<string, unknown>;
  };
  /** Action to run before the audit row is inserted. Throw to abort. */
  onConfirm: (reason: string) => Promise<void>;
}

/**
 * Reusable step-up confirmation modal for owner-only sensitive actions.
 * Forces the user to type a phrase, optionally provide a reason,
 * runs the action, and then writes a row to audit_logs (with IP/UA).
 */
export function StepUpConfirm({
  open, onOpenChange, title, description, confirmPhrase,
  destructive, audit, onConfirm,
}: StepUpConfirmProps) {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => { setTyped(""); setReason(""); setBusy(false); };

  const handleConfirm = async () => {
    if (typed.trim() !== confirmPhrase) return;
    setBusy(true);
    try {
      await onConfirm(reason);
      const meta = getClientMeta();
      await supabase.rpc("log_owner_action_v2", {
        _action: audit.action,
        _target_type: audit.target_type,
        _target_id: audit.target_id,
        _old_value: (audit.old_value ?? null) as any,
        _new_value: (audit.new_value ?? null) as any,
        _metadata: ({ ...(audit.metadata ?? {}), reason: reason || null }) as any,
        _ip: meta.ip,
        _user_agent: meta.user_agent,
      });
      reset();
      onOpenChange(false);
    } catch (e) {
      // surface error to caller via re-throw of toast — keep modal open
      setBusy(false);
      throw e;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={destructive ? "w-5 h-5 text-red-500" : "w-5 h-5 text-amber-500"} />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              للتأكيد، اكتب: <span className="font-mono font-bold">{confirmPhrase}</span>
            </label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">سبب الإجراء (اختياري)</label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>إلغاء</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={typed.trim() !== confirmPhrase || busy}
            onClick={() => { void handleConfirm(); }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "تأكيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}