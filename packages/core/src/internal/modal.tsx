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
      className="wr-root wr:m-auto wr:w-[min(92vw,640px)] wr:rounded-[28px] wr:bg-card wr:p-0 wr:text-foreground wr:ring-1 wr:ring-border wr:backdrop:bg-black/60"
    >
      {open ? (
        <>
          <header className="wr:flex wr:items-start wr:gap-3 wr:px-6 wr:pt-6">
            {Icon ? (
              <span className="wr:grid wr:size-10 wr:shrink-0 wr:place-items-center wr:rounded-full wr:bg-muted">
                <Icon className="wr:size-5" />
              </span>
            ) : null}
            <div className="wr:min-w-0">
              <h2 className="wr:text-[24px] wr:leading-[1.1] wr:font-semibold wr:tracking-[-0.04em]">{title}</h2>
              {description ? (
                <p className="wr:mt-2 wr:text-[14.5px] wr:leading-normal wr:text-muted-foreground">{description}</p>
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
  return <div className={cn("wr:flex wr:flex-col wr:gap-5 wr:px-6 wr:py-5", className)}>{children}</div>;
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <footer className="wr:flex wr:flex-wrap wr:items-center wr:justify-between wr:gap-2 wr:px-6 wr:pb-6">
      {children}
    </footer>
  );
}

export function ModalField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="wr:flex wr:min-w-0 wr:flex-col wr:gap-2">
      <label htmlFor={htmlFor} className="wr:text-sm wr:font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

export const modalInputClassName =
  "wr:rounded-[14px] wr:bg-muted wr:px-3.5 wr:py-2.5 wr:text-[15px] wr:ring-1 wr:ring-border wr:focus-visible:ring-2 wr:focus-visible:ring-foreground";
