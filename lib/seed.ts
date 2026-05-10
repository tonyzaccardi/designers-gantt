import type {
  Designer,
  Domain,
  PhaseType,
  MilestoneType,
  Project,
  PhaseBlock,
  Milestone,
  OooPeriod,
} from "./types";

export const SEED_DESIGNERS: Designer[] = [
  { id: "d-anna",    name: "Anna",     avatarUrl: "/avatars/anna.jpg" },
  { id: "d-mariedo", name: "Marie-Do", avatarUrl: "/avatars/marie-do.jpg" },
  { id: "d-dom",     name: "Dom",      avatarUrl: "/avatars/dom.jpg" },
  { id: "d-jane",    name: "Jane",     avatarUrl: "/avatars/jane.jpg" },
  { id: "d-jessica", name: "Jessica",  avatarUrl: "/avatars/jessica.jpg" },
  { id: "d-raphael", name: "Raphaël",  avatarUrl: "/avatars/raphael.jpg" },
  { id: "d-anthony", name: "Anthony",  avatarUrl: "/avatars/anthony.jpg" },
];

export const SEED_DOMAINS: Domain[] = [
  { id: "dom-1", name: "Disclosure",                sortOrder: 1 },
  { id: "dom-2", name: "Core Experience",            sortOrder: 2 },
  { id: "dom-3", name: "Data Collection",            sortOrder: 3 },
  { id: "dom-4", name: "Supply Chain & Intelligence", sortOrder: 4 },
  { id: "dom-5", name: "Core Platform",              sortOrder: 5 },
  { id: "dom-6", name: "Act",                        sortOrder: 6 },
  { id: "dom-7", name: "Dashboard",                  sortOrder: 7 },
  { id: "dom-8", name: "AI",                         sortOrder: 8 },
  { id: "dom-9", name: "Design Ops",                 sortOrder: 9 },
];

// Domain → default designer mapping
export const DOMAIN_DEFAULT_DESIGNER: Record<string, string> = {
  "dom-1": "d-anna",     // Disclosure
  "dom-2": "d-mariedo",  // Core Experience
  "dom-3": "d-dom",      // Data Collection
  "dom-4": "d-jane",     // Supply Chain & Intelligence
  "dom-5": "d-jane",     // Core Platform
  "dom-6": "d-anthony",  // Act
  "dom-7": "d-anthony",  // Dashboard
  "dom-8": "d-raphael",  // AI
  "dom-9": "d-jessica",  // Design Ops
};

export const SEED_PHASE_TYPES: PhaseType[] = [
  { id: "pt-1", name: "Discovery research",    emoji: "🧶", color: "#8B5CF6", sortOrder: 1 },
  { id: "pt-2", name: "Design direction",      emoji: "💡", color: "#F59E0B", sortOrder: 2 },
  { id: "pt-3", name: "Validation research",   emoji: "💬", color: "#10B981", sortOrder: 3 },
  { id: "pt-4", name: "Design iteration",      emoji: "🖥️", color: "#3B82F6", sortOrder: 4 },
  { id: "pt-5", name: "Design specs",          emoji: "🎬", color: "#EF4444", sortOrder: 5 },
  { id: "pt-6", name: "Support implementation",emoji: "📚", color: "#6B7280", sortOrder: 6 },
];

export const SEED_MILESTONE_TYPES: MilestoneType[] = [
  { id: "mt-1", name: "Sync Leadership",    icon: "🔷" },
  { id: "mt-2", name: "Customer Interaction", icon: "💬" },
  { id: "mt-3", name: "Design Review",      icon: "🔍" },
  { id: "mt-4", name: "Dev Handoff",        icon: "🚀" },
  { id: "mt-5", name: "Go/No-Go",           icon: "🚦" },
  { id: "mt-6", name: "Custom",             icon: "◆" },
];

