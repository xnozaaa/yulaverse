"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { caseStudies, type CaseStudy } from "@/data/case-studies";
import { ContactForm } from "@/components/contact-form";
import { Logo } from "@/components/logo";
import { Reveal } from "./reveal";
import { SceneBoundary, type SceneStatus } from "./scene-boundary";
import styles from "./universe.module.css";

const OrbitalScene = dynamic(() => import("./orbital-scene"), { ssr: false });
const services = [
  {
    title: "Brand identity",
    line: "A world only you can own.",
    text: "Strategy, distinctive logos and flexible visual systems that give your business a recognisable point of view.",
    tags: ["Brand strategy", "Visual identity", "Brand guidelines"],
  },
  {
    title: "Digital experiences",
    line: "Made to be felt. Built to perform.",
    text: "Premium websites where clear journeys, considered interactions and exceptional design turn attention into action.",
    tags: ["Web design", "UX & UI", "Development"],
  },
  {
    title: "Creative direction",
    line: "Every detail. One vision.",
    text: "A cohesive creative language across your campaigns, content and customer touchpoints. Consistent by design.",
    tags: ["Art direction", "Content systems", "Launch campaigns"],
  },
];
const processStages = [
  [
    "Discover",
    "Your business. Your audience. Your ambition. We start by asking the right questions.",
  ],
  [
    "Define",
    "Find the point of difference and establish a clear strategic and creative direction.",
  ],
  [
    "Design",
    "Bring the world to life through identity, digital design and thoughtful interaction.",
  ],
  [
    "Launch",
    "Refine, test and prepare a complete, consistent system ready to meet the world.",
  ],
];

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={down ? { transform: "rotate(135deg)" } : undefined}
    >
      <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ProjectArtwork({
  study,
  large = false,
}: {
  study: CaseStudy;
  large?: boolean;
}) {
  return (
    <div
      className={`${styles.artwork} ${styles[study.theme]} ${large ? styles.artworkLarge : ""}`}
    >
      <span className={styles.artworkIndex}>{study.visualHost}</span>
      <div className={styles.artworkAura} />
      <div className={styles.browserMock}>
        <div className={styles.browserChrome}>
          <span>● ● ●</span>
          <span>{study.visualHost}</span>
          <span>↗</span>
        </div>
        <div className={styles.browserScreen}>
          <Image
            src={study.visualImage}
            alt=""
            fill
            sizes={large ? "90vw" : "(max-width: 760px) 90vw, 45vw"}
            className={styles.projectImage}
          />
          <div className={styles.projectShade} />
          <div className={styles.projectBrand}>
            {study.visualLogo ? (
              <Image
                src={study.visualLogo}
                alt={study.name}
                width={220}
                height={90}
                className={styles.projectLogo}
              />
            ) : (
              <span className={styles.appCarz}>
                APP<span>CARZ</span>
              </span>
            )}
            <span className={styles.mockMenu}>☰</span>
          </div>
          <div className={styles.projectCopy}>
            <span>{study.visualEyebrow}</span>
            <strong>{study.visualTitle}</strong>
            <span className={styles.mockButton}>{study.visualAction} ↗</span>
          </div>
        </div>
      </div>
      <span className={styles.artworkCaption}>{study.industry}</span>
      <span className={styles.artworkCross} aria-hidden="true">
        +
      </span>
    </div>
  );
}

