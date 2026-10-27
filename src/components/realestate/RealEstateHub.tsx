import { useState } from "react";
import { EmptyState, Page, PageHeader, Segmented } from "../ui/Page";
import { Building2 } from "lucide-react";
import { LeadSheet } from "../pipeline/LeadSheet";
import { usePipelineSettings } from "../pipeline/usePipelineSettings";
import { BookViewingSheet } from "./BookViewingSheet";
import { PropertiesView } from "./PropertiesView";
import { RevenueView } from "./RevenueView";
import { ViewingsView } from "./ViewingsView";

type Tab = "revenue" | "properties" | "viewings";

// Scriwo Real Estate: where the money is leaking, the company's listings, and the viewings. Leads themselves stay in the
// pipeline; the lead sheet gains the qualification and matching for real-estate companies.
export function RealEstateHub({
  teammates,
  currentUserId,
  isManager,
  aiAvailable,
  onOpenChat,
}: {
  teammates: { id: number; name: string }[];
  currentUserId: number;
  isManager: boolean;
  aiAvailable: boolean;
  onOpenChat: (conversationId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("revenue");
  const [lead, setLead] = useState<string | null>(null);
  const [booking, setBooking] = useState<{
    leadId?: string;
    propertyId?: string;
  } | null>(null);
  const settings = usePipelineSettings();
  const stages = (settings.data?.stages || []).map(
    ({ id, name, kind, position }) => ({ id, name, kind, position }),
  );
  const currency = settings.data?.currency || "AED";
  return (
    <Page wide>
      <PageHeader
        eyebrow="Scriwo Real Estate"
        title="Real estate"
        subtitle="Find the leads that are slipping, keep your listings honest, and run your viewings."
        actions={
          <Segmented<Tab>
            label="Real estate sections"
            value={tab}
            onChange={setTab}
            items={[
              { key: "revenue", label: "Revenue" },
              { key: "properties", label: "Properties" },
              { key: "viewings", label: "Viewings" },
            ]}
          />
        }
      />
      {tab === "revenue" && (
        <RevenueView
          isManager={isManager}
          onOpenLead={setLead}
          onOpenChat={onOpenChat}
        />
      )}
      {tab === "properties" && (
        <PropertiesView
          isManager={isManager}
          currentUserId={currentUserId}
          teammates={teammates}
          currency={currency}
        />
      )}
      {tab === "viewings" && <ViewingsView onBook={() => setBooking({})} />}
      {settings.isPending ? null : (
        <LeadSheet
          leadId={lead}
          currency={currency}
          stages={stages}
          teammates={teammates}
          isManager={isManager}
          aiAvailable={aiAvailable}
          onClose={() => setLead(null)}
          onOpenChat={onOpenChat}
        />
      )}
      {booking && (
        <BookViewingSheet
          open
          onClose={() => setBooking(null)}
          teammates={teammates}
          currentUserId={currentUserId}
          isManager={isManager}
          leadId={booking.leadId}
          propertyId={booking.propertyId}
        />
      )}
    </Page>
  );
}

export function RealEstateUnavailable() {
  return (
    <Page>
      <EmptyState
        icon={<Building2 className="w-6 h-6" aria-hidden />}
        title="Scriwo Real Estate isn't switched on"
        body="Ask the Scriwo team to switch it on for your company."
      />
    </Page>
  );
}
