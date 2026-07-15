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
          <div className="ember-word">{study.visualTitle}</div>
          <div className="ember-circle" />
          <div className="ember-card">
            <span>{study.visualEyebrow}</span>
            <strong>{study.visualMetric}</strong>
          </div>
          <div className="ember-caption">{study.visualCaption}</div>
        </>
      )}

      {study.theme === "signal" && (
        <>
          <div className="signal-grid" />
          <div className="signal-arc" />
          <div className="signal-title">{study.visualTitle}</div>
          <div className="signal-panel">
            <span>{study.visualEyebrow}</span>
            <strong>{study.visualMetric}</strong>
            <i />
          </div>
          <div className="signal-mark">{study.visualCaption}</div>
        </>
      )}

      {study.theme === "paper" && (
        <>
          <div className="paper-type">{study.visualTitle}</div>
          <div className="paper-object">
            <span />
            <i />
          </div>
          <div className="paper-copy">
            <span>{study.visualEyebrow}</span>
            <strong>{study.visualMetric}</strong>
          </div>
          <div className="paper-rule" />
          <div className="paper-caption">{study.visualCaption}</div>
        </>
      )}

      {study.theme === "community" && (
        <>
          <div className="community-grid" />
          <div className="community-orbit community-orbit--outer" />
          <div className="community-orbit community-orbit--inner" />
          <div className="community-title">{study.visualTitle}</div>
          <div className="community-copy">
            <span>{study.visualEyebrow}</span>
            <strong>{study.visualMetric}</strong>
          </div>
          <div className="community-caption">{study.visualCaption}</div>
        </>
      )}
    </div>
  );
}
