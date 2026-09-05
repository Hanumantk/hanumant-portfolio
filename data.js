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

  // ---- Index label -----------------------------------------
  // Only one category, exactly as requested.
  indexLabel: "Index",
  category: "Projects",

  // ---- Footer ----------------------------------------------
  footer: {
    // Small tagline line: a place on the left, a short quip on the right.
    place: "Made in Mumbai, India",
    quip: "Sweating the details, one screen at a time",
    // Centered social links. Leave the array empty ([]) to hide them,
    // or edit the href/label to your real profiles.
    links: [
      { label: "linkedin.com/in/hanumant-kulkarni", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/" },
      // NOTE: the "Behance" URL you sent was actually a LinkedIn link, so this
      // points to your Behance handle as a placeholder — swap in your real
      // Behance profile URL here.
      { label: "behance.net/hanumant", href: "https://www.behance.net/" },
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
   ratio     – thumbnail height / width. 1.32 ≈ portrait, 0.7 ≈ wide.
   pinned    – true shows a small "pinned" badge (use for a featured one)
   ============================================================= */

const PROJECTS = [
  {
    title: "One Theracure — AI Clinical Scribe",
    category: "Interaction Design",
    link: "#",
    ratio: 1.32,
    pinned: true,
  },
  {
    title: "Project Two",
    category: "Product Design",
    link: "#",
    ratio: 0.78,
  },
  {
    title: "Project Three",
    category: "Prototyping",
    link: "#",
    ratio: 1.2,
  },
  {
    title: "Project Four",
    category: "Design Systems",
    link: "#",
    ratio: 0.92,
  },
  {
    title: "Project Five",
    category: "Motion & Interaction",
    link: "#",
    ratio: 1.28,
  },
];
