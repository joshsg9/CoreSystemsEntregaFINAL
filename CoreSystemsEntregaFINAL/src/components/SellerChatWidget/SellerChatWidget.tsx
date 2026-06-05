// src/components/SellerChatWidget/SellerChatWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import type { Conversation } from '../../context/ChatContext';
import styles from './SellerChatWidget.module.css';

const SellerChatWidget: React.FC = () => {
  const {
    conversations,
    conversationsLoading,
    messages,
    messagesLoading,
    totalUnread,
    openConversation,
    sendMessage,
    closeConversation,
  } = useChat();

  const [view, setView]             = useState<'list' | 'chat'>('list');
  const [isOpen, setIsOpen]         = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, view]);

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    await openConversation(conv.id);
    setView('chat');
  };

  const handleBack = () => {
    closeConversation();
    setActiveConv(null);
    setView('list');
  };

  const handleClose = () => {
    setIsOpen(false);
    closeConversation();
    setView('list');
    setActiveConv(null);
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatRelative = (iso: string | null) => {
    if (!iso) return '';
    const d    = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000)    return 'just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  };

  const buyerInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className={styles.widgetRoot}>
      {isOpen && (
        <div className={styles.chatWindow}>

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              <div className={styles.chatHeader}>
                <span className={styles.headerName}>Customer Messages</span>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.conversationList}>
                {conversationsLoading && (
                  <div className={styles.loadingMsg}>Loading conversations…</div>
                )}
                {!conversationsLoading && conversations.length === 0 && (
                  <div className={styles.emptyMsg}>No conversations yet</div>
                )}
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    className={styles.convItem}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className={styles.convAvatar}>
                      {buyerInitial(conv.other_name)}
                    </div>
                    <div className={styles.convInfo}>
                      <span className={styles.convName}>{conv.other_name}</span>
                      <span className={styles.convTime}>
                        {conv.other_email
                          ? `${conv.other_email} · ${formatRelative(conv.last_message_at)}`
                          : formatRelative(conv.last_message_at)}
                      </span>
                    </div>
                    {conv.seller_unread > 0 && (
                      <span className={styles.convBadge}>{conv.seller_unread}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── CHAT VIEW ── */}
          {view === 'chat' && (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div className={styles.headerLeft}>
                  <div className={styles.buyerAvatar}>
                    {buyerInitial(activeConv?.other_name ?? 'C')}
                  </div>
                  <div className={styles.headerInfo}>
                    <span className={styles.headerName}>
                      {activeConv?.other_name ?? 'Customer'}
                    </span>
                    <span className={styles.headerStatus}>
                      {activeConv?.other_email
                        ? activeConv.other_email
                        : <><span className={styles.onlineDot} /> Active now</>}
                    </span>
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.messages}>
                {messagesLoading && (
                  <div className={styles.loadingMsg}>Loading…</div>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <div className={styles.loadingMsg}>No messages yet</div>
                )}
                {messages.map(msg => {
                  const isMe = msg.sender === 'seller';
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowOther}`}
                    >
                      {!isMe && (
                        <div className={styles.msgAvatar}>
                          {buyerInitial(activeConv?.other_name ?? 'C')}
                        </div>
                      )}
                      <div className={styles.messageWrap}>
                        <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleOther}`}>
                          {msg.text}
                        </div>
                        <div className={`${styles.msgMeta} ${isMe ? styles.msgMetaRight : ''}`}>
                          <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                        </div>
                      </div>
                      {isMe && (
                        <div className={styles.msgAvatar}>S</div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.chatInput}>
                <input
                  ref={inputRef}
                  className={styles.textInput}
                  type="text"
                  placeholder="Reply to customer…"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={messagesLoading}
                />
                <div className={styles.inputActions}>
                  <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    aria-label="Send"
                    disabled={!inputValue.trim() || messagesLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* ── FAB ── */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Customer messages"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className={styles.fabLabel}>Messages</span>
          </>
        )}
        {!isOpen && totalUnread > 0 && (
          <span className={styles.fabBadge}>{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>
    </div>
  );
};

export default SellerChatWidget;