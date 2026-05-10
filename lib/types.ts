export type ZoomLevel = "day" | "week" | "month";

export type Designer = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type OooPeriod = {
  id: string;
  designerId: string;
  startDate: string;
  endDate: string;
  note?: string;
};

export type Domain = {
  id: string;
  name: string;
  sortOrder: number;
};

export type PhaseType = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
};

export type MilestoneType = {
  id: string;
  name: string;
  icon?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  note?: string;
  designerId: string;
  domainId: string;
  size: "S" | "M" | "L" | "XL" | "TBD";
  status: "active" | "paused" | "done";
  prdUrl?: string;
  deadline?: string;
  createdAt: string;
  sortOrder: number;
};

export type PhaseBlock = {
  id: string;
  projectId: string;
  phaseTypeId: string;
  startDate: string;
  endDate: string;
  note?: string;
  sortOrder: number;
};

export type Milestone = {
  id: string;
  projectId: string;
  milestoneTypeId?: string;
  customLabel?: string;
  date: string;
  note?: string;
};

export type ActivityLogEntry = {
  id: string;
  timestamp: Date;
  action: "created" | "updated" | "deleted" | "moved" | "reordered";
  entityType: "project" | "phase" | "milestone" | "ooo" | "phaseType" | "milestoneType";
  entityName: string;
  details: string;
  userName: string;
};
