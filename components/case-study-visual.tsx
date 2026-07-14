import type { CaseStudy } from "@/data/case-studies";

export function CaseStudyVisual({
  study,
  compact = false,
}: {
  study: CaseStudy;
  compact?: boolean;
}) {
  return (
    <div
      className={`case-visual case-visual--${study.theme} ${compact ? "case-visual--compact" : ""}`}
      aria-label={`Abstract identity and interface composition for ${study.name}`}
      role="img"
    >
      {study.theme === "ember" && (
        <>
          <div className="ember-word">NAMI</div>
          <div className="ember-circle" />
          <div className="ember-card">
            <span>Stay slowly</span>
            <strong>01—07</strong>
          </div>
          <div className="ember-caption">HOUSE / HOSPITALITY / 2026</div>
        </>
      )}

      {study.theme === "signal" && (
        <>
          <div className="signal-grid" />
          <div className="signal-arc" />
          <div className="signal-title">A1</div>
          <div className="signal-panel">
            <span>INFRASTRUCTURE / ACTIVE</span>
            <strong>82.4</strong>
            <i />
          </div>
          <div className="signal-mark">ARC ONE</div>
        </>
      )}

      {study.theme === "paper" && (
        <>
          <div className="paper-type">SORA</div>
          <div className="paper-object">
            <span />
            <i />
          </div>
          <div className="paper-copy">
            <span>OBJECT 03</span>
            <strong>Form, held in quiet balance.</strong>
          </div>
          <div className="paper-rule" />
        </>
      )}
    </div>
  );
}
