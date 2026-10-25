import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addChatTask, fetchChatTasks, getStoredTenantId } from "../../services/api";
import { Notice } from "../ui/Page";
import { Sheet } from "../ui/Sheet";
import { FollowUps } from "./FollowUps";

// Follow-ups for a chat that is not in the pipeline: a reminder to come back to this person, with the same
// Today list, assignee and escalation as a lead's.
export function ChatTasksSheet({
  conversationId,
  contactName,
  teammates,
  isManager,
  onClose,
}: {
  conversationId: string | null;
  contactName: string;
  teammates: { id: number; name: string }[];
  isManager: boolean;
  onClose: () => void;
}) {
  const tenant = getStoredTenantId();
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const tasks = useQuery({ queryKey: ["lead-tasks", tenant, "chat", conversationId], queryFn: () => fetchChatTasks(conversationId!), enabled: !!conversationId });
  const refresh = () => Promise.all(["lead-tasks", "leads", "lead"].map((k) => qc.invalidateQueries({ queryKey: [k, tenant] })));
  return (
    <Sheet open={!!conversationId} onClose={onClose} title="Follow-up" subtitle={contactName}>
      <div className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        {tasks.error && <Notice tone="error">Couldn't load the follow-ups.</Notice>}
        <FollowUps
          tasks={tasks.data || []}
          onAdd={(data) => addChatTask(conversationId!, data)}
          onChanged={refresh}
          onError={setError}
          empty="Nothing planned. Set a reminder to come back to this chat."
          teammates={teammates}
          canAssign={isManager}
        />
      </div>
    </Sheet>
  );
}
