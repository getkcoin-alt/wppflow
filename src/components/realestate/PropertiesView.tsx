import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Search } from "lucide-react";
import { EmptyState, Field, Notice, Pill } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { btn, inputCls, selectCls } from "../ui/styles";
import { formatMoney } from "../../utils/pipeline";
import {
  reCreateProperty,
  reProperties,
  reUpdateProperty,
  reVerifyProperty,
  type PropertyInput,
  type ReProperty,
} from "../../services/realEstate";
import {
  PROPERTY_STATUS_LABEL,
  bedroomsText,
  errorOf,
  reKey,
  useReMeta,
} from "./common";
import { VerificationPill } from "./VerificationPill";

const STATUS_TONE: Record<
  string,
  "ok" | "warn" | "danger" | "neutral" | "gold"
> = {
  available: "ok",
  reserved: "gold",
  draft: "neutral",
  sold: "danger",
  rented: "danger",
  withdrawn: "neutral",
};

export function PropertiesView({
  isManager,
  currentUserId,
  teammates,
  currency,
}: {
  isManager: boolean;
  currentUserId: number;
  teammates: { id: number; name: string }[];
  currency: string;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const list = useQuery({
    queryKey: reKey("properties", q, status),
    queryFn: () => reProperties({ q, status }),
  });
  const [editing, setEditing] = useState<ReProperty | "new" | null>(null);
  const [error, setError] = useState("");
  const verify = useMutation({
    mutationFn: (id: string) => reVerifyProperty(id),
    onSuccess: async () => {
      setError("");
      await qc.invalidateQueries({ queryKey: reKey() });
    },
    onError: (e) => setError(errorOf(e)),
  });
  const rows = list.data?.properties || [];
  const counts = list.data?.counts || {};
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="w-4 h-4 text-fg-3 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden
          />
          <input
            aria-label="Search properties"
            placeholder="Reference, title or community"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={`${inputCls} !h-11 pl-10`}
            dir="auto"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${selectCls} !h-11 max-w-[190px]`}
        >
          <option value="">All statuses</option>
          {Object.entries(PROPERTY_STATUS_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
              {counts[k] ? ` (${counts[k]})` : ""}
            </option>
          ))}
        </select>
        {isManager && (
          <button
            type="button"
            className={btn("primary", "sm")}
            onClick={() => setEditing("new")}
          >
            <Plus className="w-4 h-4" aria-hidden /> Add a property
          </button>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {list.isPending && (
        <Loader2
          className="w-5 h-5 animate-spin text-fg-3"
          aria-label="Loading properties"
        />
      )}
      {list.error && <Notice tone="error">{errorOf(list.error)}</Notice>}
      {list.data && rows.length === 0 && (
        <EmptyState
          icon={<Building2 className="w-6 h-6" aria-hidden />}
          title={q || status ? "No property matches" : "No properties yet"}
          body={
            q || status
              ? "Try a different search."
              : isManager
                ? "Add the listings you are allowed to offer. Scriwo only ever matches and shares what you enter here."
                : "An owner or administrator adds the company's listings."
          }
          action={
            isManager && !q && !status ? (
              <button
                type="button"
                className={btn("primary")}
                onClick={() => setEditing("new")}
              >
                Add a property
              </button>
            ) : undefined
          }
        />
      )}
      <ul className="space-y-2">
        {rows.map((p) => (
          <li
            key={p.id}
            className="card p-4 flex flex-wrap items-center justify-between gap-3"
            data-testid={`property-${p.reference}`}
          >
            <div className="min-w-0">
              <p className="font-semibold text-[15px] flex items-center gap-2">
                {p.reference}
                <Pill tone={STATUS_TONE[p.status]}>
                  {PROPERTY_STATUS_LABEL[p.status]}
                </Pill>
              </p>
              <p className="text-[13px] text-fg-2 truncate" dir="auto">
                {[
                  p.title,
                  bedroomsText(p.bedrooms),
                  p.propertyType,
                  p.community,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="text-[12.5px] text-fg-3">
                For {p.purpose}
                {p.agentName ? ` · listed by ${p.agentName}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <p className="font-semibold num">
                  {p.price === null
                    ? "No price"
                    : formatMoney(p.price, p.currency)}
                  {p.purpose === "rent" && p.rentPeriod ? (
                    <span className="text-fg-3 font-normal text-[12px]">
                      {" "}
                      / {p.rentPeriod}
                    </span>
                  ) : null}
                </p>
                {(p.status === "available" || p.status === "reserved") && (
                  <VerificationPill p={p} />
                )}
              </div>
              {(p.status === "available" || p.status === "reserved") &&
                (isManager || p.agentUserId === currentUserId) && (
                  <button
                    type="button"
                    className={btn("secondary", "sm")}
                    disabled={verify.isPending}
                    onClick={() => verify.mutate(p.id)}
                  >
                    Still available
                  </button>
                )}
              {(isManager || p.agentUserId === currentUserId) && (
                <button
                  type="button"
                  className={btn("ghost", "sm")}
                  onClick={() => setEditing(p)}
                >
                  Edit
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {editing && (
        <PropertySheet
          key={editing === "new" ? "new" : editing.id}
          property={editing === "new" ? null : editing}
          isManager={isManager}
          teammates={teammates}
          currency={currency}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const blank = (currency: string) => ({
  reference: "",
  title: "",
  purpose: "sale",
  status: "draft",
  price: "",
  currency,
  rentPeriod: "year",
  community: "",
  propertyType: "apartment",
  bedrooms: "",
  bathrooms: "",
  sizeSqft: "",
  furnished: "",
  availableFrom: "",
  listingUrl: "",
  permitNumber: "",
  agentUserId: "",
  media: "",
});
type PF = ReturnType<typeof blank>;

function PropertySheet({
  property,
  isManager,
  teammates,
  currency,
  onClose,
}: {
  property: ReProperty | null;
  isManager: boolean;
  teammates: { id: number; name: string }[];
  currency: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const meta = useReMeta();
  const [f, setF] = useState<PF>(() =>
    property
      ? {
          reference: property.reference,
          title: property.title,
          purpose: property.purpose,
          status: property.status,
          price: property.price == null ? "" : String(property.price),
          currency: property.currency,
          rentPeriod: property.rentPeriod || "year",
          community: property.community,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms == null ? "" : String(property.bedrooms),
          bathrooms:
            property.bathrooms == null ? "" : String(property.bathrooms),
          sizeSqft: property.sizeSqft == null ? "" : String(property.sizeSqft),
          furnished: property.furnished || "",
          availableFrom: property.availableFrom || "",
          listingUrl: property.listingUrl,
          permitNumber: property.permitNumber,
          agentUserId: property.agentUserId ? String(property.agentUserId) : "",
          media: property.media
            .map((m) => `${m.kind} ${m.url}${m.caption ? ` ${m.caption}` : ""}`)
            .join("\n"),
        }
      : blank(currency),
  );
  const [error, setError] = useState("");
  const set = <K extends keyof PF>(k: K, v: PF[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  const n = (v: string) => (v.trim() === "" ? null : Number(v));
  const input = (): PropertyInput => ({
    reference: f.reference.trim(),
    title: f.title,
    purpose: f.purpose as "sale" | "rent",
    status: f.status as ReProperty["status"],
    price: n(f.price),
    currency: f.currency,
    rentPeriod:
      f.purpose === "rent" ? (f.rentPeriod as "year" | "month") : null,
    community: f.community,
    propertyType: f.propertyType,
    bedrooms: n(f.bedrooms),
    bathrooms: n(f.bathrooms),
    sizeSqft: n(f.sizeSqft),
    furnished: (f.furnished || null) as ReProperty["furnished"],
    availableFrom: f.availableFrom || null,
    listingUrl: f.listingUrl.trim(),
    permitNumber: f.permitNumber,
    ...(isManager
      ? {
          agentUserId: f.agentUserId ? Number(f.agentUserId) : null,
          media: f.media
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => {
              const [kind, url, ...caption] = l.split(/\s+/);
              return { kind: kind as "photo", url, caption: caption.join(" ") };
            }),
        }
      : {}),
  });
  const save = useMutation({
    mutationFn: () =>
      property
        ? reUpdateProperty(property.id, input())
        : reCreateProperty(input()),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: reKey() });
      onClose();
    },
    onError: (e) => setError(errorOf(e)),
  });
  return (
    <Sheet
      open
      onClose={onClose}
      title={property ? `Edit ${property.reference}` : "Add a property"}
      subtitle="Only a property marked Available can be matched, shared or booked for a viewing."
      footer={
        <>
          <button
            type="button"
            className={btn("primary")}
            disabled={!f.reference.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            )}
            {property ? "Save changes" : "Add the property"}
          </button>
          <button type="button" className={btn("ghost")} onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Reference" hint="Your own listing number. Unique.">
            <input
              aria-label="Reference"
              value={f.reference}
              maxLength={40}
              onChange={(e) => set("reference", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select
              aria-label="Status"
              value={f.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectCls}
            >
              {(
                meta.data?.propertyStatuses ||
                Object.keys(PROPERTY_STATUS_LABEL)
              ).map((s) => (
                <option key={s} value={s}>
                  {PROPERTY_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Title">
          <input
            aria-label="Title"
            value={f.title}
            maxLength={160}
            onChange={(e) => set("title", e.target.value)}
            className={inputCls}
            dir="auto"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="For">
            <select
              aria-label="For"
              value={f.purpose}
              onChange={(e) => set("purpose", e.target.value)}
              className={selectCls}
            >
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
            </select>
          </Field>
          <Field label="Property type">
            <select
              aria-label="Property type"
              value={f.propertyType}
              onChange={(e) => set("propertyType", e.target.value)}
              className={selectCls}
            >
              {(meta.data?.propertyTypes || ["apartment", "villa"]).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Price">
            <input
              aria-label="Price"
              type="number"
              min={0}
              inputMode="decimal"
              value={f.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Currency">
            <select
              aria-label="Currency"
              value={f.currency}
              onChange={(e) => set("currency", e.target.value)}
              className={selectCls}
            >
              {(
                meta.data?.currencies || ["AED", "USD", "EUR", "GBP", "INR"]
              ).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          {f.purpose === "rent" && (
            <Field label="Rent is per">
              <select
                aria-label="Rent is per"
                value={f.rentPeriod}
                onChange={(e) => set("rentPeriod", e.target.value)}
                className={selectCls}
              >
                <option value="year">Year</option>
                <option value="month">Month</option>
              </select>
            </Field>
          )}
        </div>
        <Field label="Community">
          <input
            aria-label="Community"
            value={f.community}
            maxLength={120}
            onChange={(e) => set("community", e.target.value)}
            className={inputCls}
            dir="auto"
            placeholder="Dubai Marina"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Bedrooms" hint="0 is a studio.">
            <input
              aria-label="Bedrooms"
              type="number"
              min={0}
              max={20}
              value={f.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              aria-label="Bathrooms"
              type="number"
              min={0}
              max={20}
              value={f.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Size (sq ft)">
            <input
              aria-label="Size in square feet"
              type="number"
              min={0}
              value={f.sizeSqft}
              onChange={(e) => set("sizeSqft", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Furnishing">
            <select
              aria-label="Furnishing"
              value={f.furnished}
              onChange={(e) => set("furnished", e.target.value)}
              className={selectCls}
            >
              <option value="">Not recorded</option>
              <option value="furnished">Furnished</option>
              <option value="partly">Partly furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </Field>
          <Field label="Available from">
            <input
              aria-label="Available from"
              type="date"
              value={f.availableFrom}
              onChange={(e) => set("availableFrom", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field
          label="Listing address"
          hint="The page where this property is advertised. https only."
        >
          <input
            aria-label="Listing address"
            type="url"
            value={f.listingUrl}
            onChange={(e) => set("listingUrl", e.target.value)}
            className={inputCls}
            placeholder="https://"
          />
        </Field>
        <Field label="Advertising permit number">
          <input
            aria-label="Advertising permit number"
            value={f.permitNumber}
            maxLength={60}
            onChange={(e) => set("permitNumber", e.target.value)}
            className={inputCls}
          />
        </Field>
        {isManager && (
          <>
            <Field label="Listing agent">
              <select
                aria-label="Listing agent"
                value={f.agentUserId}
                onChange={(e) => set("agentUserId", e.target.value)}
                className={selectCls}
              >
                <option value="">Nobody in particular</option>
                {teammates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Approved media"
              hint="One per line: photo, floorplan, brochure or video, then its https address, then an optional caption."
            >
              <textarea
                aria-label="Approved media"
                value={f.media}
                onChange={(e) => set("media", e.target.value)}
                className="w-full min-h-[90px] rounded-2xl bg-surface-2 px-4 py-3 text-[14px] outline-none"
                placeholder="photo https://cdn.example.com/a.jpg Living room"
              />
            </Field>
          </>
        )}
        {f.status === "available" && (
          <p className="text-[12.5px] text-fg-3">
            Marking it available records that you checked it today. You will be
            asked to confirm it again after{" "}
            {meta.data?.settings.freshnessDays ?? 14} days.
          </p>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Sheet>
  );
}
