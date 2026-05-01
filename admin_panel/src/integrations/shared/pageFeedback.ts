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
  createdAt: string;
};

export type PageFeedbackThread = {
  id: string;
  pagePath: string;
  pageTitle: string | null;
  subject: string;
  status: PageFeedbackStatus;
  priority: PageFeedbackPriority;
  createdByUserId: string | null;
  assignedToUserId: string | null;
  lastCommentAt: string;
  createdAt: string;
  updatedAt: string;
  comments: PageFeedbackComment[];
};

export type PageFeedbackListResponse = {
  items: PageFeedbackThread[];
  total: number;
};

export type CreatePageFeedbackBody = {
  pagePath: string;
  pageTitle?: string;
  subject: string;
  body: string;
  priority?: PageFeedbackPriority;
  messageType?: PageFeedbackMessageType;
  attachments?: PageFeedbackAttachment[];
};

export type CreatePageFeedbackCommentBody = {
  body: string;
  messageType?: PageFeedbackMessageType;
  attachments?: PageFeedbackAttachment[];
};

export type UpdatePageFeedbackBody = {
  status?: PageFeedbackStatus;
  priority?: PageFeedbackPriority;
  assignedToUserId?: string | null;
};
