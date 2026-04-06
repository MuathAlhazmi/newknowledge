export type ChatActionState = {
  ok: boolean;
  message: string;
  submittedAt: number;
};

export const CHAT_ACTION_IDLE: ChatActionState = {
  ok: true,
  message: "",
  submittedAt: 0,
};
