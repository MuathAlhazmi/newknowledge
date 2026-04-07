import { toast } from "sonner";

export function snackbarSuccess(message: string) {
  toast.success(message, { duration: 5000 });
}

export function snackbarError(message: string) {
  toast.error(message, { duration: 7000 });
}

export function snackbarWarning(message: string) {
  toast.warning(message, { duration: 6500 });
}
