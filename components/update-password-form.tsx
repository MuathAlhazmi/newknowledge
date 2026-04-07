"use client";

import { useActionState } from "react";
import type { UpdatePasswordState } from "@/app/update-password/actions";
import { updatePasswordAction } from "@/app/update-password/actions";
import { Card } from "@/components/ui";
import { snackbarError } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, null as UpdatePasswordState);

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (state?.error) snackbarError(state.error);
  });

  return (
    <Card elevated>
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">كلمة المرور الجديدة</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={8} dir="ltr" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">تأكيد كلمة المرور</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            dir="ltr"
          />
        </label>
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </button>
      </form>
    </Card>
  );
}
