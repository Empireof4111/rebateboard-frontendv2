import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, AlertTriangle, Upload } from "lucide-react";

/* ============ MODAL ============ */
export function Modal({
  open, onClose, title, subtitle, children, footer, size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizeCls =
    size === "sm" ? "max-w-md" :
    size === "lg" ? "max-w-3xl" :
    size === "xl" ? "max-w-5xl" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`mt-12 w-full ${sizeCls} rounded-2xl border border-white/10 bg-[#1a0d36]/95 shadow-2xl ring-1 ring-fuchsia-400/10`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 p-5">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-white/5 p-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ============ CONFIRM DIALOG ============ */
export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmText = "Confirm", tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${
              tone === "danger"
                ? "bg-gradient-to-r from-rose-500 to-rose-600"
                : "bg-gradient-to-r from-fuchsia-500 to-violet-600"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === "danger" && <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />}
        <p className="text-sm text-white/90">{message}</p>
      </div>
    </Modal>
  );
}

/* ============ FORM PRIMITIVES ============ */
export const fieldCls =
  "w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 focus:ring-fuchsia-400/40 focus:outline-none placeholder:text-muted-foreground";

export function Field({
  label, children, span = 1, hint,
}: { label: string; children: ReactNode; span?: 1 | 2; hint?: string }) {
  return (
    <div className={span === 2 ? "md:col-span-2" : ""}>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ============ THUMBNAIL UPLOADER (data URL preview) ============ */
export function ThumbnailUploader({
  value, onChange, label = "Thumbnail", height = "h-32", onSelectFile,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  height?: string;
  onSelectFile?: (file: File) => Promise<string | void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file?: File) => {
    if (!file) return;
    if (onSelectFile) {
      setUploading(true);
      try {
        const nextValue = await onSelectFile(file);
        if (typeof nextValue === "string" && nextValue) onChange(nextValue);
        else toast.error("Upload completed without a usable image URL");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to upload image";
        toast.error(message);
      } finally {
        setUploading(false);
        if (ref.current) ref.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]); }}
        className={`relative flex ${height} cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/5 text-xs text-muted-foreground hover:border-fuchsia-400/30`}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Click or drop image (PNG / JPG / SVG)"}
          </span>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*,.svg,image/svg+xml"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

/* ============ TOAST ============ */
type Toast = { id: string; msg: string; tone: "success" | "error" | "info" };
let pushImpl: ((t: Omit<Toast, "id">) => void) | null = null;
export const toast = {
  success: (msg: string) => pushImpl?.({ msg, tone: "success" }),
  error: (msg: string) => pushImpl?.({ msg, tone: "error" }),
  info: (msg: string) => pushImpl?.({ msg, tone: "info" }),
};

export function ToastViewport() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    pushImpl = (t) => {
      const id = Math.random().toString(36).slice(2);
      setItems((s) => [...s, { ...t, id }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3200);
    };
    return () => { pushImpl = null; };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-2xl ring-1 ${
            t.tone === "success" ? "bg-emerald-600/90 ring-emerald-300/30"
            : t.tone === "error" ? "bg-rose-600/90 ring-rose-300/30"
            : "bg-violet-600/90 ring-violet-300/30"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
