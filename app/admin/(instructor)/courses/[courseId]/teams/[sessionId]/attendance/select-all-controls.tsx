"use client";

export function SelectAllAttendanceControls() {
  function setAllFromButton(button: HTMLButtonElement, value: "0" | "1") {
    const form = button.form;
    if (!form) return;
    const selects = form.querySelectorAll<HTMLSelectElement>('select[name^="present_"]');
    for (const select of selects) {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  return (
    <>
      <button
        type="button"
        className="nk-btn nk-btn-secondary w-fit"
        onClick={(e) => setAllFromButton(e.currentTarget, "1")}
      >
        تحديد الكل حاضر
      </button>
      <button
        type="button"
        className="nk-btn nk-btn-secondary w-fit"
        onClick={(e) => setAllFromButton(e.currentTarget, "0")}
      >
        تحديد الكل غائب
      </button>
    </>
  );
}

