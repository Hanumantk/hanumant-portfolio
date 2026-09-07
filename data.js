/* =============================================================
   EDIT EVERYTHING HERE
   -------------------------------------------------------------
   This is the ONLY file you need to touch to update your site.
   Change your name, role, intro copy, footer, and projects below.
   The layout/design will update automatically.
   ============================================================= */

const SITE = {
  // ---- Hero / Introduction ---------------------------------
  name: "Hanumant",
  fullName: "Hanumant Kulkarni",
  role: "Interaction Designer",

  // Each string is one paragraph in the intro.
  intro: [
    "I design interactions that make digital experiences feel intuitive, clear, and engaging.",
    "I currently study Interaction Design at IIT&nbsp;Bombay.",
  ],

  // ---- Hero links (shown under the intro) ------------------
  // Rendered in two columns: `col: 1` on the left, `col: 2` on the right.
  // `icon` picks a built-in glyph: linkedin | behance | resume | arrow.
  // `accent: true` uses the green accent + underline; otherwise plain text.
  heroLinks: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/", icon: "linkedin", col: 1, accent: true },
    { label: "Behance",  href: "https://www.behance.net/hanumankulkarn1",                   icon: "behance",  col: 1, accent: true },
    { label: "Resume",   href: "resume.html",                                                icon: "resume",   col: 2, accent: true },
    { label: "About me", href: "#",                                                          icon: "arrow",    col: 2, accent: false },
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
      { label: "linkedin.com/in/hanumant-kulkarni", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/" },
      { label: "behance.net/hanumankulkarn1", href: "https://www.behance.net/hanumankulkarn1" },
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
   pinned    – true shows a small "pinned" badge (use for a featured one)
   ============================================================= */

const PROJECTS = [
  {
    title: "AI Clinical Scribe",
    category: "Interaction Design",
    link: "onetheracure.html",
    image: "assets/images/case-studies/ai-clinical-documentation/cover.jpg",
    pinned: true,
  },
  {
    title: "Insti App Redesign",
    category: "Interaction Design",
    link: "insti-app.html",
    image: "assets/images/case-studies/insti-app/cover.jpg",
  },
];
