"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Team {
  id: string;
  name: string;
  owner: { id: string; email: string; name: string | null };
  members: { id: string; role: string; user: { id: string; email: string; name: string | null } }[];
  _count?: { members: number; invites: number };
}

interface _Workspace {
  id: string;
  name: string;
  type: string;
  teamId: string;
}

export default function TeamsSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [inviteRole, setInviteRole] = useState<Record<string, string>>({});
  const [inviting, setInviting] = useState<string | null>(null);
  const [switchingTeam, setSwitchingTeam] = useState(false);
  const [workspaces, setWorkspaces] = useState<_Workspace[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState<Record<string, string>>({});
  const [creatingWorkspace, setCreatingWorkspace] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  const refetch = () => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTeams(data.teams ?? []);
      })
      .catch(() => setTeams([]));
    fetch("/api/user/active-team")
      .then((r) => r.json())
      .then((data) => setActiveTeamId(data.activeTeamId ?? null))
      .catch(() => setActiveTeamId(null));
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((list) => setWorkspaces(Array.isArray(list) ? list : []))
      .catch(() => setWorkspaces([]));
  };

  const handleCreateWorkspace = async (teamId: string) => {
    const name = newWorkspaceName[teamId]?.trim();
    if (!name) return;
    setCreatingWorkspace(teamId);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, name, type: "campaign" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setNewWorkspaceName((prev) => ({ ...prev, [teamId]: "" }));
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreatingWorkspace(null);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;
    refetch();
    setLoading(false);
  }, [status]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setNewTeamName("");
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (teamId: string) => {
    const email = inviteEmail[teamId]?.trim();
    if (!email) return;
    setInviting(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: inviteRole[teamId] || "member",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setInviteEmail((prev) => ({ ...prev, [teamId]: "" }));
      if (data.invite?.inviteLink) {
        await navigator.clipboard.writeText(data.invite.inviteLink);
        alert(`Invite link copied to clipboard`);
      }
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setInviting(null);
    }
  };

  const isOwner = (team: Team) => {
    const uid = (session?.user as { userId?: string })?.userId ?? session?.user?.email;
    return team.owner.id === uid || team.owner.email === uid;
  };

  const isAdminOrOwner = (team: Team) => {
    if (isOwner(team)) return true;
    const uid = (session?.user as { userId?: string })?.userId ?? session?.user?.email;
    return team.members.some(
      (m) => (m.user.id === uid || m.user.email === uid) && m.role === "admin"
    );
  };

  const handleSetActiveTeam = async (teamId: string) => {
    setSwitchingTeam(true);
    try {
      const res = await fetch("/api/user/active-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) throw new Error("Failed");
      setActiveTeamId(teamId);
      await updateSession();
    } catch {
      alert("Failed to set active team");
    } finally {
      setSwitchingTeam(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/settings"
          className="mb-6 inline-block text-gray-400 transition-colors hover:text-white"
        >
          ← Settings
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-white">Teams</h1>
        <p className="mb-6 text-gray-400">
          Create teams, invite members, and manage brand approval.
        </p>

        {teams.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Active team</label>
            <select
              value={activeTeamId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) handleSetActiveTeam(v);
              }}
              disabled={switchingTeam}
              className="w-full max-w-xs rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
              title="Izberite aktivno ekipo"
            >
              <option value="">Select active team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Content and Canvas context use the active team.
            </p>
          </div>
        )}

        <form onSubmit={handleCreateTeam} className="mb-8 flex gap-3">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={creating || !newTeamName.trim()}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Team"}
          </button>
        </form>

        <div className="space-y-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-lg border border-gray-700 bg-gray-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{team.name}</h2>
                {isOwner(team) && (
                  <span className="text-xs text-gray-500">Owner</span>
                )}
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Members</p>
                <ul className="space-y-1">
                  {team.members.map((m) => (
                    <li key={m.id} className="text-sm text-gray-300">
                      {m.user.email} <span className="text-gray-500">({m.role})</span>
                    </li>
                  ))}
                </ul>
              </div>
              {isAdminOrOwner(team) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Workspaces</p>
                  <ul className="space-y-1 mb-2">
                    {workspaces.filter((w) => w.teamId === team.id).map((w) => (
                      <li key={w.id} className="text-sm text-gray-300">
                        {w.name} <span className="text-gray-500">({w.type})</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 items-end">
                    <input
                      type="text"
                      value={newWorkspaceName[team.id] ?? ""}
                      onChange={(e) =>
                        setNewWorkspaceName((prev) => ({ ...prev, [team.id]: e.target.value }))
                      }
                      placeholder="Workspace name"
                      className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateWorkspace(team.id)}
                      disabled={creatingWorkspace === team.id || !newWorkspaceName[team.id]?.trim()}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {creatingWorkspace === team.id ? "Creating..." : "Add Workspace"}
                    </button>
                  </div>
                </div>
              )}
              {isOwner(team) && (
                <div className="flex gap-2 flex-wrap items-end">
                  <input
                    type="email"
                    value={inviteEmail[team.id] ?? ""}
                    onChange={(e) =>
                      setInviteEmail((prev) => ({ ...prev, [team.id]: e.target.value }))
                    }
                    placeholder="Email to invite"
                    className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-500 text-sm"
                  />
                  <select
                    value={inviteRole[team.id] ?? "member"}
                    onChange={(e) =>
                      setInviteRole((prev) => ({ ...prev, [team.id]: e.target.value }))
                    }
                    className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white text-sm"
                    title="Izberite vlogo za povabilo"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleInvite(team.id)}
                    disabled={inviting === team.id || !inviteEmail[team.id]?.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviting === team.id ? "Inviting..." : "Invite"}
                  </button>
                </div>
              )}
              {isOwner(team) && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    disabled={deletingTeamId === team.id}
                    onClick={async () => {
                      if (!confirm("Izbriši ekipo? To dejanje ni mogoče razveljaviti.")) return;
                      setDeletingTeamId(team.id);
                      try {
                        const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error ?? "Failed");
                        refetch();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Failed to delete team");
                      } finally {
                        setDeletingTeamId(null);
                      }
                    }}
                    className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/20 disabled:opacity-50"
                  >
                    {deletingTeamId === team.id ? "Brisanje..." : "Izbriši ekipo"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
