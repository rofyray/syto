import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "naano";
  timestamp: string; // ISO string for serialization
}

interface NaanoState {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
}

export const useNaanoStore = create<NaanoState>()(
  persist(
    (set) => ({
      messages: [],

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastMessage: (content) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const updated = [...state.messages];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content,
          };
          return { messages: updated };
        }),

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "naano-chat",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
