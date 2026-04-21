/**
 * GenAI Mentor — Certifications section (React variant).
 *
 * Drop-in React component. Import the sibling `certification.css` once
 * (e.g. in your global stylesheet or as a CSS Module alias). All class
 * names are `gm-` prefixed and self-contained — no external UI lib needed.
 *
 *   import CertificationSection from "./CertificationSection";
 *   import "./certification.css";
 *
 *   <CertificationSection />
 */

import React from "react";

const ARCHITECT_DOMAINS = [
  { weight: "27%", label: "Agentic Architecture & Orchestration" },
  { weight: "20%", label: "Claude Code Configuration & Workflows" },
  { weight: "20%", label: "Prompt Engineering & Structured Output" },
  { weight: "18%", label: "Tool Design & MCP Integration" },
  { weight: "15%", label: "Context Management & Reliability" },
];

const ARCHITECT_OUTCOMES = [
  <>Build correct agentic loops with <code>stop_reason</code></>,
  <>Design coordinator–subagent multi-agent systems</>,
  <>Write MCP tools with structured error responses</>,
  <>Configure CLAUDE.md, <code>.claude/rules/</code>, and skills</>,
  <>Extract structured data with JSON schemas + retries</>,
  <>Manage context and provenance across long sessions</>,
];

const HOW_IT_WORKS = [
  { num: 1, title: "Learn the domain", text: "Short, focused videos mapped 1:1 to each exam task statement." },
  { num: 2, title: "Build the lab", text: "Every module ends with a hands-on project you can commit to GitHub." },
  { num: 3, title: "Rehearse with mocks", text: "Sit a 60-question mock built in the same format as the real exam." },
  { num: 4, title: "Pass & ship", text: "Walk into the exam confident — and have a portfolio to show for it." },
];

export default function CertificationSection() {
  return (
    <section className="gm-certs" id="certifications">
      <div className="gm-certs__container">
        <header className="gm-certs__header">
          <h2>
            Professional <span className="gm-certs__accent">Certifications</span>
          </h2>
          <p>
            Go beyond tutorials. Earn industry-recognized credentials — on a
            structured, scenario-based path built around the official exam guides.
          </p>
        </header>

        <div className="gm-certs__grid">
          <ArchitectCard />
          <RoadmapCard />
        </div>

        <div className="gm-certs__howto">
          <h3>How our certification prep works</h3>
          <div className="gm-certs__howto-grid">
            {HOW_IT_WORKS.map((s) => (
              <div className="gm-howto-step" key={s.num}>
                <div className="gm-howto-step__num">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectCard() {
  return (
    <article className="gm-cert-card gm-cert-card--architect">
      <div className="gm-cert-card__badge">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2l2.4 6.9H22l-6.1 4.4 2.3 7.1L12 16l-6.2 4.4 2.3-7.1L2 8.9h7.6z"
          />
        </svg>
        <span>Architect · Foundations</span>
      </div>

      <h3 className="gm-cert-card__title">Claude Certified Architect</h3>
      <p className="gm-cert-card__subtitle">
        Anthropic's official certification for solution architects building
        production applications with Claude.
      </p>

      <div className="gm-cert-card__meta">
        <Meta label="Format" value="Scenario MCQ" />
        <Meta label="Pass score" value="720 / 1000" />
        <Meta label="Series" value="~38 videos" />
        <Meta label="Time" value="~12 hrs" />
      </div>

      <div className="gm-cert-card__domains">
        <p className="gm-cert-card__section-title">Exam domains</p>
        <ul>
          {ARCHITECT_DOMAINS.map((d) => (
            <li key={d.label}>
              <span className="gm-weight">{d.weight}</span>
              {d.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="gm-cert-card__learn">
        <p className="gm-cert-card__section-title">What you'll master</p>
        <ul className="gm-cert-card__checks">
          {ARCHITECT_OUTCOMES.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </div>

      <div className="gm-cert-card__actions">
        <a className="gm-btn gm-btn--primary" href="/certifications/claude-architect/">
          Start the series
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M7.3 4.3l5 5.7-5 5.7 1.4 1.3 6.3-7-6.3-7z" />
          </svg>
        </a>
        <a
          className="gm-btn gm-btn--ghost"
          href="https://claudecertifications.com/claude-certified-architect/exam-guide"
          target="_blank"
          rel="noopener noreferrer"
        >
          Official exam guide
        </a>
      </div>
    </article>
  );
}

function RoadmapCard() {
  return (
    <article className="gm-cert-card gm-cert-card--roadmap">
      <div className="gm-cert-card__badge gm-cert-card__badge--muted">
        <span>Coming soon</span>
      </div>
      <h3 className="gm-cert-card__title">More certifications on the way</h3>
      <p className="gm-cert-card__subtitle">
        We're preparing structured learning paths for additional Anthropic,
        MCP, and GenAI credentials. Subscribe to get notified the day a new
        path launches.
      </p>
      <ul className="gm-cert-card__roadmap">
        <li>Claude Certified Developer</li>
        <li>MCP Server Design</li>
        <li>Agent SDK · Advanced</li>
      </ul>
      <a
        className="gm-btn gm-btn--ghost"
        href="https://www.youtube.com/@genai.mentor?sub_confirmation=1"
        target="_blank"
        rel="noopener noreferrer"
      >
        Notify me on YouTube
      </a>
    </article>
  );
}

function Meta({ label, value }) {
  return (
    <div className="gm-cert-card__meta-item">
      <span className="gm-cert-card__meta-label">{label}</span>
      <span className="gm-cert-card__meta-value">{value}</span>
    </div>
  );
}
