"use client";

import { create } from "zustand";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  updatedAt: string;
  otherUser: {
    id: string;
    name: string;
    image: string | null;
    photo: string | null;
  };
  lastMessage: {
    body: string;
    createdAt: string;
    isOwn: boolean;
  } | null;
};

type ChatState = {
  conversations: Conversation[];
  activeChat: string | null;
  messages: Record<string, ChatMessage[]>;
  setActiveChat: (chatId: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  sendMessage: (message: ChatMessage) => void;
  receiveMessage: (message: ChatMessage) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  updateLastMessage: (conversationId: string, lastMessage: Conversation["lastMessage"]) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeChat: null,
  messages: {},
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  setConversations: (conversations) => set({ conversations }),
  sendMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: [...(state.messages[message.conversationId] ?? []), message],
      },
    })),
  receiveMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: [...(state.messages[message.conversationId] ?? []), message],
      },
    })),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  updateLastMessage: (conversationId, lastMessage) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, lastMessage } : c,
      ),
    })),
}));
