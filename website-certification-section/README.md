# GenAI Mentor — Certifications section

Drop-in **Certifications** section for [genai-mentor.ai](https://www.genai-mentor.ai/). Matches the existing dark-theme, gradient-border card style used on the homepage ("Start Your AI Journey").

Ships in two flavours — pick whichever matches your site:

| File | Use when |
|---|---|
| `certification.html` + `certification.css` | Your site is static HTML, Astro, Next.js with `dangerouslySetInnerHTML`, WordPress, or any plain template engine. |
| `CertificationSection.jsx` + `certification.css` | Your site is React / Next.js / Gatsby / Remix. |

Both variants render the identical DOM and use the same CSS.

## Preview

The section includes:

- **Header** — "Professional Certifications" with gradient accent.
- **Claude Certified Architect card** — badge, meta grid (format / pass score / videos / time), exam domain list with weightings, "What you'll master" checklist, primary + ghost CTAs. Links to `/certifications/claude-architect/` and the [official exam guide](https://claudecertifications.com/claude-certified-architect/exam-guide).
- **Roadmap card** — "Coming soon" placeholder for Developer / MCP / Agent SDK certs.
- **How it works** — 4-step block (Learn · Build · Rehearse · Pass).

## Embedding — static / HTML

```html
<link rel="stylesheet" href="/assets/certification.css" />
<!-- paste certification.html here, or include via your template engine -->
```

Place the section wherever you like. It's full-width and uses its own dark background (`--gm-bg: #0a0a0f`) so it works as either a standalone section between lighter ones, or directly on your existing dark layout.

## Embedding — React / Next.js

```jsx
import CertificationSection from "@/components/CertificationSection";
import "@/components/certification.css";

export default function Home() {
  return (
    <>
      {/* ...hero, existing sections... */}
      <CertificationSection />
      {/* ...footer... */}
    </>
  );
}
```

## Customising

Everything theme-related lives in CSS custom properties at the top of `certification.css`:

```css
:root {
  --gm-bg: #0a0a0f;
  --gm-surface: #11111a;
  --gm-surface-2: #161622;
  --gm-text: #f5f5f7;
  --gm-text-dim: #9aa0b4;
  --gm-architect-from: #8b5cf6;  /* purple */
  --gm-architect-to:   #2dd4bf;  /* teal */
}
```

Want the architect card to use the orange-gradient used for your Advanced path? Change `--gm-architect-from` / `--gm-architect-to` to your orange values.

## Content to keep fresh

Numbers and copy that will drift over time — update these in one place:

| Where | What |
|---|---|
| `certification.html` / `CertificationSection.jsx` — meta grid | `~38 videos`, `~12 hrs`, `720 / 1000` pass score |
| Exam domain list | Weightings match the official guide (v0.1, Feb 10 2025). Re-verify before each launch. |
| CTA link | `/certifications/claude-architect/` — create this page when the first video ships. |

## Accessibility notes

- All icons are `aria-hidden="true"`; the visible label carries the meaning.
- Button contrast meets WCAG AA against the dark surface.
- External links (official exam guide, YouTube) use `target="_blank" rel="noopener noreferrer"`.

## License

MIT. Attribution appreciated but not required.
