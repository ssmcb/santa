export type Group = {
  id: string;
  name: string;
  date: string;
  place: string;
  budget: string;
  inviteId: string;
  isDrawn: boolean;
  invitationsSent: Array<{ email: string; sentAt: string }>;
};

export type Participant = {
  id: string;
  name: string;
  email: string;
  recipientId: string | null;
  assignmentEmailStatus: string;
};

export type InvitationSent = {
  email: string;
  sentAt: string;
};
