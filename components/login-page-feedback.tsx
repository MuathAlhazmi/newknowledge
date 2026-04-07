"use client";

import { useEffect, useRef } from "react";
import { arCopy } from "@/lib/copy/ar";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";

export function LoginPageFeedback({
  passwordUpdated,
  authError,
}: {
  passwordUpdated: boolean;
  authError: boolean;
}) {
  const fired = useRef({ password: false, auth: false });
  useEffect(() => {
    if (passwordUpdated && !fired.current.password) {
      fired.current.password = true;
      snackbarSuccess(arCopy.snackbar.passwordUpdated);
    }
    if (authError && !fired.current.auth) {
      fired.current.auth = true;
      snackbarError(arCopy.snackbar.authCallbackFailed);
    }
  }, [passwordUpdated, authError]);
  return null;
}
