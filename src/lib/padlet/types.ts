import type { PadletBulletinColumnMode, PadletSandboxType } from "@/lib/padlet/presets";

export type PadletRecipeBoardStatus = "in_progress" | "success" | "failed";

export type PadletPostColor = "red" | "orange" | "green" | "blue" | "purple";

export interface PadletBoardWebUrl {
  live?: string;
  qrCode?: string;
  slideshow?: string;
  slideshowQrCode?: string;
}

export interface PadletBoardSummary {
  id: string;
  title: string;
  description: string;
  webUrl: string;
  qrCodeUrl: string;
  slideshowUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PadletCreateBoardRequest {
  mode: "sandbox" | "bulletin" | "custom";
  sandboxType?: PadletSandboxType;
  columnMode?: PadletBulletinColumnMode;
  instructions?: string;
  topic?: string;
  role?: string;
  workspaceId?: string;
  wait?: boolean;
  seedColumns?: boolean;
}

export interface PadletCreateBoardResponse {
  statusKey: string;
  status: PadletRecipeBoardStatus;
  board?: PadletBoardSummary;
  columnsApplied?: number;
  columnLabels?: string[];
}

export interface PadletPostInput {
  subject?: string;
  body?: string;
  attachmentUrl?: string;
  attachmentCaption?: string;
  color?: PadletPostColor;
  sectionId?: string;
}

export interface PadletPostSummary {
  id: string;
  subject: string;
  body: string;
}
