import Image from "next/image";
import type { CaseStudy } from "@/data/case-studies";

export function CaseStudyVisual({
  study,
  compact = false,
  priority = false,
}: {
  study: CaseStudy;
  compact?: boolean;
  priority?: boolean;
}) {
  return (
    <div
      className={`case-visual case-visual--${study.theme} ${compact ? "case-visual--compact" : ""}`}
      aria-label={`Branded website composition for ${study.name}`}
      role="img"
    >
      <div className="project-preview__atmosphere" />

      <div className="project-preview">
        <div className="project-preview__chrome">
          <span className="project-preview__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="project-preview__host">{study.visualHost}</span>
          <span className="project-preview__status">Live site ↗</span>
        </div>

        <div className="project-preview__screen">
          <Image
            alt=""
            className="project-preview__media"
            fill
            priority={priority}
            sizes="(max-width: 767px) 92vw, 84vw"
            src={study.visualImage}
          />
          <div className="project-preview__shade" />

          <div className="project-preview__nav">
            {study.visualLogo ? (
              <span className="project-preview__logo">
                <Image
                  alt=""
                  fill
                  sizes="(max-width: 767px) 130px, 220px"
                  src={study.visualLogo}
                />
              </span>
            ) : (
              <span className="project-preview__wordmark">
                APP<span>CARZ</span>
              </span>
            )}
            <span className="project-preview__menu" aria-hidden="true">
              <i />
              <i />
            </span>
          </div>

          <div className="project-preview__copy">
            <span className="project-preview__eyebrow">
              {study.visualEyebrow}
            </span>
            <strong>{study.visualTitle}</strong>
            <span className="project-preview__action">
              {study.visualAction} <b>↗</b>
            </span>
          </div>

          <div className="project-preview__metric">
            <strong>{study.visualMetric}</strong>
            <span>{study.visualCaption}</span>
          </div>
        </div>
      </div>

      <div className="project-preview__footer">
        <span>Project website</span>
        <strong>{study.visualHost}</strong>
      </div>
    </div>
  );
}
