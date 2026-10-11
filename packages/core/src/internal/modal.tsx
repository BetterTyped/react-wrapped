import { type ComponentType, type ReactNode, useEffect, useRef } from "react";

import { cn } from "./cn";

/**
 * A dialog on the browser's own `<dialog>`: focus trapping, Escape and the backdrop come with the element, so the
 * library needs no dialog dependency. One at a time, closed by Escape, the backdrop or its own buttons.
 */
export function Modal({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Older engines and test DOMs have the element without the method: it still shows, just not as a modal.
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- the click is the backdrop's; the keyboard's way out is Escape, which the dialog element handles itself
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => onOpenChange(false)}
      // A click that lands on the dialog itself, not on anything inside it, landed on the backdrop.
      onClick={(event) => {
        if (event.target === ref.current) onOpenChange(false);
      }}
      className="m-auto w-[min(92vw,640px)] rounded-[28px] bg-card p-0 text-foreground ring-1 ring-border backdrop:bg-black/60"
    >
      {open ? (
        <>
          <header className="flex items-start gap-3 px-6 pt-6">
            {Icon ? (
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                <Icon className="size-5" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-[24px] leading-[1.1] font-semibold tracking-[-0.04em]">{title}</h2>
              {description ? (
                <p className="mt-2 text-[14.5px] leading-normal text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </header>
          {children}
        </>
      ) : null}
    </dialog>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-5 px-6 py-5", className)}>{children}</div>;
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <footer className="flex flex-wrap items-center justify-between gap-2 px-6 pb-6">{children}</footer>;
}

export function ModalField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

export const modalInputClassName =
  "rounded-[14px] bg-muted px-3.5 py-2.5 text-[15px] ring-1 ring-border focus-visible:ring-2 focus-visible:ring-foreground";
