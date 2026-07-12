import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    staffId?: string;
    staffName?: string;
    rating?: number;
    comments?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, staffId, staffName, rating, comments } = body;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !staffId ||
    !staffName ||
    !rating ||
    rating < 1 ||
    rating > 10 ||
    !comments?.trim()
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  // Server-side Supabase client — uses the same public anon key, which is fine:
  // the "public can submit reviews" RLS policy already allows this insert.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error: insertError } = await supabase.from("reviews").insert({
    reviewer_name: name.trim(),
    reviewer_email: email.trim(),
    staff_id: staffId,
    staff_name: staffName,
    rating,
    comments: comments.trim(),
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }

  // Best-effort email notification — a failure here should never stop the
  // review itself from being saved, so errors are swallowed.
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (notifyEmail && resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.NOTIFY_FROM_EMAIL || "CSSA Reviews <onboarding@resend.dev>",
          to: notifyEmail,
          subject: `New review — ${staffName} rated ${rating}/10`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #0A0D24;">
              <h2 style="color: #9B2FAE;">New client review received</h2>
              <p><strong>Staff member:</strong> ${escapeHtml(staffName)}</p>
              <p><strong>Rating:</strong> ${rating} / 10</p>
              <p><strong>From:</strong> ${escapeHtml(name.trim())} (${escapeHtml(email.trim())})</p>
              <p><strong>Comments:</strong><br/>${escapeHtml(comments.trim()).replace(/\n/g, "<br/>")}</p>
              <p style="margin-top: 24px; font-size: 12px; color: #888;">
                View all reviews at your CSSA dashboard.
              </p>
            </div>
          `,
        }),
      });
    } catch {
      // Notification failed — the review is already saved, so this is non-fatal.
    }
  }

  return NextResponse.json({ ok: true });
}
