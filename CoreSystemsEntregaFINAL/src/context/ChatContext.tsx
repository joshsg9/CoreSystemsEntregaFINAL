// src/context/ChatContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export type SenderRole = 'buyer' | 'seller';

export interface ChatMessage {
  id: string;
  text: string;
  sender: SenderRole;
  senderName: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  seller_id: string;
  buyer_id: string;
  store_name: string;
  other_name: string;
  other_email: string;
  last_message_at: string | null;
  buyer_unread: number;
  seller_unread: number;
}

export interface Store {
  id: string;
  store_name: string;
}

interface ChatContextValue {
  conversations: Conversation[];
  conversationsLoading: boolean;
  activeConversationId: string | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  totalUnread: number;
  currentUserRole: SenderRole | null;
  availableStores: Store[];
  storesLoading: boolean;
  openConversation: (conversationId: string) => Promise<void>;
  openOrCreateConversation: (storeId: string) => Promise<string>;
  sendMessage: (text: string) => Promise<void>;
  closeConversation: () => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations]               = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages]                         = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading]           = useState(false);
  const [currentUserRole, setCurrentUserRole]           = useState<SenderRole | null>(null);
  const [currentUserId, setCurrentUserId]               = useState<string | null>(null);
  const [currentUserName, setCurrentUserName]           = useState<string>('');
  const [availableStores, setAvailableStores]           = useState<Store[]>([]);
  const [storesLoading, setStoresLoading]               = useState(false);

  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Cargar usuario y rol ──────────────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentUserRole(profile.role as SenderRole);
        setCurrentUserName(profile.full_name ?? 'User');
      }
    };

    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => subscription.unsubscribe();
  }, []);

  // ── Cargar conversaciones + tiendas cuando hay usuario ───────────────────
  useEffect(() => {
    if (!currentUserId || !currentUserRole) return;
    loadConversations();
    if (currentUserRole === 'buyer') loadAvailableStores();
  }, [currentUserId, currentUserRole]);

  // ── Tiendas disponibles (buyer) ───────────────────────────────────────────
  const loadAvailableStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, store_name')
        .order('store_name', { ascending: true });

      if (!error && data) {
        setAvailableStores(data as Store[]);
      }
    } finally {
      setStoresLoading(false);
    }
  }, []);

  // ── Conversaciones ────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!currentUserId || !currentUserRole) return;
    setConversationsLoading(true);

    try {
      if (currentUserRole === 'buyer') {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            seller_id,
            buyer_id,
            last_message_at,
            buyer_unread,
            seller_unread,
            stores!conversations_seller_id_fkey (store_name)
          `)
          .eq('buyer_id', currentUserId)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (!error && data) {
          setConversations(data.map((c: any) => ({
            id:              c.id,
            seller_id:       c.seller_id,
            buyer_id:        c.buyer_id,
            store_name:      c.stores?.store_name ?? 'Store',
            other_name:      c.stores?.store_name ?? 'Store',
            other_email:     '',
            last_message_at: c.last_message_at,
            buyer_unread:    c.buyer_unread,
            seller_unread:   c.seller_unread,
          })));
        }
      } else {
        const { data: store, error: storeErr } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', currentUserId)
          .single();

        if (storeErr || !store) return;

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            seller_id,
            buyer_id,
            last_message_at,
            buyer_unread,
            seller_unread,
            profiles!conversations_buyer_id_fkey (full_name, email)
          `)
          .eq('seller_id', store.id)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (!error && data) {
          setConversations(data.map((c: any) => ({
            id:              c.id,
            seller_id:       c.seller_id,
            buyer_id:        c.buyer_id,
            store_name:      '',
            other_name:      c.profiles?.full_name ?? 'Customer',
            other_email:     c.profiles?.email ?? '',
            last_message_at: c.last_message_at,
            buyer_unread:    c.buyer_unread,
            seller_unread:   c.seller_unread,
          })));
        }
      }
    } finally {
      setConversationsLoading(false);
    }
  }, [currentUserId, currentUserRole]);

  // ── Abrir conversación ────────────────────────────────────────────────────
  const openConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMessagesLoading(true);

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        text,
        sender_role,
        sender_id,
        created_at,
        profiles!messages_sender_id_fkey (full_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data.map((m: any) => ({
        id:         m.id,
        text:       m.text,
        sender:     m.sender_role as SenderRole,
        senderName: m.profiles?.full_name ?? m.sender_role,
        timestamp:  new Date(m.created_at),
      })));
    }

    setMessagesLoading(false);

    const unreadField = currentUserRole === 'buyer' ? 'buyer_unread' : 'seller_unread';
    await supabase
      .from('conversations')
      .update({ [unreadField]: 0 })
      .eq('id', conversationId);

    setConversations(prev => prev.map(c =>
      c.id === conversationId
        ? {
            ...c,
            buyer_unread:  currentUserRole === 'buyer'  ? 0 : c.buyer_unread,
            seller_unread: currentUserRole === 'seller' ? 0 : c.seller_unread,
          }
        : c
    ));

    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);

    realtimeRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const m = payload.new as any;
          setMessages(prev => {
            if (prev.find(msg => msg.id === m.id)) return prev;
            return [...prev, {
              id:         m.id,
              text:       m.text,
              sender:     m.sender_role as SenderRole,
              senderName: m.sender_role,
              timestamp:  new Date(m.created_at),
            }];
          });
          if (m.sender_id !== currentUserId) {
            const field = currentUserRole === 'buyer' ? 'buyer_unread' : 'seller_unread';
            await supabase
              .from('conversations')
              .update({ [field]: 0 })
              .eq('id', conversationId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as any;
          setConversations(prev => prev.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  buyer_unread:    updated.buyer_unread,
                  seller_unread:   updated.seller_unread,
                  last_message_at: updated.last_message_at,
                }
              : c
          ));
        }
      )
      .subscribe();

  }, [currentUserId, currentUserRole]);

  // ── Obtener o crear conversación ──────────────────────────────────────────
  const openOrCreateConversation = useCallback(async (storeId: string): Promise<string> => {
    if (!currentUserId) throw new Error('No authenticated user');

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_buyer_id:  currentUserId,
      p_seller_id: storeId,
    });

    if (error) throw error;

    const convId = data as string;
    await loadConversations();
    await openConversation(convId);
    return convId;
  }, [currentUserId, loadConversations, openConversation]);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!activeConversationId || !currentUserId || !currentUserRole) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id:         tempId,
      text,
      sender:     currentUserRole,
      senderName: currentUserName,
      timestamp:  new Date(),
    };
    setMessages(prev => [...prev, optimistic]);

    const { data: msgId, error } = await supabase.rpc('send_message', {
      p_conversation_id: activeConversationId,
      p_sender_id:       currentUserId,
      p_sender_role:     currentUserRole,
      p_text:            text,
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Error sending message:', error);
      return;
    }

    setMessages(prev => prev.map(m =>
      m.id === tempId ? { ...m, id: msgId as string } : m
    ));
    setConversations(prev => prev.map(c =>
      c.id === activeConversationId
        ? { ...c, last_message_at: new Date().toISOString() }
        : c
    ));
  }, [activeConversationId, currentUserId, currentUserRole, currentUserName]);

  // ── Cerrar conversación ───────────────────────────────────────────────────
  const closeConversation = useCallback(() => {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (currentUserRole === 'buyer' ? c.buyer_unread : c.seller_unread),
    0
  );

  return (
    <ChatContext.Provider value={{
      conversations,
      conversationsLoading,
      activeConversationId,
      messages,
      messagesLoading,
      totalUnread,
      currentUserRole,
      availableStores,
      storesLoading,
      openConversation,
      openOrCreateConversation,
      sendMessage,
      closeConversation,
      refreshConversations: loadConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};