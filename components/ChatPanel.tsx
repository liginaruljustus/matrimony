"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";

type Props = {
  initialConvId?: string;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ photo, image, name, size = 10 }: { photo?: string | null; image?: string | null; name: string; size?: number }) {
  const src = photo ?? image ?? null;
  const cls = `h-${size} w-${size} shrink-0 rounded-full object-cover`;
  if (src) return <img src={src} alt={name} className={cls} />;
  return (
    <div className={`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full bg-[#fff9ef] text-base`}>
      👤
    </div>
  );
}

export function ChatPanel({ initialConvId }: Props) {
  const { data: session } = useSession();
  const myId = session?.user?.id ?? "";

  const conversations = useChatStore((s) => s.conversations);
  const activeChat = useChatStore((s) => s.activeChat);
  const messagesByConversation = useChatStore((s) => s.messages);
  const setConversations = useChatStore((s) => s.setConversations);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const setMessages = useChatStore((s) => s.setMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation list on mount
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/chat");
      const data = await res.json();
      const convs = data.conversations ?? [];
      setConversations(convs);
      const target = initialConvId ?? convs[0]?.id ?? null;
      if (target) {
        setActiveChat(target);
        if (initialConvId) setMobileShowChat(true);
      }
    };
    void load();
  }, [setConversations, setActiveChat, initialConvId]);

  // Fetch messages — called on mount and on 5s poll
  const loadMessages = useCallback(
    async (convId: string) => {
      const res = await fetch(`/api/chat?conversationId=${convId}`);
      const data = await res.json();
      setMessages(convId, data.messages ?? []);
    },
    [setMessages],
  );

  useEffect(() => {
    if (!activeChat) return;
    void loadMessages(activeChat);
    const interval = setInterval(() => void loadMessages(activeChat), 5000);
    return () => clearInterval(interval);
  }, [activeChat, loadMessages]);

  // Auto-scroll to latest message
  const activeMessages = activeChat ? (messagesByConversation[activeChat] ?? []) : [];
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  const activeConversation = conversations.find((c) => c.id === activeChat) ?? null;

  const selectConversation = (id: string) => {
    setActiveChat(id);
    setMobileShowChat(true);
  };

  const onSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = body.trim();
    if (!activeChat || !text || sending) return;
    setSending(true);
    setBody("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeChat, body: text }),
    });
    const data = await res.json();
    if (data.message) {
      const msg = {
        id: String(data.message._id),
        conversationId: activeChat,
        senderId: myId,
        senderName: session?.user?.name ?? "You",
        body: text,
        createdAt: String(data.message.createdAt ?? new Date().toISOString()),
      };
      sendMessage(msg);
      updateLastMessage(activeChat, { body: text, createdAt: msg.createdAt, isOwn: true });
    }
    setSending(false);
    textareaRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      {/* ── Sidebar ── */}
      <aside
        className={`flex w-full flex-col border-r border-slate-100 md:w-72 md:flex ${mobileShowChat ? "hidden" : "flex"}`}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#7a1f2b]">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
              <span className="text-4xl">💬</span>
              <p className="text-sm font-semibold text-slate-600">No conversations yet</p>
              <p className="text-xs text-slate-400">Accept an interest to start chatting</p>
              <Link
                href="/matches"
                className="mt-1 rounded-xl bg-[#7a1f2b] px-4 py-2 text-xs font-semibold text-white"
              >
                Go to Matches
              </Link>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeChat === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${isActive ? "bg-[#fff9ef]" : ""}`}
                >
                  <Avatar photo={conv.otherUser.photo} image={conv.otherUser.image} name={conv.otherUser.name} size={10} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${isActive ? "text-[#7a1f2b]" : "text-slate-800"}`}>
                      {conv.otherUser.name}
                    </p>
                    {conv.lastMessage ? (
                      <p className="truncate text-xs text-slate-400">
                        {conv.lastMessage.isOwn ? "You: " : ""}
                        {conv.lastMessage.body}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-300">No messages yet</p>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <span className="shrink-0 text-[10px] text-slate-300">
                      {formatTime(String(conv.lastMessage.createdAt))}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Message area ── */}
      <div className={`flex flex-1 flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button
                className="mr-1 text-sm font-medium text-[#7a1f2b] md:hidden"
                onClick={() => setMobileShowChat(false)}
              >
                ←
              </button>
              <Avatar
                photo={activeConversation.otherUser.photo}
                image={activeConversation.otherUser.image}
                name={activeConversation.otherUser.name}
                size={9}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{activeConversation.otherUser.name}</p>
                <Link
                  href={`/profiles/${activeConversation.otherUser.id}`}
                  className="text-xs text-slate-400 hover:text-[#7a1f2b] hover:underline"
                >
                  View profile →
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {activeMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <span className="text-4xl">👋</span>
                  <p className="text-sm font-semibold text-slate-600">
                    Say hello to {activeConversation.otherUser.name}!
                  </p>
                  <p className="text-xs text-slate-400">Be the first to send a message.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeMessages.map((msg, i) => {
                    const isOwn = msg.senderId === myId;
                    const prevMsg = activeMessages[i - 1];
                    const nextMsg = activeMessages[i + 1];
                    const isFirstInGroup = prevMsg?.senderId !== msg.senderId;
                    const isLastInGroup = nextMsg?.senderId !== msg.senderId;

                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`flex max-w-[72%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          {!isOwn && isFirstInGroup && (
                            <span className="mb-0.5 px-1 text-[10px] font-medium text-slate-400">
                              {msg.senderName}
                            </span>
                          )}
                          <div
                            className={`px-3 py-2 text-sm leading-relaxed ${
                              isOwn
                                ? `bg-[#7a1f2b] text-white ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-md"} ${isLastInGroup ? "rounded-bl-2xl rounded-br-sm" : "rounded-b-md"}`
                                : `bg-slate-100 text-slate-800 ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-md"} ${isLastInGroup ? "rounded-br-2xl rounded-bl-sm" : "rounded-b-md"}`
                            }`}
                          >
                            {msg.body}
                          </div>
                          {isLastInGroup && (
                            <span className={`mt-0.5 px-1 text-[10px] text-slate-300`}>
                              {formatTime(msg.createdAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={onSend}
              className="flex items-end gap-2 border-t border-slate-100 px-4 py-3"
            >
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Message... (Enter to send, Shift+Enter for newline)"
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-2 focus:ring-[#7a1f2b]/20"
                style={{ minHeight: "2.75rem", maxHeight: "6rem", overflowY: "auto" }}
              />
              <button
                type="submit"
                disabled={!body.trim() || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7a1f2b] text-white transition hover:bg-[#5e1720] disabled:opacity-40"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5 rotate-45" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </form>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl opacity-40">💍</span>
            <p className="text-sm font-semibold text-slate-600">Select a conversation</p>
            <p className="text-xs text-slate-400">Choose someone from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
