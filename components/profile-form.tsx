"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/app/profile/actions";
import { Card } from "@/components/ui";
import { arCopy } from "@/lib/copy/ar";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

const profileCopy = arCopy.profile ?? {
  nameLabel: "الاسم الكامل",
  phoneLabel: "رقم الجوال",
  phonePlaceholder: "+9665xxxxxxxx",
  save: "حفظ البيانات",
  saving: "جارٍ الحفظ...",
};

export function ProfileForm({ initialName, initialPhone }: { initialName: string; initialPhone: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null as ProfileState);

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (!state) return;
    if (state.ok) snackbarSuccess(state.message);
    else snackbarError(state.message);
  });

  return (
    <Card elevated>
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">{profileCopy.nameLabel}</span>
          <input name="name" type="text" required defaultValue={initialName} />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">{profileCopy.phoneLabel}</span>
          <input
            name="phone"
            type="tel"
            required
            defaultValue={initialPhone}
            dir="ltr"
            className="text-left"
            placeholder={profileCopy.phonePlaceholder}
          />
        </label>

        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? profileCopy.saving : profileCopy.save}
        </button>
      </form>
    </Card>
  );
}
