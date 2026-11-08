"use client";

import { useState, useEffect, useId, useCallback } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Check, Flame, Gift, Loader2, X } from "lucide-react";
import { getLenis } from "@/lib/scroll";
import { JarItem, SlotSelection } from "@/types/gift";

const GiftBoxCanvas = dynamic(() => import("./GiftBoxCanvas"), { ssr: false });

interface SendGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlots: SlotSelection;
}

export default function SendGiftModal({
  isOpen,
  onClose,
  selectedSlots,
}: SendGiftModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form state
  const [senderName, setSenderName] = useState("");
  const [role, setRole] = useState("");
  const [note, setNote] = useState(
    "Wishing you and your family a radiant Diwali filled with light, laughter, and prosperity!"
  );

  // Form validation errors
  const [errors, setErrors] = useState<{ senderName?: string; note?: string }>({});
  const [touched, setTouched] = useState<{ senderName?: boolean; note?: boolean }>({});

  // Step 2 3D Preview state (starts opened to show the 6 jars, matching Image 3)
  const [boxPreviewOpen, setBoxPreviewOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Step 3 Created Gift state
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const nameInputId = useId();
  const roleInputId = useId();
  const noteInputId = useId();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setBoxPreviewOpen(true);
      setApiError(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      getLenis()?.stop();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      getLenis()?.start();
    };
  }, [isOpen]);

  // Validation function
  const validate = useCallback(() => {
    const errs: { senderName?: string; note?: string } = {};

    if (!senderName.trim()) {
      errs.senderName = "Please enter your name.";
    } else if (senderName.trim().length > 60) {
      errs.senderName = "Name must be 60 characters or less.";
    }

    if (!note.trim()) {
      errs.note = "Please write a brief Diwali greeting.";
    } else if (note.trim().length > 200) {
      errs.note = "Note cannot exceed 200 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [senderName, note]);

  // Step 1 -> Step 2
  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ senderName: true, note: true });

    if (validate()) {
      setBoxPreviewOpen(false);
      setStep(2);
    }
  };

  // Step 2 -> Step 3 (API Submission)
  const handleCreateLink = async () => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const jarIds = selectedSlots
        .filter((s): s is JarItem => s !== null)
        .map((s) => s.id);

      const res = await fetch("/api/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: senderName.trim(),
          role: role.trim(),
          note: note.trim(),
          jarIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create gift link.");
      }

      setCreatedId(data.id);
      try {
        const stored = JSON.parse(localStorage.getItem("iqoo_diwali_gifts") || "{}");
        stored[data.id] = data.gift;
        localStorage.setItem("iqoo_diwali_gifts", JSON.stringify(stored));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }
      setStep(3);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy link
  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/gift/${createdId}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const url = getShareUrl();
    const text = encodeURIComponent(
      `✨ ${senderName} sent you an exclusive iQOO Diwali gift box! Open your bespoke celebration hamper:\n\n${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-lenis-prevent
    >
      {/* Modal Container: Midnight Deep Navy with subtle gold hairline (Matching Reference Image 3) */}
      <div className="relative w-full max-w-lg my-6 rounded-2xl bg-[#0D1126] border border-[#263158] shadow-[0_0_80px_rgba(0,0,0,0.95)] p-5 sm:p-7 flex flex-col">
        {/* Close Button (Circle with X, matching Image 3) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-fg/70 hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* ── STEP 1: SENDER DETAILS ───────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleProceedToPreview} className="flex flex-col">
            <h3
              id="modal-title"
              className="font-heading text-2xl sm:text-3xl font-semibold tracking-wide text-gold leading-tight"
            >
              Sign Your Diwali Gift
            </h3>
            <p className="mt-1 text-xs sm:text-sm font-body text-[#8F97B7]">
              Add your name and heartfelt note to appear on the recipient&apos;s hamper.
            </p>

            <div className="mt-5 space-y-3.5">
              {/* Sender Name */}
              <div>
                <label
                  htmlFor={nameInputId}
                  className="block text-[11px] uppercase tracking-wider font-body text-gold/80 mb-1"
                >
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  value={senderName}
                  maxLength={60}
                  placeholder="e.g. Aniket"
                  onChange={(e) => {
                    setSenderName(e.target.value);
                    if (touched.senderName) validate();
                  }}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, senderName: true }));
                    validate();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070A18] border font-body text-sm text-fg placeholder:text-muted/60 focus:outline-none transition-colors ${
                    errors.senderName
                      ? "border-red-500/80 focus:border-red-500"
                      : "border-[#263158] focus:border-gold"
                  }`}
                />
                {errors.senderName && (
                  <p className="mt-1 text-xs text-red-400 font-body">
                    {errors.senderName}
                  </p>
                )}
              </div>

              {/* Sender Role (Optional) */}
              <div>
                <label
                  htmlFor={roleInputId}
                  className="block text-[11px] uppercase tracking-wider font-body text-gold/80 mb-1"
                >
                  Role or Relationship{" "}
                  <span className="text-muted text-[10px] lowercase">
                    (optional)
                  </span>
                </label>
                <input
                  id={roleInputId}
                  type="text"
                  value={role}
                  maxLength={60}
                  placeholder="e.g. Clan member or Lead Designer"
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070A18] border border-[#263158] focus:border-gold font-body text-sm text-fg placeholder:text-muted/60 focus:outline-none transition-colors"
                />
              </div>

              {/* Personal Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor={noteInputId}
                    className="block text-[11px] uppercase tracking-wider font-body text-gold/80"
                  >
                    Diwali Note <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[11px] font-body text-muted">
                    {note.length}/200
                  </span>
                </div>
                <textarea
                  id={noteInputId}
                  rows={3}
                  maxLength={200}
                  value={note}
                  placeholder="Write your festive greeting..."
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (touched.note) validate();
                  }}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, note: true }));
                    validate();
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#070A18] border font-body text-sm text-fg placeholder:text-muted/60 focus:outline-none transition-colors resize-none ${
                    errors.note
                      ? "border-red-500/80 focus:border-red-500"
                      : "border-[#263158] focus:border-gold"
                  }`}
                />
                {errors.note && (
                  <p className="mt-1 text-xs text-red-400 font-body">
                    {errors.note}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-gradient-to-r from-[#F5C042] via-[#E8B530] to-[#DC9D1B] text-[#151515] font-body text-sm uppercase tracking-wider font-semibold hover:opacity-95 transition-all cursor-pointer shadow-lg"
            >
              Preview Gift Box
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        )}

        {/* ── STEP 2: "YOUR GIFT IS WRAPPED" (Matching Reference Image 3) ── */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center">
            <h3 className="font-heading text-2xl sm:text-3xl font-semibold tracking-wide text-gold">
              Your gift is wrapped
            </h3>
            <p className="mt-1 text-xs sm:text-sm font-body text-[#8F97B7]">
              Open it to check the jars and your note.
            </p>

            {/* 3D Box Preview (Matching Image 3: open box with 6 jars inside) */}
            <div
              className="mt-2 w-full h-[220px] sm:h-[260px] relative flex items-center justify-center cursor-pointer group"
              title="Click box to toggle open/close"
            >
              <GiftBoxCanvas
                selectedSlots={selectedSlots}
                isOpen={boxPreviewOpen}
                onToggleOpen={() => setBoxPreviewOpen((v) => !v)}
                className="w-full h-full"
              />

              {/* Click prompt overlay */}
              <button
                type="button"
                onClick={() => setBoxPreviewOpen((v) => !v)}
                className="absolute bottom-1 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#070A18]/90 border border-gold/40 inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] sm:text-[11px] font-body text-gold uppercase tracking-widest cursor-pointer hover:border-gold transition-colors shadow-md"
              >
                {!boxPreviewOpen && <Gift className="w-3.5 h-3.5" aria-hidden="true" />}
                {boxPreviewOpen ? "Tap to Close" : "Tap to Open Box"}
              </button>
            </div>

            {/* Note & Attribution Card (Matching Reference Image 3) */}
            <div className="mt-4 w-full p-4 rounded-xl border border-gold/25 bg-[#070A18] text-left shadow-inner">
              <p className="font-heading italic text-base sm:text-lg text-fg font-medium">
                {note}
              </p>
              <span className="font-body text-xs sm:text-sm text-[#E8B530] block mt-2">
                — {senderName}
                {role ? `, ${role}` : ""}
              </span>
            </div>

            {apiError && (
              <p className="mt-3 text-xs text-red-400 font-body">{apiError}</p>
            )}

            {/* Action Buttons */}
            <div className="mt-5 w-full flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 py-3 px-4 rounded-full border border-[#263158] text-fg/70 font-body text-xs uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </button>

              {/* Solid Golden Pill Button (Matching Image 3: "Create gift link") */}
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#F5C042] via-[#E8B530] to-[#DC9D1B] text-[#151515] font-body text-sm font-semibold tracking-wide hover:opacity-95 transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Creating link...</span>
                  </>
                ) : (
                  <span>Create gift link</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: LINK CREATED & SHARE ─────────────────────────────── */}
        {step === 3 && createdId && (
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center text-gold mb-3 shadow-[0_0_25px_rgba(230,191,90,0.4)]">
              <Flame className="w-7 h-7" aria-hidden="true" />
            </div>

            <h3 className="font-heading text-2xl sm:text-3xl font-semibold tracking-wide text-gold">
              Your Diwali Gift is Ready!
            </h3>
            <p className="mt-2 text-xs sm:text-sm font-body text-[#8F97B7] max-w-sm">
              Share this exclusive link with your recipient. When they open it,
              their custom celebration hamper will unlock.
            </p>

            {/* Link Box */}
            <div className="mt-5 w-full p-3 rounded-xl border border-[#263158] bg-[#070A18] flex items-center justify-between gap-2">
              <span className="font-body text-xs sm:text-sm text-gold/90 truncate tracking-wide pl-2 select-all">
                {getShareUrl()}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F5C042] to-[#E8B530] text-[#151515] text-xs font-body font-semibold uppercase tracking-wider hover:opacity-95 transition-all flex-shrink-0 cursor-pointer"
              >
                {copied && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Share Options */}
            <div className="mt-5 w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 py-3.5 rounded-full bg-[#25D366] text-black font-body text-xs uppercase tracking-widest font-semibold hover:bg-[#20ba59] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <span>Share on WhatsApp</span>
              </button>

              <a
                href={`/gift/${createdId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 rounded-full border border-gold/50 text-gold font-body text-xs uppercase tracking-widest font-semibold hover:bg-gold hover:text-black transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>View Gift Page</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 text-xs font-body uppercase tracking-widest text-muted hover:text-fg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