export function UniverseConcept() {
  const [paused, setPaused] = useState(false);
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);
  const [activeProject, setActiveProject] = useState<CaseStudy | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const projectDialog = useRef<HTMLDialogElement>(null);
  const contactDialog = useRef<HTMLDialogElement>(null);
  const menuDialog = useRef<HTMLDialogElement>(null);
  const heroTrack = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    if (preference.addEventListener) {
      preference.addEventListener("change", update);
      return () => preference.removeEventListener("change", update);
    }
    preference.addListener(update);
    return () => preference.removeListener(update);
  }, []);
  const { scrollYProgress } = useScroll();
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  useEffect(() => {
    const track = heroTrack.current;
    if (!track) return;
    let distance = Math.max(track.offsetHeight - window.innerHeight, 1);
    const update = () => {
      const progress = reduced
        ? 0
        : Math.min(Math.max(window.scrollY / distance, 0), 1);
      track.style.setProperty("--hero-progress", String(progress));
    };
    const resize = () => {
      distance = Math.max(track.offsetHeight - window.innerHeight, 1);
      update();
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  useEffect(() => {
    const dialog = projectDialog.current;
    if (activeProject) dialog?.showModal();
    else dialog?.close();
  }, [activeProject]);
  useEffect(() => {
    const dialog = contactDialog.current;
    if (contactOpen) dialog?.showModal();
    else dialog?.close();
  }, [contactOpen]);
  useEffect(() => {
    const dialog = menuDialog.current;
    if (menuOpen) dialog?.showModal();
    else dialog?.close();
  }, [menuOpen]);
  useEffect(() => {
    if (!activeProject && !contactOpen && !menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeProject, contactOpen, menuOpen]);

  return (
    <div
      className={styles.universe}
      data-motion={paused || reduced ? "off" : "on"}
    >
      <motion.div className={styles.progress} style={{ scaleX: lineScale }} />
      <header className={styles.header}>
        <a
          className={styles.logo}
          href="#top"
          aria-label="Yulaverse Studio home"
        >
          <Logo variant="light" priority />
        </a>
        <nav className={styles.navigation} aria-label="Main navigation">
          <a href="#work">
            Selected work <sup>04</sup>
          </a>
          <a href="#studio">The studio</a>
          <a href="#expertise">Expertise</a>
        </nav>
        <button
          className={styles.headerCta}
          onClick={() => setContactOpen(true)}
        >
          Let’s talk <Arrow />
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
        >
          <span />
          <span />
        </button>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div ref={heroTrack} className={styles.heroTrack} id="top">
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroAtmosphere} aria-hidden="true" />
            <div className={styles.scene} data-scene-status={sceneStatus}>
              <SceneBoundary onStatus={setSceneStatus}>
                <OrbitalScene paused={paused} onStatus={setSceneStatus} />
              </SceneBoundary>
              <div className={styles.sceneFallback} aria-hidden="true">
                <i />
                <i />
                <i />
                <span className={styles.fallbackCore} />
              </div>
            </div>
            <div className={styles.heroGrid} aria-hidden="true" />
            <div className={styles.heroIntro}>
              <span className={styles.goldDot} /> Independent creative studio
              <span className={styles.heroIntroDivider}>/</span>Brand + Digital
            </div>
            <div className={styles.heroContent}>
              <h1 id="hero-title">
                Beyond
                <br />
                <em>ordinary.</em>
              </h1>
              <p>
                Distinctive brands. Extraordinary digital experiences.
                <br />
                Welcome to a universe of possibility.
              </p>
              <a href="#work" className={styles.heroLink}>
                Explore our universe{" "}
                <span>
                  <Arrow down />
                </span>
              </a>
            </div>
            <div className={styles.heroSecond} aria-hidden="true">
              <span>Clarity. Character. Craft.</span>
              <p>
                A world of <em>your own.</em>
              </p>
            </div>
            <div className={styles.objectLabel}>
              <span>YS—001</span>
              <i />
              <span>
                A new dimension
                <br />
                of brand & digital.
              </span>
            </div>
            <div className={styles.heroBottom}>
              <a href="#studio" className={styles.scrollHint}>
                <span className={styles.scrollTrack}>
                  <i />
                </span>
                Scroll to discover
              </a>
              <span className={styles.heroCoordinates}>
                Ideas without limits.
                <br />
                Design with intention.
              </span>
              <button
                className={styles.motionButton}
                onClick={() => setPaused(!paused)}
                aria-pressed={paused}
                disabled={Boolean(reduced)}
              >
                <span aria-hidden="true">{paused || reduced ? "▷" : "Ⅱ"}</span>
                {reduced
                  ? "Reduced motion"
                  : paused
                    ? "Play motion"
                    : "Pause motion"}
              </button>
            </div>
          </section>
        </div>

        <section id="studio" className={styles.introduction}>
          <span id="about" className={styles.legacyAnchor} aria-hidden="true" />
          <div className={styles.sectionMeta}>
            <span>01 / The studio</span>
            <span>Strategy meets imagination</span>
          </div>
          <Reveal className={styles.introductionContent}>
            <span className={styles.introMark}>
              <Logo variant="monogram-light" />
            </span>
            <div>
              <h2>
                Some brands fit in.
                <br />
                We build the ones
                <br />
                <span>that stand apart.</span>
              </h2>
              <div className={styles.introBottom}>
                <span className={styles.tinyStar} aria-hidden="true">
                  ✦
                </span>
                <p>
                  Yulaverse Studio is an independent creative studio bringing
                  strategic clarity, distinctive identities and thoughtful
                  digital craft to ambitious businesses and organisations.
                </p>
                <a
                  href="#expertise"
                  className={styles.circleLink}
                  aria-label="Explore our expertise"
                >
                  <Arrow down />
                </a>
              </div>
            </div>
          </Reveal>
        </section>

        <section id="work" className={styles.work}>
          <div className={styles.sectionMeta}>
            <span>02 / Selected work</span>
            <span>Four brands. Four different worlds.</span>
          </div>
          <Reveal className={styles.workHeading}>
            <h2>
              Proof of
              <br />
              <em>possibility.</em>
            </h2>
            <p>
              Real businesses. Meaningful ideas.
              <br />
              Explore the worlds we’ve helped create.
            </p>
          </Reveal>
          <div className={styles.workGrid}>
            {caseStudies.map((study, index) => (
              <Reveal as="article" className={styles.project} key={study.slug}>
                <button
                  key="artwork"
                  onClick={() => setActiveProject(study)}
                  className={styles.projectButton}
                  aria-label={`Explore ${study.name} project`}
                >
                  <ProjectArtwork study={study} />
                  <span className={styles.projectHover}>
                    Explore project <Arrow />
                  </span>
                </button>
                <div key="information" className={styles.projectInfo}>
                  <div>
                    <span className={styles.projectNumber}>0{index + 1}</span>
                    <h3>{study.name}</h3>
                  </div>
                  <span className={styles.projectCategory}>
                    {study.services[0]}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="expertise" className={styles.expertise}>
          <span
            id="services"
            className={styles.legacyAnchor}
            aria-hidden="true"
          />
          <div className={styles.sectionMeta}>
            <span>03 / Our expertise</span>
            <span>One studio. A complete vision.</span>
          </div>
          <div className={styles.expertiseGrid}>
            <Reveal className={styles.expertiseIntro}>
              <h2>
                From first spark
                <br />
                to <em>full impact.</em>
              </h2>
              <p>
                Everything your brand needs to feel like itself. And nothing
                that gets in the way.
              </p>
              <div className={styles.serviceSculpture} aria-hidden="true">
                <span />
                <span />
                <span />
                <i>✦</i>
              </div>
            </Reveal>
            <div className={styles.serviceList}>
              {services.map((service, index) => (
                <div
                  className={`${styles.service} ${activeService === index ? styles.serviceActive : ""}`}
                  key={service.title}
                >
                  <button
                    aria-expanded={activeService === index}
                    aria-controls={`service-${index}`}
                    onClick={() =>
                      setActiveService(activeService === index ? -1 : index)
                    }
                  >
                    <span>0{index + 1}</span>
                    <h3>{service.title}</h3>
                    <span className={styles.serviceToggle}>
                      {activeService === index ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    id={`service-${index}`}
                    hidden={activeService !== index}
                    className={styles.serviceBody}
                  >
                    <h4>{service.line}</h4>
                    <p>{service.text}</p>
                    <div className={styles.tags}>
                      {service.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.process} id="process">
          <div className={styles.sectionMeta}>
            <span>04 / The process</span>
            <span>Clear thinking. Forward motion.</span>
          </div>
          <Reveal as="h2">
            Big ideas.
            <br />
            <em>Considered execution.</em>
          </Reveal>
          <div className={styles.processGrid}>
            {processStages.map(([title, text], index) => (
              <Reveal key={title} className={styles.processStep}>
                <span key="number" className={styles.processNumber}>
                  0{index + 1}
                </span>
                <div key="line" className={styles.processLine}>
                  <i />
                </div>
                <h3 key="title">{title}</h3>
                <p key="description">{text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="contact" className={styles.contact}>
          <div className={styles.contactOrbit} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className={styles.sectionMeta}>
            <span>05 / Your next chapter</span>
            <span>Starts with a conversation</span>
          </div>
          <Reveal className={styles.contactContent}>
            <p>Have something extraordinary in mind?</p>
            <h2>
              Let’s build
              <br />
              <em>your universe.</em>
            </h2>
            <button
              onClick={() => setContactOpen(true)}
              className={styles.contactCta}
            >
              Start a project <Arrow />
            </button>
            <a href="mailto:yulaversestudio@gmail.com" className={styles.email}>
              yulaversestudio@gmail.com
            </a>
          </Reveal>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <a
            href="#top"
            className={styles.logo}
            aria-label="Back to Yulaverse home"
          >
            <Logo variant="light" />
          </a>
          <p>
            Brand identity. Web design.
            <br />
            Creative direction.
          </p>
          <a
            href="https://www.instagram.com/yulaversestudio/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram <Arrow />
          </a>
          <a href="#top">Back to top ↑</a>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Yulaverse Studio</span>
          <span>Independent minds. Infinite possibilities.</span>
          <span className={styles.footerSignature}>Brand + Digital</span>
        </div>
      </footer>

      <dialog
        ref={projectDialog}
        className={styles.projectDialog}
        onCancel={() => setActiveProject(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setActiveProject(null);
        }}
        aria-labelledby="project-title"
      >
        {activeProject && (
          <div className={styles.dialogInterior}>
            <div className={styles.dialogTop}>
              <span>Selected project / Yulaverse Studio</span>
              <button
                onClick={() => setActiveProject(null)}
                aria-label="Close project"
              >
                Close ×
              </button>
            </div>
            <h2 id="project-title">{activeProject.name}</h2>
            <p className={styles.dialogSummary}>{activeProject.summary}</p>
            <ProjectArtwork study={activeProject} large />
            <div className={styles.projectDetails}>
              <div>
                <span className={styles.miniLabel}>The direction</span>
                <p>{activeProject.direction}</p>
              </div>
              <div>
                <span className={styles.miniLabel}>What we did</span>
                {activeProject.services.map((service) => (
                  <p className={styles.detailService} key={service}>
                    {service}
                  </p>
                ))}
                <a
                  className={styles.liveLink}
                  href={activeProject.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit live website <Arrow />
                </a>
              </div>
            </div>
          </div>
        )}
      </dialog>

      <dialog
        ref={contactDialog}
        className={styles.contactDialog}
        onCancel={() => setContactOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setContactOpen(false);
        }}
        aria-labelledby="contact-title"
      >
        <div className={styles.dialogInterior}>
          <div className={styles.dialogTop}>
            <span>Your next chapter</span>
            <button
              onClick={() => setContactOpen(false)}
              aria-label="Close enquiry form"
            >
              Close ×
            </button>
          </div>
          <h2 id="contact-title">Tell us your idea.</h2>
          <p className={styles.dialogSummary}>
            Where is your business now, and where would you like to take it?
          </p>
          <ContactForm />
        </div>
      </dialog>

      <dialog
        ref={menuDialog}
        className={styles.menuDialog}
        onCancel={() => setMenuOpen(false)}
        aria-label="Navigation"
      >
        <div className={styles.dialogTop}>
          <span>Yulaverse Studio</span>
          <button onClick={() => setMenuOpen(false)}>Close ×</button>
        </div>
        <nav>
          {[
            ["Selected work", "work"],
            ["The studio", "studio"],
            ["Expertise", "expertise"],
            ["Our process", "process"],
            ["Let’s talk", "contact"],
          ].map(([title, id], i) => (
            <a href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>
              <span>0{i + 1}</span>
              {title}
              <Arrow />
            </a>
          ))}
        </nav>
        <a
          href="https://www.instagram.com/yulaversestudio/"
          target="_blank"
          rel="noopener noreferrer"
        >
          @yulaversestudio ↗
        </a>
      </dialog>
    </div>
  );
}
