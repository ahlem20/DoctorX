import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Hash, User, Shield, MessageSquare, Clock } from 'lucide-react';
import api from '../api';
import { useTranslation } from 'react-i18next';

export default function Chat() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation('group1');
  const [staff, setStaff] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or staffId (for DM)
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/auth/staff');
      setStaff(data);
    } catch (error) {
      console.error('Failed to fetch staff members', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const params = activeTab !== 'general' ? { recipient: activeTab } : {};
      const { data } = await api.get('/chats', { params });
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Poll for messages every 3 seconds when the page is active
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const prevMessagesLength = useRef(0);

  // Scroll to bottom and handle notifications when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages.length > prevMessagesLength.current && prevMessagesLength.current !== 0) {
      const newMsgs = messages.slice(prevMessagesLength.current);
      
      // Play sound for new messages
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));

      // Show notification for incoming messages
      const incomingMsgs = newMsgs.filter(m => m.sender?._id !== currentUser._id);
      if (incomingMsgs.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
        const latestMsg = incomingMsgs[incomingMsgs.length - 1];
        new Notification(`New message from ${latestMsg.sender?.name || 'Clinic'}`, {
          body: latestMsg.text,
          icon: '/logo.png'
        });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, currentUser._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const body = {
        text: newMessage,
        receiver: activeTab !== 'general' ? activeTab : null,
      };

      const { data } = await api.post('/chats', body);
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const getActiveRecipient = () => {
    if (activeTab === 'general') return { name: t('chat.generalName'), role: 'Clinic' };
    return staff.find((s) => s._id === activeTab) || { name: 'Staff member', role: 'Staff' };
  };

  const activeRecipient = getActiveRecipient();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Doctor':
        return 'bg-indigo-50 border-indigo-150 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'Nurse':
        return 'bg-teal-50 border-teal-150 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/30';
      default: // Receptionist
        return 'bg-amber-50 border-amber-150 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'Doctor') return t('chat.role.doctor');
    if (role === 'Nurse') return t('chat.role.nurse');
    if (role === 'Receptionist') return t('chat.role.reception');
    return role;
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in-50 duration-500">
      {/* Left Chat Sidebar */}
      <aside className="w-80 border-r border-slate-200/60 bg-slate-50/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">{t('chat.title')}</h3>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
            {t('chat.subtitle')}
          </p>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Public channels */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
              {t('chat.publicChannels')}
            </span>
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition duration-200 group text-left cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Hash className={`h-4.5 w-4.5 ${activeTab === 'general' ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="text-xs">{t('chat.generalChannel')}</span>
              </div>
            </button>
          </div>

          {/* Direct Messages */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
              {t('chat.dms')}
            </span>
            <div className="space-y-1">
              {staff.length > 0 ? (
                staff.map((member) => (
                  <button
                    key={member._id}
                    onClick={() => setActiveTab(member._id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition duration-200 group text-left cursor-pointer ${
                      activeTab === member._id
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10'
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          activeTab === member._id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-none">{member.name}</p>
                        <p className={`text-[9px] mt-1 font-medium ${activeTab === member._id ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {getRoleLabel(member.role)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  {t('chat.noMembers')}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Right Chat Main Window */}
      <main className="flex-1 flex flex-col bg-white">
        {/* Chat window Header */}
        <header className="h-16 border-b border-slate-100 px-6 flex items-center justify-between bg-slate-50/10">
          <div className="flex items-center gap-3">
            {activeTab === 'general' ? (
              <div className="h-9 w-9 bg-indigo-50 border border-indigo-150 rounded-lg flex items-center justify-center text-indigo-600 shadow-xs">
                <Hash className="h-5 w-5" />
              </div>
            ) : (
              <div className="h-9 w-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shadow-xs font-bold text-sm">
                {activeRecipient.name?.charAt(0)}
              </div>
            )}
            <div>
              <h4 className="text-xs font-bold text-slate-800">{activeRecipient.name}</h4>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {activeTab === 'general' ? t('chat.generalDesc') : getRoleLabel(activeRecipient.role)}
              </p>
            </div>
          </div>
        </header>

        {/* Message Log Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/10">
          {messages.length > 0 ? (
            messages.map((msg, index) => {
              const isSelf = msg.sender?._id === currentUser._id;
              return (
                <div
                  key={msg._id}
                  className={`flex gap-3 items-end max-w-xl transition-all duration-200 animate-in fade-in-30 slide-in-from-bottom-2 ${
                    isSelf ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                  }`}
                  style={{ animationDelay: `${index * 10}ms` }}
                >
                  {/* Sender Avatar */}
                  {!isSelf && (
                    <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0 shadow-xs">
                      {msg.sender?.name?.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-1">
                    {/* Sender Details */}
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-bold text-slate-855">{msg.sender?.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold border ${getRoleBadge(msg.sender?.role)}`}>
                          {getRoleLabel(msg.sender?.role)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed break-words whitespace-pre-wrap ${
                        isSelf
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-600/5'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Timestamp */}
                    <p className="text-[8px] text-slate-400 px-2 font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 py-32 flex-col text-center">
              <MessageSquare className="h-10 w-10 text-slate-200 mb-3 animate-pulse" />
              <p className="font-semibold text-sm text-slate-400">{t('chat.noMsgs')}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('chat.startChat')}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Panel */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-3 bg-white">
          <input
            type="text"
            placeholder={t('chat.placeholder')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-11 px-4 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs bg-slate-50/30"
          />
          <button
            type="submit"
            className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition duration-200 shadow-sm shadow-indigo-600/10 cursor-pointer active:scale-95 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </main>
    </div>
  );
}
