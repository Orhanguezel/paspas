export type PageFeedbackStatus = "open" | "needs_info" | "in_review" | "planned" | "resolved" | "closed";
export type PageFeedbackPriority = "low" | "normal" | "high" | "critical";
export type PageFeedbackMessageType = "report" | "comment" | "question" | "answer" | "solution" | "system";

export type PageFeedbackAttachment = {
  assetId: string;
  url: string;
  name: string;
  mime: string;
  size: number;
};

export type PageFeedbackComment = {
  id: string;
  threadId: string;
  messageType: PageFeedbackMessageType;
  body: string;
  attachments: PageFeedbackAttachment[];
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type PageFeedbackThread = {
  id: string;
  pagePath: string;
  pageTitle: string | null;
  sourceApp: "paspas" | "promats-web";
  subject: string;
  status: PageFeedbackStatus;
  priority: PageFeedbackPriority;
  createdByUserId: string | null;
  assignedToUserId: string | null;
  createdByName: string | null;
  lastCommentAt: string;
  createdAt: string;
  updatedAt: string;
  comments: PageFeedbackComment[];
  nextAction?: { party: 'biz' | 'talep_sahibi' | 'baska' | 'kimse'; workPhase: 'ongoing' | 'approval' | null; expectedAction: string | null; changedAt: string } | null;
  release?: { state: 'deployed' | 'not_deployed' | 'withdrawn'; evidence: string; changedAt: string } | null;
  watcherCount?: number;
};

export type PageFeedbackListResponse = {
  items: PageFeedbackThread[];
  total: number;
};

export type CreatePageFeedbackBody = {
  pagePath: string;
  pageTitle?: string;
  sourceApp?: "paspas" | "promats-web";
  subject: string;
  body: string;
  priority?: PageFeedbackPriority;
  messageType?: PageFeedbackMessageType;
  attachments?: PageFeedbackAttachment[];
};

export type CreatePageFeedbackCommentBody = {
  body: string;
  messageType?: PageFeedbackMessageType;
  authorName?: 'Aktif360';
  attachments?: PageFeedbackAttachment[];
};

export type UpdatePageFeedbackBody = {
  status?: PageFeedbackStatus;
  priority?: PageFeedbackPriority;
  assignedToUserId?: string | null;
};
