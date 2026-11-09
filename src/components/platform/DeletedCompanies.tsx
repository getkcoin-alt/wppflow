import { useQuery } from "@tanstack/react-query";
import { listDeletedCompanies } from "../../services/api";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** The companies the platform admin has deleted, newest first: what is kept of each is its name, owner, plan and numbers, never its data. */
export function DeletedCompanies() {
  const list = useQuery({ queryKey: ["deleted-companies"], queryFn: listDeletedCompanies, retry: false });
  if (!list.data?.length) return null;
  return (
    <details className="card p-5 sm:p-6 mt-4">
      <summary className="cursor-pointer select-none text-[15px] font-medium text-fg">Deleted companies ({list.data.length})</summary>
      <ul className="mt-4 space-y-3" aria-label="Deleted companies">
        {list.data.map((d) => {
          const c = d.counts;
          const had = [c.people && `${c.people} people`, c.numbers && `${c.numbers} numbers`, c.contacts && `${c.contacts} contacts`, c.messages && `${c.messages.toLocaleString()} messages`, c.files && `${c.files} files`].filter(Boolean).join(" · ");
          return (
            <li key={d.id} className="text-[14px]">
              <span className="font-medium text-fg">{d.name}</span>
              {d.plan ? <span className="text-fg-3"> · {d.plan}</span> : null}
              <span className="block text-fg-2">
                {d.owner ? `${d.owner.name}, ${d.owner.email}. ` : ""}Deleted {when(d.deletedAt)}
                {d.deletedBy ? ` by ${d.deletedBy}` : ""}.{had ? ` It had ${had}.` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
