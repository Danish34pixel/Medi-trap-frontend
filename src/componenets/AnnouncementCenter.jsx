import React, { useEffect, useState } from "react";
import { Bell, ChevronLeft, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchJson, requestJson } from "./config/api";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";

export default function AnnouncementCenter() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchJson("/announcements");
      setAnnouncements(result.data || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAnnouncement = async (item) => {
    setSelectedAnnouncement(item);
    if (!item.isRead) {
      try {
        await requestJson(`/announcements/${item._id}/read`, {
          method: "POST",
        });
        setAnnouncements((current) =>
          current.map((announcement) =>
            announcement._id === item._id
              ? { ...announcement, isRead: true }
              : announcement,
          ),
        );
      } catch (readError) {
        setError(readError.message || "Unable to mark announcement as read.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Announcements"
        subtitle="Updates for your account"
        role="slate"
        right={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-full p-2 hover:bg-white/15"
          >
            <ChevronLeft size={20} />
          </button>
        }
      />
      <main className="mx-auto max-w-3xl space-y-4 p-5 md:p-8">
        {loading ? (
          <Card>
            <p className="text-slate-500">Loading announcements...</p>
          </Card>
        ) : error ? (
          <Card>
            <p className="text-sm text-red-600">Unable to load announcements</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <div className="flex items-center gap-3 text-slate-500">
              <Bell size={20} />
              <p>No announcements available</p>
            </div>
          </Card>
        ) : (
          announcements.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => openAnnouncement(item)}
              className={`w-full text-left ${item.isRead ? "" : "bg-cyan-50/70"}`}
            >
              <Card
                className="transition-colors hover:border-cyan-200"
                padding="p-5"
              >
                <div className="flex gap-3">
                  <div className="pt-1">
                    {!item.isRead && (
                      <span
                        className="block h-2.5 w-2.5 rounded-full bg-cyan-600"
                        aria-label="Unread"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2
                        className={`text-base text-slate-800 ${item.isRead ? "font-semibold" : "font-bold"}`}
                      >
                        {item.title}
                      </h2>
                      <time className="shrink-0 text-xs text-slate-400">
                        {new Date(
                          item.releasedAt || item.createdAt,
                        ).toLocaleDateString()}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          ))
        )}
      </main>
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Announcement details"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedAnnouncement(null)}
              aria-label="Close announcement details"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <Bell className="h-8 w-8 text-cyan-600" />
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-cyan-600">
              Announcement
            </p>
            <h2 className="mt-2 pr-8 text-xl font-bold text-slate-900">
              {selectedAnnouncement.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {selectedAnnouncement.message}
            </p>
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
              Released on{" "}
              {new Date(
                selectedAnnouncement.releasedAt ||
                  selectedAnnouncement.createdAt,
              ).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
