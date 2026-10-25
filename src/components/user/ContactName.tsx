import { useState } from "react";
import { Pencil } from "lucide-react";
import { btn, inputCls } from "../ui/styles";

// The contact's name in the details panel. A pencil edits it; the name WhatsApp shows stays visible so it can be restored.
export function ContactName({
  name,
  whatsappName,
  onRename,
}: {
  name: string;
  whatsappName?: string;
  onRename?: (patch: { name?: string; resetName?: boolean }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false),
    [value, setValue] = useState(name),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const run = async (patch: { name?: string; resetName?: boolean }) => {
    setBusy(true);
    setError("");
    try {
      await onRename!(patch);
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (editing)
    return (
      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim() && value.trim() !== name) void run({ name: value.trim() });
          else setEditing(false);
        }}
      >
        <input aria-label="Contact name" autoFocus value={value} maxLength={255} onChange={(e) => setValue(e.target.value)} className={`${inputCls} !h-10 text-center`} />
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        <div className="flex justify-center gap-2">
          <button type="button" className={btn("ghost", "sm")} onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button disabled={busy || !value.trim()} className={btn("primary", "sm")}>
            Save name
          </button>
        </div>
      </form>
    );
  return (
    <>
      <h4 className="font-semibold text-[20px] text-fg mt-3 flex items-center justify-center gap-2">
        <span className="break-words min-w-0">{name}</span>
        {onRename && (
          <button
            type="button"
            aria-label="Edit name"
            onClick={() => {
              setValue(name);
              setEditing(true);
            }}
            className="h-7 w-7 shrink-0 grid place-items-center rounded-full text-fg-2 hover:text-fg hover:bg-surface-2"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </h4>
      {whatsappName && whatsappName !== name && (
        <p className="text-[12.5px] text-fg-3 mt-0.5">
          WhatsApp shows “{whatsappName}”
          {onRename && (
            <>
              {" · "}
              <button type="button" disabled={busy} onClick={() => void run({ resetName: true })} className="underline hover:text-fg">
                Use that name
              </button>
            </>
          )}
        </p>
      )}
      {error && <p role="alert" className="text-[13px] text-danger mt-1">{error}</p>}
    </>
  );
}