export const SEED_PROJECTS: Project[] = [
  // ── DISCLOSURE ───────────────────────────────────────────────────────────────
  { id: "proj-1",  name: "CSRD versioning",                               designerId: "d-anna",    domainId: "dom-1", size: "L",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-2",  name: "Custom ESG",                                    designerId: "d-anna",    domainId: "dom-1", size: "XL",  status: "active", createdAt: "2026-01-01" },
  { id: "proj-3",  name: "Sweepy scoring",                                designerId: "d-anna",    domainId: "dom-1", size: "TBD", status: "active", createdAt: "2026-01-01" },
  // ── CORE EXPERIENCE ──────────────────────────────────────────────────────────
  { id: "proj-4",  name: "EF mapping",                                    designerId: "d-mariedo", domainId: "dom-2", size: "XL",  status: "active", createdAt: "2026-01-01" },
  { id: "proj-5",  name: "Conversion unit",                               designerId: "d-mariedo", domainId: "dom-2", size: "M",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-6",  name: "Onboarding patterns",                           designerId: "d-anna",    domainId: "dom-2", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-7",  name: "EF versioning 2",                               designerId: "d-mariedo", domainId: "dom-2", size: "M",   status: "active", createdAt: "2026-01-01" },
  // ── DATA COLLECTION ──────────────────────────────────────────────────────────
  { id: "proj-8",  name: "Respondant XP: Data comparison + Sweepy suggestions", designerId: "d-dom", domainId: "dom-3", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-9",  name: "Respondant XP: Navigation",                    designerId: "d-dom",     domainId: "dom-3", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-10", name: "Reviewer XP",                                   designerId: "d-dom",     domainId: "dom-3", size: "TBD", status: "active", createdAt: "2026-01-01" },
  // ── SUPPLY CHAIN & INTELLIGENCE ──────────────────────────────────────────────
  { id: "proj-11", name: "PCF Campaigns",                                 designerId: "d-jane",    domainId: "dom-4", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-12", name: "Supplier sidepanel + intelligence",             designerId: "d-jane",    domainId: "dom-4", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-13", name: "Lightweight PCF calculator for suppliers",      designerId: "d-jane",    domainId: "dom-4", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-14", name: "Supply chain x Intelligence hub",               designerId: "d-jane",    domainId: "dom-4", size: "TBD", status: "active", createdAt: "2026-01-01" },
  // ── CORE PLATFORM ────────────────────────────────────────────────────────────
  { id: "proj-15", name: "UAT",                                           designerId: "d-jane",    domainId: "dom-5", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-16", name: "Data lock",                                     designerId: "d-jane",    domainId: "dom-5", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-17", name: "Extrapolations",                                designerId: "d-jane",    domainId: "dom-5", size: "TBD", status: "active", createdAt: "2026-01-01" },
  // ── ACT ──────────────────────────────────────────────────────────────────────
  { id: "proj-18", name: "Actions library",                               designerId: "d-anthony", domainId: "dom-6", size: "L",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-19", name: "Access Rights",                                 designerId: "d-anthony", domainId: "dom-6", size: "L",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-20", name: "Navigation",                                    designerId: "d-anthony", domainId: "dom-6", size: "L",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-21", name: "Export",                                        designerId: "d-anthony", domainId: "dom-6", size: "S",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-22", name: "Scaling",                                       designerId: "d-anthony", domainId: "dom-6", size: "M",   status: "active", createdAt: "2026-01-01" },
  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  { id: "proj-23", name: "Dashboards organization",                       designerId: "d-anthony", domainId: "dom-7", size: "S",   status: "active", createdAt: "2026-01-01" },
  { id: "proj-24", name: "Multi-track widgets",                           designerId: "d-anthony", domainId: "dom-7", size: "TBD", status: "active", createdAt: "2026-01-01" },
  // ── AI (empty) ───────────────────────────────────────────────────────────────
  // ── DESIGN OPS ───────────────────────────────────────────────────────────────
  { id: "proj-25", name: "Design system",                                 designerId: "d-jessica", domainId: "dom-9", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-26", name: "Accessibility",                                 designerId: "d-jessica", domainId: "dom-9", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-27", name: "Design principles",                             designerId: "d-jessica", domainId: "dom-9", size: "TBD", status: "active", createdAt: "2026-01-01" },
  { id: "proj-28", name: "Design patterns",                               designerId: "d-jessica", domainId: "dom-9", size: "TBD", status: "active", createdAt: "2026-01-01" },
];

export const SEED_PHASE_BLOCKS: PhaseBlock[] = [
  // ── proj-1 CSRD versioning ───────────────────────────────────────────────────
  { id: "pb-1",  projectId: "proj-1",  phaseTypeId: "pt-4", startDate: "2026-04-28", endDate: "2026-05-08", sortOrder: 1 },
  { id: "pb-2",  projectId: "proj-1",  phaseTypeId: "pt-2", startDate: "2026-05-11", endDate: "2026-05-22", sortOrder: 2 },
  { id: "pb-3",  projectId: "proj-1",  phaseTypeId: "pt-4", startDate: "2026-05-25", endDate: "2026-06-05", sortOrder: 3 },
  { id: "pb-4",  projectId: "proj-1",  phaseTypeId: "pt-3", startDate: "2026-06-08", endDate: "2026-06-19", sortOrder: 4 },
  { id: "pb-5",  projectId: "proj-1",  phaseTypeId: "pt-5", startDate: "2026-06-22", endDate: "2026-07-03", sortOrder: 5 },
  { id: "pb-6",  projectId: "proj-1",  phaseTypeId: "pt-6", startDate: "2026-07-06", endDate: "2026-07-17", sortOrder: 6 },
  // ── proj-2 Custom ESG ────────────────────────────────────────────────────────
  { id: "pb-7",  projectId: "proj-2",  phaseTypeId: "pt-1", startDate: "2026-05-04", endDate: "2026-05-22", sortOrder: 1 },
  { id: "pb-8",  projectId: "proj-2",  phaseTypeId: "pt-2", startDate: "2026-05-25", endDate: "2026-06-12", sortOrder: 2 },
  { id: "pb-9",  projectId: "proj-2",  phaseTypeId: "pt-3", startDate: "2026-06-15", endDate: "2026-06-26", sortOrder: 3 },
  { id: "pb-10", projectId: "proj-2",  phaseTypeId: "pt-4", startDate: "2026-06-29", endDate: "2026-07-17", sortOrder: 4 },
  { id: "pb-11", projectId: "proj-2",  phaseTypeId: "pt-5", startDate: "2026-07-20", endDate: "2026-07-31", sortOrder: 5 },
  { id: "pb-12", projectId: "proj-2",  phaseTypeId: "pt-6", startDate: "2026-08-03", endDate: "2026-08-21", sortOrder: 6 },
  // ── proj-3 Sweepy scoring ────────────────────────────────────────────────────
  { id: "pb-13", projectId: "proj-3",  phaseTypeId: "pt-1", startDate: "2026-07-20", endDate: "2026-08-07", sortOrder: 1 },
  { id: "pb-14", projectId: "proj-3",  phaseTypeId: "pt-2", startDate: "2026-08-10", endDate: "2026-08-21", sortOrder: 2 },
  // ── proj-4 EF mapping ────────────────────────────────────────────────────────
  { id: "pb-15", projectId: "proj-4",  phaseTypeId: "pt-6", startDate: "2026-04-28", endDate: "2026-05-08", sortOrder: 1 },
  { id: "pb-16", projectId: "proj-4",  phaseTypeId: "pt-1", startDate: "2026-05-11", endDate: "2026-05-29", sortOrder: 2 },
  { id: "pb-17", projectId: "proj-4",  phaseTypeId: "pt-2", startDate: "2026-06-01", endDate: "2026-06-19", sortOrder: 3 },
  { id: "pb-18", projectId: "proj-4",  phaseTypeId: "pt-3", startDate: "2026-06-22", endDate: "2026-07-03", sortOrder: 4 },
  { id: "pb-19", projectId: "proj-4",  phaseTypeId: "pt-4", startDate: "2026-07-06", endDate: "2026-07-24", sortOrder: 5 },
  { id: "pb-20", projectId: "proj-4",  phaseTypeId: "pt-5", startDate: "2026-07-27", endDate: "2026-08-07", sortOrder: 6 },
  { id: "pb-21", projectId: "proj-4",  phaseTypeId: "pt-6", startDate: "2026-08-10", endDate: "2026-08-21", sortOrder: 7 },
  // ── proj-5 Conversion unit ───────────────────────────────────────────────────
  { id: "pb-22", projectId: "proj-5",  phaseTypeId: "pt-2", startDate: "2026-05-04", endDate: "2026-05-15", sortOrder: 1 },
  { id: "pb-23", projectId: "proj-5",  phaseTypeId: "pt-3", startDate: "2026-05-18", endDate: "2026-05-29", sortOrder: 2 },
  { id: "pb-24", projectId: "proj-5",  phaseTypeId: "pt-4", startDate: "2026-06-01", endDate: "2026-06-12", sortOrder: 3 },
  { id: "pb-25", projectId: "proj-5",  phaseTypeId: "pt-5", startDate: "2026-06-15", endDate: "2026-06-26", sortOrder: 4 },
  // ── proj-6 Onboarding patterns ───────────────────────────────────────────────
  { id: "pb-26", projectId: "proj-6",  phaseTypeId: "pt-1", startDate: "2026-06-01", endDate: "2026-06-19", sortOrder: 1 },
  { id: "pb-27", projectId: "proj-6",  phaseTypeId: "pt-2", startDate: "2026-06-22", endDate: "2026-07-10", sortOrder: 2 },
  // ── proj-7 EF versioning 2 ───────────────────────────────────────────────────
  { id: "pb-28", projectId: "proj-7",  phaseTypeId: "pt-1", startDate: "2026-07-06", endDate: "2026-07-17", sortOrder: 1 },
  { id: "pb-29", projectId: "proj-7",  phaseTypeId: "pt-2", startDate: "2026-07-20", endDate: "2026-08-07", sortOrder: 2 },
  { id: "pb-30", projectId: "proj-7",  phaseTypeId: "pt-3", startDate: "2026-08-10", endDate: "2026-08-21", sortOrder: 3 },
  { id: "pb-31", projectId: "proj-7",  phaseTypeId: "pt-4", startDate: "2026-08-24", endDate: "2026-09-04", sortOrder: 4 },
  { id: "pb-32", projectId: "proj-7",  phaseTypeId: "pt-5", startDate: "2026-09-07", endDate: "2026-09-18", sortOrder: 5 },
  // ── proj-8 Respondant XP: Data comparison ────────────────────────────────────
  { id: "pb-33", projectId: "proj-8",  phaseTypeId: "pt-4", startDate: "2026-04-28", endDate: "2026-05-15", sortOrder: 1 },
  { id: "pb-34", projectId: "proj-8",  phaseTypeId: "pt-5", startDate: "2026-05-18", endDate: "2026-05-29", sortOrder: 2 },
  { id: "pb-35", projectId: "proj-8",  phaseTypeId: "pt-6", startDate: "2026-06-01", endDate: "2026-06-12", sortOrder: 3 },
  // ── proj-9 Respondant XP: Navigation ─────────────────────────────────────────
  { id: "pb-36", projectId: "proj-9",  phaseTypeId: "pt-2", startDate: "2026-06-01", endDate: "2026-06-19", sortOrder: 1 },
  { id: "pb-37", projectId: "proj-9",  phaseTypeId: "pt-3", startDate: "2026-06-22", endDate: "2026-07-03", sortOrder: 2 },
  // ── proj-10 Reviewer XP ──────────────────────────────────────────────────────
  { id: "pb-38", projectId: "proj-10", phaseTypeId: "pt-1", startDate: "2026-06-15", endDate: "2026-07-03", sortOrder: 1 },
  { id: "pb-39", projectId: "proj-10", phaseTypeId: "pt-2", startDate: "2026-07-06", endDate: "2026-07-24", sortOrder: 2 },
  // ── proj-11 PCF Campaigns ────────────────────────────────────────────────────
  { id: "pb-40", projectId: "proj-11", phaseTypeId: "pt-5", startDate: "2026-04-28", endDate: "2026-05-08", sortOrder: 1 },
  { id: "pb-41", projectId: "proj-11", phaseTypeId: "pt-6", startDate: "2026-05-11", endDate: "2026-05-29", sortOrder: 2 },
  // ── proj-12 Supplier sidepanel ───────────────────────────────────────────────
  { id: "pb-42", projectId: "proj-12", phaseTypeId: "pt-2", startDate: "2026-05-04", endDate: "2026-05-22", sortOrder: 1 },
  { id: "pb-43", projectId: "proj-12", phaseTypeId: "pt-6", startDate: "2026-05-25", endDate: "2026-06-05", sortOrder: 2 },
  // ── proj-13 Lightweight PCF calculator ───────────────────────────────────────
  { id: "pb-44", projectId: "proj-13", phaseTypeId: "pt-1", startDate: "2026-06-01", endDate: "2026-06-19", sortOrder: 1 },
  { id: "pb-45", projectId: "proj-13", phaseTypeId: "pt-2", startDate: "2026-06-22", endDate: "2026-07-10", sortOrder: 2 },
  // ── proj-14 Supply chain x Intelligence hub ───────────────────────────────────
  { id: "pb-46", projectId: "proj-14", phaseTypeId: "pt-1", startDate: "2026-07-06", endDate: "2026-07-24", sortOrder: 1 },
  // ── proj-15 UAT ──────────────────────────────────────────────────────────────
  { id: "pb-47", projectId: "proj-15", phaseTypeId: "pt-6", startDate: "2026-05-04", endDate: "2026-05-22", sortOrder: 1 },
  // ── proj-16 Data lock ────────────────────────────────────────────────────────
  { id: "pb-48", projectId: "proj-16", phaseTypeId: "pt-1", startDate: "2026-05-25", endDate: "2026-06-05", sortOrder: 1 },
  { id: "pb-49", projectId: "proj-16", phaseTypeId: "pt-2", startDate: "2026-06-08", endDate: "2026-06-19", sortOrder: 2 },
  // ── proj-17 Extrapolations ────────────────────────────────────────────────────
  { id: "pb-50", projectId: "proj-17", phaseTypeId: "pt-1", startDate: "2026-06-22", endDate: "2026-07-03", sortOrder: 1 },
  { id: "pb-51", projectId: "proj-17", phaseTypeId: "pt-2", startDate: "2026-07-06", endDate: "2026-07-17", sortOrder: 2 },
  // ── proj-18 Actions library ───────────────────────────────────────────────────
  { id: "pb-52", projectId: "proj-18", phaseTypeId: "pt-4", startDate: "2026-05-25", endDate: "2026-06-19", sortOrder: 1 },
  // ── proj-19 Access Rights ────────────────────────────────────────────────────
  { id: "pb-53", projectId: "proj-19", phaseTypeId: "pt-4", startDate: "2026-06-22", endDate: "2026-07-10", sortOrder: 1 },
  // ── proj-20 Navigation ───────────────────────────────────────────────────────
  { id: "pb-54", projectId: "proj-20", phaseTypeId: "pt-4", startDate: "2026-07-13", endDate: "2026-07-31", sortOrder: 1 },
  // ── proj-21 Export ────────────────────────────────────────────────────────────
  { id: "pb-55", projectId: "proj-21", phaseTypeId: "pt-4", startDate: "2026-08-03", endDate: "2026-08-14", sortOrder: 1 },
  // ── proj-22 Scaling ──────────────────────────────────────────────────────────
  { id: "pb-56", projectId: "proj-22", phaseTypeId: "pt-4", startDate: "2026-08-17", endDate: "2026-09-04", sortOrder: 1 },
  // ── proj-23 Dashboards organization ──────────────────────────────────────────
  { id: "pb-57", projectId: "proj-23", phaseTypeId: "pt-1", startDate: "2026-05-25", endDate: "2026-06-12", sortOrder: 1 },
  // proj-24 Multi-track widgets — no phases yet
  // proj-25–28 Design Ops — no phases yet
];

export const SEED_MILESTONES: Milestone[] = [
  { id: "ms-1", projectId: "proj-1",  milestoneTypeId: "mt-1", date: "2026-05-22", note: "Sync Leadership" },
  { id: "ms-2", projectId: "proj-4",  milestoneTypeId: "mt-1", date: "2026-06-19", note: "Sync Leadership" },
  { id: "ms-3", projectId: "proj-6",  milestoneTypeId: "mt-2", date: "2026-06-26", note: "Customer Interaction" },
  { id: "ms-4", projectId: "proj-11", milestoneTypeId: "mt-4", date: "2026-05-29", note: "Dev Handoff" },
];

export const SEED_OOO_PERIODS: OooPeriod[] = [
  { id: "ooo-1", designerId: "d-anna",    startDate: "2026-07-06", endDate: "2026-07-17", note: "Summer vacation" },
  { id: "ooo-2", designerId: "d-anna",    startDate: "2026-08-03", endDate: "2026-08-14", note: "Summer vacation" },
  { id: "ooo-3", designerId: "d-anthony", startDate: "2026-05-11", endDate: "2026-05-22", note: "OOO" },
];
