export type PadletRecipeBoardStatus = "in_progress" | "success" | "failed";

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
  instructions?: string;
  topic?: string;
  role?: string;
  workspaceId?: string;
  wait?: boolean;
}

export interface PadletCreateBoardResponse {
  statusKey: string;
  status: PadletRecipeBoardStatus;
  board?: PadletBoardSummary;
}

export interface PadletPostInput {
  subject?: string;
  body?: string;
  attachmentUrl?: string;
  attachmentCaption?: string;
  color?: "red" | "orange" | "green" | "blue" | "purple";
}

export interface PadletPostSummary {
  id: string;
  subject: string;
  body: string;
}
