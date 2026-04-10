import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

function DiscussionTab({ tuitionId, isTeacher }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fetchedRef = useRef(false);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Get user error:', error);
        return;
      }
      setCurrentUser(user);
    } catch (err) {
      console.error('Get user exception:', err);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!tuitionId) {
      console.log('No tuitionId provided, skipping fetch');
      return;
    }

    // Prevent duplicate fetches
    if (fetchedRef.current) {
      console.log('Already fetched, skipping duplicate');
      return;
    }

    fetchedRef.current = true;
    setLoading(true);

    // Create AbortController for timeout
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => {
      console.log('Fetch timeout reached, cancelling request');
      controller.abort();
      setLoading(false);
      setMessages([]);
      fetchedRef.current = false; // Allow retry
    }, 15000);

    try {
      console.log('Fetching messages for tuitionId:', tuitionId);

      // First, fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('discussion_messages')
        .select('*')
        .eq('tuition_id', tuitionId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Fetch messages error:', messagesError);
        clearTimeout(fetchTimeout);
        toast.error('Failed to load messages');
        setMessages([]);
        setLoading(false);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found');
        clearTimeout(fetchTimeout);
        setMessages([]);
        setLoading(false);
        return;
      }

      console.log('Fetched messages:', messagesData.length);

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];

      // Fetch profiles for senders (only if there are sender IDs)
      let profileMap = {};
      if (senderIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('id', senderIds);

        if (profilesError) {
          console.error('Fetch profiles error:', profilesError);
        }

        if (profilesData) {
          profilesData.forEach(profile => {
            profileMap[profile.id] = { full_name: profile.full_name, role: profile.role };
          });
        }
      }

      // Combine messages with sender names
      const messagesWithSenders = messagesData.map(msg => {
        const profile = profileMap[msg.sender_id];
        const fullName = profile?.full_name?.trim();
        const role = profile?.role || 'student';

        return {
          ...msg,
          sender_profile: {
            full_name: fullName || `User ${msg.sender_id?.slice(0, 4)}...`,
            role: role,
          },
        };
      });

      console.log('Final messages with senders:', messagesWithSenders.length);
      clearTimeout(fetchTimeout);
      setMessages(messagesWithSenders);
    } catch (err) {
      console.error('Fetch messages exception:', err);
      clearTimeout(fetchTimeout);
      if (err.name !== 'AbortError') {
        toast.error('Failed to load messages');
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [tuitionId]);

  // Initial fetch on mount
  useEffect(() => {
    // Reset flag and fetch immediately
    fetchedRef.current = false;
    getCurrentUser();
    fetchMessages();

    // Reset fetch flag when tuitionId changes
    return () => {
      fetchedRef.current = false;
    };
  }, [tuitionId, fetchMessages, getCurrentUser]);

  // Setup realtime subscription (fire and forget - don't block loading)
  useEffect(() => {
    if (!tuitionId) return;

    const channel = supabase
      .channel(`discussion-${tuitionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_messages',
          filter: `tuition_id=eq.${tuitionId}`,
        },
        async (payload) => {
          console.log('Realtime new message:', payload.new);

          // Fetch sender profile for the new message
          const { data: senderData, error: senderError } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', payload.new.sender_id)
            .maybeSingle();

          if (senderError) {
            console.error('Fetch sender error:', senderError);
          }

          const fullName = senderData?.full_name?.trim();
          const newMsg = {
            ...payload.new,
            sender_profile: {
              full_name: fullName || `User ${payload.new.sender_id?.slice(0, 4)}...`,
              role: senderData?.role || 'student',
            },
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tuitionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;
    if (!currentUser) {
      toast.error('Please sign in to send messages');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('discussion_messages')
        .insert({
          tuition_id: tuitionId,
          sender_id: currentUser.id,
          message_text: trimmedMessage,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        setSending(false);
        return;
      }

      // Clear input and focus back
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Send message exception:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] relative">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between z-10 sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">Class Discussion</h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Real-time chat
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Auto-delete after 7 days</span>
          </div>
          <div className="bg-slate-100/80 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">
              {messages.length}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Messages</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-200 border-t-indigo-600"></div>
              <span className="text-sm font-medium text-slate-600">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-indigo-50/50">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">No messages yet</h4>
            <p className="text-slate-500 max-w-sm mx-auto">
              Ready to start the conversation? Type a message below to say hello to the class!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMessages).map(([dateString, dateMessages]) => (
              <div key={dateString} className="space-y-6">
                {/* Date Divider */}
                <div className="flex items-center justify-center sticky top-2 z-10 pointer-events-none">
                  <span className="text-xs font-bold text-slate-500 bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
                    {formatDate(dateMessages[0].created_at)}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-4">
                  {dateMessages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUser?.id;
                    const senderName = message.sender_profile?.full_name || 'Unknown';
                    const senderInitial = senderName.charAt(0).toUpperCase();
                    const isTeacherMsg = message.sender_profile?.role?.toLowerCase() === 'teacher';

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                          isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        {/* Avatar */}
                        {!isOwnMessage && (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1 shadow-sm border-2 border-white ${
                              isTeacherMsg
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {senderInitial}
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          {/* Sender Info (only for others) */}
                          {!isOwnMessage && (
                            <div className="flex items-center gap-2 mb-1.5 pl-1">
                              <span className="text-xs font-semibold text-slate-700">
                                {senderName}
                              </span>
                              {isTeacherMsg ? (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                  Teacher
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                  Student
                                </span>
                              )}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`px-4 sm:px-5 py-3 rounded-2xl text-[15px] leading-relaxed relative group ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-500/10'
                                : isTeacherMsg 
                                  ? 'bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-tl-sm shadow-sm'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
                          </div>

                          {/* Timestamp */}
                          <span className={`text-[11px] font-medium text-slate-400 mt-1.5 select-none ${
                            isOwnMessage ? 'pr-1' : 'pl-1'
                          }`}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0 z-10 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto w-full">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={sending}
              className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl text-[15px] focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white placeholder:text-slate-400 transition-all disabled:opacity-60 disabled:bg-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none transition-all shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 group"
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default DiscussionTab;
