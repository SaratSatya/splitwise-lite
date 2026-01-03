"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RemoveMemberButton({
  groupId,
  memberUserId,
  label,
}: {
  groupId: string;
  memberUserId: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    const ok = confirm(`Remove ${label} from the group?`);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error ?? "Failed to remove member");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="border rounded px-3 py-1 text-xs"
      onClick={remove}
      disabled={loading}
      type="button"
    >
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}
