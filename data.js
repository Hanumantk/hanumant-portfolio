/* =============================================================
   EDIT EVERYTHING HERE
   -------------------------------------------------------------
   Use this file for routine homepage content changes. Keep the static
   fallback in index.html in sync when public copy or links change.
   ============================================================= */

const SITE = {
  // ---- Hero / Introduction ---------------------------------
  name: "Hanumant",
  fullName: "Hanumant Kulkarni",
  role: "Interaction Designer",

  // Each string is one paragraph in the intro.
  intro: [
    "I turn complex workflows into clear interaction systems across healthcare and campus products.",
    "I currently study Interaction Design at IIT&nbsp;Bombay.",
  ],

  // ---- Hero links (shown under the intro) ------------------
  // Rendered in two columns: `col: 1` on the left, `col: 2` on the right.
  // `icon` picks a built-in glyph: linkedin | behance | resume | arrow.
  // `accent: true` uses the cobalt accent + underline; otherwise plain text.
  heroLinks: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/", icon: "linkedin", col: 1, accent: true },
    { label: "Behance",  href: "https://www.behance.net/hanumankulkarn1",                   icon: "behance",  col: 1, accent: true },
    { label: "Resume",   href: "resume.html",                                                icon: "resume",   col: 2, accent: true },
  ],

  // ---- Index label -----------------------------------------
  // Only one category, exactly as requested.
  indexLabel: "Index",
  category: "Projects",

  // ---- Footer ----------------------------------------------
  footer: {
    // Centered social links. Leave the array empty ([]) to hide them,
    // or edit the href/label to your real profiles.
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/" },
      { label: "Behance", href: "https://www.behance.net/hanumankulkarn1" },
    ],
    // The giant faint wordmark at the very bottom. Keep it short (one word
    // reads best); it renders as a soft watermark behind the links.
    mark: "Hanumant",
  },
};

/* =============================================================
   PROJECTS
   -------------------------------------------------------------
   title     – project name
   category  – short descriptor / discipline / tool
   link      – URL, or "#" for now
   image     – optional path to a thumbnail (e.g. "images/one.jpg").
               Leave it out to use a generated placeholder.
   number    – optional display index; falls back to its array position
   ============================================================= */

const PROJECTS = [
  {
    number: "01",
    title: "AI Clinical Scribe",
    category: "Interaction Design",
    link: "onetheracure.html",
    image: "assets/images/case-studies/ai-clinical-documentation/cover.jpg",
  },
  {
    number: "02",
    title: "Insti App Redesign",
    category: "Interaction Design",
    link: "insti-app.html",
    image: "assets/images/case-studies/insti-app/cover.jpg",
  },
];
