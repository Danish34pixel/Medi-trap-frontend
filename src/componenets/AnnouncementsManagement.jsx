import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Pause, Play, Trash2 } from "lucide-react";
import { fetchJson, requestJson } from "./config/api";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";

const ROLE_OPTIONS = [
  { value: "medical_owner", label: "Medical Retailer" },
  { value: "stockist", label: "Stockist" },
  { value: "purchaser", label: "Purchaser" },
  { value: "staff", label: "Staff" },
];
const DEFAULT_ROLES = ROLE_OPTIONS.map((role) => role.value);
const EMPTY_FORM = {
  title: "",
  message: "",
  status: "draft",
  targetRoles: DEFAULT_ROLES,
};

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchJson("/announcements");
      setAnnouncements(result.data || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(
    () => ({
      released: announcements.filter((item) => item.status === "released"),
      draft: announcements.filter((item) => item.status === "draft"),
      paused: announcements.filter((item) => item.status === "paused"),
    }),
    [announcements],
  );

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };
  const toggleRole = (role) =>
    setForm((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((value) => value !== role)
        : [...current.targetRoles, role],
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.targetRoles.length) {
      setError("Select at least one target role.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const options = {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      };
      await requestJson(
        editingId ? `/announcements/${editingId}` : "/announcements",
        options,
      );
      reset();
      await load();
    } catch (saveError) {
      setError(saveError.message || "Could not save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      message: item.message,
      status: item.status,
      targetRoles: item.targetRoles || DEFAULT_ROLES,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setStatus = async (id, status) => {
    try {
      await requestJson(
        `/announcements/${id}/${status === "released" ? "release" : "pause"}`,
        { method: "PATCH" },
      );
      await load();
    } catch (statusError) {
      setError(statusError.message || "Could not update announcement.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await requestJson(`/announcements/${id}`, { method: "DELETE" });
      await load();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete announcement.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Announcements"
        subtitle="Create and manage announcements"
        role="slate"
        showBack
      />
      <main className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </h2>
              <p className="text-sm text-slate-500">
                Released announcements appear to selected roles.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="text-sm text-slate-500"
              >
                Cancel edit
              </button>
            )}
          </div>
          <form onSubmit={submit} className="space-y-4">
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Announcement title"
              className="w-full rounded-lg border border-slate-200 px-4 py-3"
            />
            <textarea
              required
              maxLength={2000}
              rows={4}
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Message / description"
              className="w-full resize-y rounded-lg border border-slate-200 px-4 py-3"
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Target Roles
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.targetRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value })
                }
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="released">Released</option>
                <option value="paused">Paused</option>
              </select>
              <button
                disabled={saving}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : form.status === "released"
                    ? "Release Announcement"
                    : "Save Draft"}
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </Card>

        {loading ? (
          <Card>
            <p className="text-slate-500">Loading announcements...</p>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <p className="text-slate-500">No announcements yet.</p>
          </Card>
        ) : (
          ["released", "draft", "paused"].map((status) => (
            <section key={status}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                {status} announcements ({groups[status].length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {groups[status].map((item) => (
                  <Card key={item._id} padding="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-800">{item.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Created {new Date(item.createdAt).toLocaleDateString()}
                      {item.releasedAt
                        ? ` · Released ${new Date(item.releasedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        title={item.status === "released" ? "Pause" : "Release"}
                        onClick={() =>
                          setStatus(
                            item._id,
                            item.status === "released" ? "paused" : "released",
                          )
                        }
                        className="rounded-md bg-slate-100 p-2 text-slate-700"
                      >
                        {item.status === "released" ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                      <button
                        title="Edit"
                        onClick={() => edit(item)}
                        className="rounded-md bg-slate-100 p-2 text-slate-700"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => remove(item._id)}
                        className="rounded-md bg-red-50 p-2 text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
