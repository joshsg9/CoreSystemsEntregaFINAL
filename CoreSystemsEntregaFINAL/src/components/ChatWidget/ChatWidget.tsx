// src/components/ChatWidget/ChatWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import type { Conversation } from '../../context/ChatContext';
import styles from './ChatWidget.module.css';

/**
 * Widget de chat para BUYERS. Dos modos:
 *
 * MODO DIRECTO  — con storeId + storeName: abre esa tienda directamente.
 * MODO LISTA    — sin props (AppLayout global): muestra conversaciones
 *                 existentes + lista de tiendas para iniciar una nueva.
 */
interface ChatWidgetProps {
  storeId?: string;
  storeName?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ storeId, storeName }) => {
  const {
    conversations,
    conversationsLoading,
    messages,
    messagesLoading,
    totalUnread,
    activeConversationId,
    availableStores,
    storesLoading,
    openConversation,
    openOrCreateConversation,
    sendMessage,
    closeConversation,
  } = useChat();

  const isDirect = Boolean(storeId && storeName);

  type View = 'list' | 'stores' | 'chat';
  const [view, setView]               = useState<View>(isDirect ? 'chat' : 'list');
  const [isOpen, setIsOpen]           = useState(false);
  const [inputValue, setInputValue]   = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConv, setActiveConv]   = useState<Conversation | null>(null);
  // nombre de la tienda cuando se inicia desde la lista de tiendas
  const [pendingStoreName, setPendingStoreName] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Modo directo: conectar al abrir
  useEffect(() => {
    if (!isOpen || !isDirect) return;
    if (!activeConversationId) {
      setIsConnecting(true);
      openOrCreateConversation(storeId!).finally(() => setIsConnecting(false));
    }
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }, 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && view === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Seleccionar conversación existente
  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setPendingStoreName(conv.other_name);
    await openConversation(conv.id);
    setView('chat');
  };

  // Iniciar nueva conversación desde lista de tiendas
  const handleSelectStore = async (sid: string, sName: string) => {
    setPendingStoreName(sName);
    setActiveConv(null);
    setIsConnecting(true);
    setView('chat');
    await openOrCreateConversation(sid).finally(() => setIsConnecting(false));
  };

  const handleBack = () => {
    closeConversation();
    setActiveConv(null);
    setPendingStoreName('');
    setView('list');
  };

  const handleClose = () => {
    setIsOpen(false);
    closeConversation();
    if (!isDirect) {
      setView('list');
      setActiveConv(null);
      setPendingStoreName('');
    }
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
    if (diff < 60_000)     return 'just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  };

  // Nombre a mostrar en el header del chat
  const displayName = isDirect
    ? storeName!
    : pendingStoreName || activeConv?.other_name || 'Store';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className={styles.widgetRoot}>
      {isOpen && (
        <div className={styles.chatWindow}>

          {/* ── LIST VIEW ────────────────────────────────────────────── */}
          {!isDirect && view === 'list' && (
            <>
              <div className={styles.chatHeader}>
                <span className={styles.headerName}>My Messages</span>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.conversationList}>
                {conversationsLoading ? (
                  <div className={styles.loadingMsg}>Loading…</div>
                ) : (
                  <>
                    {/* Conversaciones existentes */}
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        className={styles.convItem}
                        onClick={() => handleSelectConversation(conv)}
                      >
                        <div className={styles.convAvatar}>
                          {conv.other_name.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.convInfo}>
                          <span className={styles.convName}>{conv.other_name}</span>
                          <span className={styles.convTime}>{formatRelative(conv.last_message_at)}</span>
                        </div>
                        {conv.buyer_unread > 0 && (
                          <span className={styles.convBadge}>{conv.buyer_unread}</span>
                        )}
                      </button>
                    ))}

                    {/* Botón para ver tiendas disponibles */}
                    <button
                      className={styles.newChatBtn}
                      onClick={() => setView('stores')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      New conversation
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── STORES VIEW ──────────────────────────────────────────── */}
          {!isDirect && view === 'stores' && (
            <>
              <div className={styles.chatHeader}>
                <button className={styles.backBtn} onClick={() => setView('list')} aria-label="Back">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span className={styles.headerName}>Contact a Store</span>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.conversationList}>
                {storesLoading ? (
                  <div className={styles.loadingMsg}>Loading stores…</div>
                ) : availableStores.length === 0 ? (
                  <div className={styles.emptyMsg}>
                    <p>No stores available</p>
                  </div>
                ) : (
                  availableStores.map(store => (
                    <button
                      key={store.id}
                      className={styles.convItem}
                      onClick={() => handleSelectStore(store.id, store.store_name)}
                    >
                      <div className={styles.convAvatar}>
                        {store.store_name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.convInfo}>
                        <span className={styles.convName}>{store.store_name}</span>
                        <span className={styles.convTime}>Tap to chat</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ opacity: 0.4 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* ── CHAT VIEW ────────────────────────────────────────────── */}
          {(isDirect || view === 'chat') && (
            <>
              <div className={styles.chatHeader}>
                {!isDirect && (
                  <button className={styles.backBtn} onClick={handleBack} aria-label="Back">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                )}
                <div className={styles.headerLeft}>
                  <div className={styles.sellerAvatar}>{displayInitial}</div>
                  <div className={styles.headerInfo}>
                    <span className={styles.headerName}>{displayName}</span>
                    <span className={styles.headerStatus}>
                      <span className={styles.onlineDot} /> Online
                    </span>
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Close chat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className={styles.messages}>
                {(isConnecting || messagesLoading) && (
                  <div className={styles.loadingMsg}>Connecting…</div>
                )}
                {!isConnecting && !messagesLoading && messages.length === 0 && (
                  <div className={styles.loadingMsg}>
                    Send a message to start the conversation!
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${msg.sender === 'buyer' ? styles.messageRowBuyer : styles.messageRowSeller}`}
                  >
                    {msg.sender === 'seller' && (
                      <div className={styles.msgAvatar}>{displayInitial}</div>
                    )}
                    <div className={styles.messageWrap}>
                      <div className={`${styles.bubble} ${msg.sender === 'buyer' ? styles.bubbleBuyer : styles.bubbleSeller}`}>
                        {msg.text}
                      </div>
                      <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.chatInput}>
                <input
                  ref={inputRef}
                  className={styles.textInput}
                  type="text"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isConnecting || messagesLoading}
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isConnecting}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </>
          )}

        </div>
      )}

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isDirect ? 'Chat with seller' : 'My messages'}
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
            <span className={styles.fabLabel}>
              {isDirect ? 'Chat with us' : 'Messages'}
            </span>
          </>
        )}
        {!isOpen && totalUnread > 0 && (
          <span className={styles.fabBadge}>{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;