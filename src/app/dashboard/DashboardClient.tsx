"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Staff = { id: string; name: string; active: boolean };
type Review = {
  id: string;
  reviewer_name: string;
  reviewer_email: string;
  staff_id: string | null;
  staff_name: string;
  rating: number;
  comments: string;
  created_at: string;
};

function scoreColor(v: number) {
  if (v <= 3) return "linear-gradient(135deg, #E0546A, #B23A50)";
  if (v <= 6) return "linear-gradient(135deg, #E0A93A, #B8842A)";
  return "linear-gradient(135deg, #D726D7, #8B3FE8)";
}

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [mgmtOpen, setMgmtOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [mgmtError, setMgmtError] = useState("");

  const [staffFilter, setStaffFilter] = useState("");
  const [sortMode, setSortMode] = useState<"new" | "old" | "high" | "low">("new");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: staffData }, { data: reviewData }] = await Promise.all([
      supabase.from("staff").select("id, name, active").order("name"),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    ]);
    setStaff(staffData ?? []);
    setReviews(reviewData ?? []);
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function addStaffMember() {
    setMgmtError("");
    const name = newStaffName.trim();
    if (!name) return;
    if (staff.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setMgmtError("That name is already on the list.");
      return;
    }
    const { error } = await supabase.from("staff").insert({ name });
    if (error) {
      setMgmtError("Could not save — please try again.");
      return;
    }
    setNewStaffName("");
    loadAll();
  }

  async function toggleStaffActive(s: Staff) {
    const { error } = await supabase
      .from("staff")
      .update({ active: !s.active })
      .eq("id", s.id);
    if (error) {
      setMgmtError("Could not update — please try again.");
      return;
    }
    loadAll();
  }

  async function removeStaffMember(s: Staff) {
    const { error } = await supabase.from("staff").delete().eq("id", s.id);
    if (error) {
      setMgmtError("Could not remove — please try again.");
      return;
    }
    loadAll();
  }

  const stats = useMemo(() => {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    const staffCovered = new Set(reviews.map((r) => r.staff_name)).size;
    return { count, avg, staffCovered };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let items = reviews.slice();
    if (staffFilter) items = items.filter((r) => r.staff_name === staffFilter);
    items.sort((a, b) => {
      if (sortMode === "new") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sortMode === "old") return +new Date(a.created_at) - +new Date(b.created_at);
      if (sortMode === "high") return b.rating - a.rating;
      return a.rating - b.rating;
    });
    return items;
  }, [reviews, staffFilter, sortMode]);

  const staffNamesForFilter = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.staff_name))).sort(),
    [reviews]
  );

  return (
    <div className="wrap">
      <div className="header">
        <img className="logo-img" src="/logo.png" alt="Charlie's Support Services Angels" />
        <h1 className="brand-title">Staff Dashboard</h1>
        <p className="brand-sub">Signed in as {userEmail}</p>
      </div>

      <div style={{ textAlign: "right", marginBottom: 18 }}>
        <button className="btn-ghost" onClick={handleSignOut}>
          Sign out
        </button>
      </div>

      <div className="mgmt-card">
        <div className="mgmt-head">
          <span>Manage staff list</span>
          <button className="btn-ghost" onClick={() => setMgmtOpen((v) => !v)}>
            {mgmtOpen ? "Done" : "Edit"}
          </button>
        </div>
        {mgmtOpen && (
          <div className="mgmt-body">
            <div className="mgmt-add-row">
              <input
                type="text"
                placeholder="Add staff member name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStaffMember()}
              />
              <button className="btn-primary" style={{ width: "auto", margin: 0 }} onClick={addStaffMember}>
                Add
              </button>
            </div>
            {staff.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                No staff members yet — add the first one above.
              </div>
            ) : (
              staff.map((s) => (
                <span key={s.id} className={`mgmt-chip${s.active ? "" : " inactive"}`}>
                  {s.name}
                  {!s.active && " (inactive)"}
                  <button title={s.active ? "Mark inactive" : "Mark active"} onClick={() => toggleStaffActive(s)}>
                    {s.active ? "⏸" : "▶"}
                  </button>
                  <button title="Remove permanently" onClick={() => removeStaffMember(s)}>
                    ✕
                  </button>
                </span>
              ))
            )}
            <div className="error-msg">{mgmtError || "\u00A0"}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              Pausing (⏸) hides someone from the client form without deleting their review history.
              Removing (✕) deletes them from the list permanently.
            </div>
          </div>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="num">{stats.count}</div>
          <div className="lbl">Reviews</div>
        </div>
        <div className="stat-box">
          <div className="num">{stats.count ? stats.avg.toFixed(1) : "–"}</div>
          <div className="lbl">Avg rating</div>
        </div>
        <div className="stat-box">
          <div className="num">{stats.staffCovered}</div>
          <div className="lbl">Staff covered</div>
        </div>
      </div>

      <div className="filter-row">
        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">All staff members</option>
          {staffNamesForFilter.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as typeof sortMode)}>
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
          <option value="high">Highest rated</option>
          <option value="low">Lowest rated</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state">Loading reviews…</div>
      ) : filteredReviews.length === 0 ? (
        <div className="empty-state">No reviews yet. Once clients submit feedback, it will appear here.</div>
      ) : (
        filteredReviews.map((r) => (
          <div className="review-item" key={r.id}>
            <div className="review-top">
              <div>
                <div className="review-who">{r.reviewer_name}</div>
                <div className="review-meta">
                  {r.reviewer_email} ·{" "}
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="review-score" style={{ background: scoreColor(r.rating) }}>
                {r.rating}
              </div>
            </div>
            <div className="review-comment">{r.comments}</div>
            <div className="review-staff">{r.staff_name}</div>
          </div>
        ))
      )}
    </div>
  );
}
