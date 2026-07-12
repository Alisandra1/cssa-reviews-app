"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HaloRating from "@/components/HaloRating";

type StaffOption = { id: string; name: string };

export default function ReviewPage() {
  const supabase = createClient();

  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [staffId, setStaffId] = useState("");
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("staff")
        .select("id, name")
        .eq("active", true)
        .order("name");
      setStaffList(data ?? []);
      setStaffLoading(false);
    })();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !staffId || !comments.trim()) {
      setError("Please complete all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (rating < 1) {
      setError("Please select a rating from 1 to 10.");
      return;
    }

    setSubmitting(true);
    const staffName = staffList.find((s) => s.id === staffId)?.name ?? "";

    let res: Response;
    try {
      res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          staffId,
          staffName,
          rating,
          comments: comments.trim(),
        }),
      });
    } catch {
      setError("Something went wrong saving your review. Please try again.");
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      setError("Something went wrong saving your review. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  function resetForm() {
    setName("");
    setEmail("");
    setStaffId("");
    setRating(0);
    setComments("");
    setSubmitted(false);
    setError("");
  }

  return (
    <div className="wrap">
      <div className="header">
        <img className="logo-img" src="/logo.png" alt="Charlie's Support Services Angels" />
        <h1 className="brand-title">Charlie&apos;s Support Services Angels</h1>
        <p className="brand-sub">Client Feedback</p>
      </div>

      <div className="card">
        {submitted ? (
          <div className="confirm">
            <div className="confirm-icon">✓</div>
            <h3>Thank you</h3>
            <p>Your review has been recorded for CSSA&apos;s internal records.</p>
            <button className="btn-ghost" onClick={resetForm}>
              Submit another review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row2">
              <div className="field">
                <label htmlFor="r-name">Your name</label>
                <input
                  id="r-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="r-email">Your email</label>
                <input
                  id="r-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="r-staff">Staff member</label>
              <select
                id="r-staff"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                disabled={staffLoading || staffList.length === 0}
              >
                <option value="" disabled>
                  {staffLoading
                    ? "Loading staff list…"
                    : staffList.length === 0
                    ? "No staff available"
                    : "Select a staff member"}
                </option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {!staffLoading && staffList.length === 0 && (
                <div className="hint">
                  No staff members have been set up yet. Please contact CSSA before submitting.
                </div>
              )}
            </div>

            <HaloRating value={rating} onChange={setRating} />

            <div className="field">
              <label htmlFor="r-comments">Comments</label>
              <textarea
                id="r-comments"
                placeholder="Tell us about the interaction — what went well, what could improve..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <div className="error-msg">{error || "\u00A0"}</div>
          </form>
        )}
      </div>
    </div>
  );
}
