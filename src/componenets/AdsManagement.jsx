import React, { useEffect, useMemo, useState } from "react";
import { Edit3, ImagePlus, Pause, Play, Search, Trash2, X } from "lucide-react";
import { fetchJson, postForm, requestJson } from "./config/api";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "draft",
  image: null,
  stockists: [],
};

export default function AdsManagement() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stockists, setStockists] = useState([]);
  const [stockistSearch, setStockistSearch] = useState("");
  const [stockistsLoading, setStockistsLoading] = useState(true);

  const loadAds = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchJson("/ads");
      setAds(result.data || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load advertisements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
    (async () => {
      try {
        const result = await fetchJson("/stockist?limit=1000");
        setStockists(result.data || []);
      } catch (loadError) {
        setError(loadError.message || "Could not load stockists.");
      } finally {
        setStockistsLoading(false);
      }
    })();
  }, []);

  const groups = useMemo(
    () => ({
      released: ads.filter((ad) => ad.status === "released"),
      draft: ads.filter((ad) => ad.status === "draft"),
      paused: ads.filter((ad) => ad.status === "paused"),
    }),
    [ads],
  );

  const stockistName = (stockist) =>
    stockist.name ||
    stockist.contactPerson ||
    stockist.companyName ||
    "Unnamed stockist";

  const selectedStockists = stockists.filter((stockist) =>
    form.stockists.includes(String(stockist._id)),
  );

  const filteredStockists = stockists.filter((stockist) =>
    stockistName(stockist).toLowerCase().includes(stockistSearch.toLowerCase()),
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPreview("");
    setStockistSearch("");
  };

  const onImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, image: file }));
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const toggleStockist = (id) => {
    const normalizedId = String(id);
    setForm((current) => ({
      ...current,
      stockists: current.stockists.includes(normalizedId)
        ? current.stockists.filter((value) => value !== normalizedId)
        : [...current.stockists, normalizedId],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!editingId && !form.image) {
      setError("Ad image is required.");
      return;
    }
    if (!form.stockists.length) {
      setError("Select at least one stockist.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      if (editingId) {
        await requestJson(`/ads/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            status: form.status,
            stockists: form.stockists,
          }),
        });
      } else {
        const data = new FormData();
        data.append("image", form.image);
        data.append("title", form.title);
        data.append("description", form.description);
        data.append("status", form.status);
        data.append("stockists", JSON.stringify(form.stockists));
        await postForm("/ads", data, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
      }
      resetForm();
      await loadAds();
    } catch (saveError) {
      setError(saveError.message || "Could not save advertisement.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await requestJson(
        `/ads/${id}/${status === "released" ? "release" : "pause"}`,
        { method: "PATCH" },
      );
      await loadAds();
    } catch (statusError) {
      setError(statusError.message || "Could not update advertisement.");
    }
  };

  const edit = (ad) => {
    setEditingId(ad._id);
    setForm({
      title: ad.title,
      description: ad.description,
      status: ad.status,
      image: null,
      stockists: (ad.stockists || []).map(
        (stockist) => stockist._id || stockist,
      ),
    });
    setPreview(ad.image);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this advertisement?")) return;
    try {
      await requestJson(`/ads/${id}`, { method: "DELETE" });
      await loadAds();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete advertisement.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        title="Ads Management"
        subtitle="Create and manage advertisements"
        role="slate"
        showBack
      />
      <main className="max-w-6xl mx-auto p-5 md:p-8 space-y-6">
        <Card>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Advertisement" : "Create Advertisement"}
              </h2>
              <p className="text-sm text-slate-500">
                Released ads appear to eligible users.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form
            onSubmit={submit}
            className="grid md:grid-cols-[180px_1fr] gap-5"
          >
            <label className="border-2 border-dashed border-slate-200 rounded-xl min-h-40 flex items-center justify-center cursor-pointer overflow-hidden bg-slate-50">
              {preview ? (
                <img
                  src={preview}
                  alt="Ad preview"
                  className="w-full h-full min-h-40 object-cover"
                />
              ) : (
                <span className="text-center text-sm text-slate-500">
                  <ImagePlus className="mx-auto mb-2" />
                  Choose image
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onImageChange}
              />
            </label>

            <div className="space-y-4">
              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="Ad title"
                className="w-full rounded-lg border border-slate-200 px-4 py-3"
              />
              <textarea
                required
                maxLength={2000}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Ad description"
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 resize-y"
              />

              <div className="rounded-xl border border-slate-200 p-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Available at Stockists
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={stockistSearch}
                    onChange={(event) => setStockistSearch(event.target.value)}
                    placeholder="Search stockist..."
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1">
                  {stockistsLoading ? (
                    <p className="text-xs text-slate-500 py-2">
                      Loading stockists...
                    </p>
                  ) : filteredStockists.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      No stockists found.
                    </p>
                  ) : (
                    filteredStockists.map((stockist) => (
                      <label
                        key={stockist._id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={form.stockists.includes(
                            String(stockist._id),
                          )}
                          onChange={() => toggleStockist(stockist._id)}
                        />
                        {stockistName(stockist)}
                      </label>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedStockists.map((stockist) => (
                    <span
                      key={stockist._id}
                      className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs text-cyan-800"
                    >
                      {stockistName(stockist)}
                      <button
                        type="button"
                        onClick={() => toggleStockist(stockist._id)}
                        aria-label={`Remove ${stockistName(stockist)}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <span className="text-xs text-slate-400 py-1">
                    Selected: {form.stockists.length}
                  </span>
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
                  className="rounded-lg bg-slate-900 text-white px-5 py-2.5 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : form.status === "released"
                        ? "Release Ad"
                        : "Save Draft"}
                </button>
              </div>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </Card>

        {loading ? (
          <Card>
            <p className="text-slate-500">Loading advertisements...</p>
          </Card>
        ) : ads.length === 0 ? (
          <Card>
            <p className="text-slate-500">No advertisements yet.</p>
          </Card>
        ) : (
          ["released", "draft", "paused"].map((status) => (
            <section key={status}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                {status} ads ({groups[status].length})
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {groups[status].map((ad) => (
                  <Card key={ad._id} padding="p-4" className="flex gap-4">
                    <img
                      src={ad.image}
                      alt=""
                      className="w-24 h-24 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-bold text-slate-800 truncate">
                          {ad.title}
                        </h3>
                        <span className="text-xs capitalize px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          {ad.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                        {ad.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Stockists:{" "}
                        {(ad.stockists || [])
                          .slice(0, 2)
                          .map(
                            (stockist) =>
                              stockist.name ||
                              stockist.contactPerson ||
                              "Stockist",
                          )
                          .join(", ") || "None"}
                        {(ad.stockists || []).length > 2 &&
                          ` +${ad.stockists.length - 2} more`}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          title={ad.status === "released" ? "Pause" : "Release"}
                          onClick={() =>
                            changeStatus(
                              ad._id,
                              ad.status === "released" ? "paused" : "released",
                            )
                          }
                          className="p-2 rounded-md bg-slate-100 text-slate-700"
                        >
                          {ad.status === "released" ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                        <button
                          title="Edit"
                          onClick={() => edit(ad)}
                          className="p-2 rounded-md bg-slate-100 text-slate-700"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => remove(ad._id)}
                          className="p-2 rounded-md bg-red-50 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
