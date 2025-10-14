import { useState, useRef, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Star } from "lucide-react";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function MessageConversation({ conversation, onSendMessage, onConversationViewed, onDeleteConversation }) {
  const { data: session } = useSession();

  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tradeRequest, setTradeRequest] = useState(null);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [checkingDetailsStatus, setCheckingDetailsStatus] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Fetch full trade request details to determine requester/responder
  useEffect(() => {
    const fetchTradeRequest = async () => {
      if (!conversation?.id || !session?.access) return;

      try {
        const resp = await fetch(`${BACKEND_URL}/conversations/`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access}`,
          },
          credentials: 'include',
        });

        if (!resp.ok) return;
        const data = await resp.json();

        // Find this conversation
        const conv = data.conversations?.find(c => c.conversation_id === conversation.id);
        if (conv) {
          setTradeRequest({
            tradereq_id: conv.trade_request_id,
            reqname: conv.reqname,
            exchange: conv.exchange,
            requester_id: conv.requester_id,
            responder_id: conv.responder_id,
          });
        }
      } catch (error) {
        console.error('Failed to fetch trade request:', error);
      }
    };

    fetchTradeRequest();
  }, [conversation?.id, session?.access]);

  // Check if user has submitted trade details
  useEffect(() => {
    const checkDetailsStatus = async () => {
      if (!tradeRequest?.tradereq_id || !session?.access) {
        setCheckingDetailsStatus(false);
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/trade-requests/${tradeRequest.tradereq_id}/details/status/`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access}`,
            },
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setDetailsSubmitted(data.current_user?.has_submitted || false);
        }
      } catch (error) {
        console.error('Failed to check details status:', error);
      } finally {
        setCheckingDetailsStatus(false);
      }
    };

    checkDetailsStatus();

    // Listen for details updates
    const handleStorageChange = (e) => {
      if (e.key === 'trade_details_updated') {
        checkDetailsStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [tradeRequest?.tradereq_id, session?.access]);

  // Determine perspective-based labels - use useMemo to recalculate when tradeRequest changes
const perspectiveLabels = useMemo(() => {
  if (!tradeRequest) {
    return {
      requested: conversation?.requests?.requested || '',
      exchange: conversation?.requests?.exchange || '',
    };
  }

  const currentUserId = Number(session?.user?.user_id ?? session?.user?.id);
  const isRequester = currentUserId === Number(tradeRequest.requester_id);

  console.log('🎯 Perspective Check:', {
    currentUserId,
    requester_id: tradeRequest.requester_id,
    isRequester,
    reqname: tradeRequest.reqname,
    exchange: tradeRequest.exchange,
  });

  if (!isRequester) {
    // Requester perspective: What I need and what I'm offering
    console.log('✅ REQUESTER VIEW');
    return {
      requested: tradeRequest.reqname,      // What I (requester) need
      exchange: tradeRequest.exchange,       // What I (requester) offer
    };
  } else {
    // Responder perspective: SWAP - What I want to get and what I'll deliver
    console.log('✅ RESPONDER VIEW - SWAPPING!');
    return {
      requested: tradeRequest.exchange,      // What I (responder) need/want (from requester)
      exchange: tradeRequest.reqname,        // What I (responder) will deliver (to requester)
    };
  }
}, [tradeRequest, session?.user?.user_id, session?.user?.id, conversation?.requests]);

  // Initialize messages when conversation changes
  useEffect(() => {
    const load = async () => {
      if (!conversation?.id) return;
      try {
        const resp = await fetch(`${BACKEND_URL}/conversations/${conversation.id}/messages/`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access ? { Authorization: `Bearer ${session.access}` } : {}),
          },
          credentials: 'include',
        });
        if (!resp.ok) {
          if (conversation?.messages) setMessages([...conversation.messages]);
          return;
        }
        const data = await resp.json();
        const currentId = (session?.user?.user_id ?? session?.user?.id) ? String(session?.user?.user_id ?? session?.user?.id) : null;
        const loaded = (data.messages || []).map(m => {
          const senderId = String(m.sender_id);
          const isUser = currentId && senderId === currentId;
          return {
            sender: isUser ? 'You' : 'Partner',
            content: m.content,
            time: '',
            isUser,
          };
        });
        setMessages(loaded);
      } catch {
        if (conversation?.messages) setMessages([...conversation.messages]);
      }

      if (onConversationViewed && conversation.unread) {
        onConversationViewed();
      }

      try {
        const key = 'unread_counts';
        const store = JSON.parse(localStorage.getItem(key) || '{}');
        if (conversation?.id && store[String(conversation.id)]) {
          store[String(conversation.id)] = 0;
          localStorage.setItem(key, JSON.stringify(store));
        }
      } catch { }
    };
    load();
  }, [conversation?.id, onConversationViewed]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" && !attachedFile) return;

    const newMessageObj = {
      sender: "You",
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        url: attachedFile.url,
        size: attachedFile.size
      } : null,
      replyTo: replyingTo
    };

    const withId = { ...newMessageObj, __localId: `${Date.now()}-${Math.random().toString(16).slice(2)}` };
    setMessages(prevMessages => [...prevMessages, withId]);

    if (conversation?.id) {
      try {
        await fetch(`${BACKEND_URL}/conversations/${conversation.id}/messages/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access ? { Authorization: `Bearer ${session.access}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ content: newMessage }),
        });
      } catch { }
    }

    if (onSendMessage) onSendMessage(withId);

    setNewMessage("");
    setAttachedFile(null);
    setReplyingTo(null);
  };

  const handleDeleteConversation = async () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      if (onDeleteConversation) {
        await onDeleteConversation(conversation.id);
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      setShowDeleteConfirmation(false);
      alert(error.message || "Failed to delete conversation. Please try again.");
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 bg-[#0C071B] rounded-[25px] h-[800px] flex items-center justify-center">
        <div className="text-center p-6">
          <Icon icon="lucide:message-square" className="w-16 h-16 text-[#413663] mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No conversation selected</h3>
          <p className="text-[#8E7EB3]">Choose a conversation from the list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0C071B] rounded-[25px] h-full flex flex-col overflow-hidden relative">

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="absolute inset-0 flex justify-center items-center z-50 rounded-[25px]">
          <div className="w-[420px] p-8 flex flex-col gap-6 rounded-[15px]" style={{
            background: "rgba(0, 0, 0, 0.9)",
            border: "2px solid #0038FF",
            boxShadow: "0px 4px 15px #D78DE5",
            backdropFilter: "blur(40px)",
          }}>
            <h3 className="text-center text-[18px] font-semibold text-white">
              Are you sure you want to delete this conversation? You can no longer see the messages but the other person still can.
            </h3>
            <div className="flex justify-center gap-4 mt-2">
              <button onClick={() => setShowDeleteConfirmation(false)} className="w-[150px] h-[38px] py-2 rounded-[10px] text-white border-2 border-[#0038FF] bg-transparent">
                Cancel
              </button>
              <button onClick={confirmDelete} className="w-[150px] h-[38px] py-2 rounded-[10px] text-white bg-[#0038FF] shadow-[0px_0px_10px_#284CCC]">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="p-5 border-b border-[#1A0F3E] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Profile Picture Link */}
          {conversation.otherUsername ? (
            <Link href={`/home/profile/${conversation.otherUsername}`} className="flex-shrink-0">
              <div className="w-[45px] h-[45px] rounded-full overflow-hidden bg-gray-400 cursor-pointer hover:ring-2 hover:ring-[#906EFF] transition-all">
                <Image
                  src={conversation.avatar || "/assets/defaultavatar.png"}
                  alt={conversation.name}
                  width={45}
                  height={45}
                  className="w-full h-full object-cover"
                  unoptimized={conversation.avatar?.startsWith("http")}
                  onError={(e) => {
                    e.target.src = "/assets/defaultavatar.png";
                  }}
                />
              </div>
            </Link>
          ) : (
            <div className="w-[45px] h-[45px] rounded-full overflow-hidden bg-gray-400 flex-shrink-0">
              <Image
                src={conversation.avatar || "/assets/defaultavatar.png"}
                alt={conversation.name}
                width={45}
                height={45}
                className="w-full h-full object-cover"
                unoptimized={conversation.avatar?.startsWith("http")}
                onError={(e) => {
                  e.target.src = "/assets/defaultavatar.png";
                }}
              />
            </div>
          )}

          <div>
            {/* Name Link */}
            {conversation.otherUsername ? (
              <Link href={`/home/profile/${conversation.otherUsername}`}>
                <h3 className="text-[16px] text-white hover:text-[#906EFF] transition-colors cursor-pointer">
                  {conversation.name}
                </h3>
              </Link>
            ) : (
              <h3 className="text-[16px] text-white">
                {conversation.name}
              </h3>
            )}

            <div className="flex items-center gap-5 mt-1">
              <span className="text-[13px] text-[rgba(255,255,255,0.60)]">
                LVL {conversation.level}
              </span>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                <span className="text-[13px] text-[rgba(255,255,255,0.60)]">{conversation.rating}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDeleteConversation} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <Icon icon="lucide:trash-2" className="text-base" />
            Delete
          </button>
          <Link href="/home/help">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg transition-colors">
              <Icon icon="lucide:flag" className="text-base" />
              Report
            </button>
          </Link>
        </div>
      </div>

      {/* Request/Exchange Section */}
      {perspectiveLabels.requested && perspectiveLabels.exchange && (
        <div className="px-5 py-3 bg-[#0A0519]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0">
            {/* Requested / Exchange */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Requested */}
              <div className="flex flex-col">
                <span className="text-[16px] text-white">Needs</span>
                <div className="px-[10px] py-[5px] mt-1 bg-[rgba(40,76,204,0.2)] border-[2px] border-[#0038FF] rounded-[15px]">
                  <span className="text-[13px] text-white break-words">
                    {perspectiveLabels.requested}
                  </span>
                </div>
              </div>

              {/* Exchange */}
              <div className="flex flex-col">
                <span className="text-[15px] sm:text-[16px] text-white">In exchange for</span>
                <div className="px-[10px] py-[5px] mt-1 bg-[rgba(144,110,255,0.2)] border-[2px] border-[#906EFF] rounded-[15px]">
                  <span className="text-[13px] text-white break-words">
                    {perspectiveLabels.exchange}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex sm:items-end gap-3 pb-1 sm:pb-0">
              {checkingDetailsStatus ? (
                <button
                  disabled
                  className="w-full sm:w-[120px] h-[35px] sm:h-[30px] bg-[#413663] rounded-[10px] opacity-50 cursor-not-allowed"
                >
                  <span className="text-[13px] text-white">Loading...</span>
                </button>
              ) : detailsSubmitted ? (
                <button
                  disabled
                  className="w-full sm:w-[140px] h-[35px] sm:h-[30px] bg-[#6DDFFF] rounded-[10px] cursor-default"
                >
                  <span className="text-[13px] text-black font-bold">Details Submitted</span>
                </button>
              ) : (
                <Link
                  href={`/home/trades/add-details?tradereq_id=${
                    tradeRequest?.tradereq_id || ''
                  }&requested=${encodeURIComponent(tradeRequest?.reqname || '')}&exchange=${encodeURIComponent(
                    tradeRequest?.exchange || ''
                  )}`}
                  onClick={() => {
                    sessionStorage.setItem('trade_details_updated', Date.now().toString());
                  }}
                >
                  <button className="w-full sm:w-[120px] h-[35px] sm:h-[30px] bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors">
                    <span className="text-[13px] text-white">Add details</span>
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${message.isUser ? 'bg-[#0038FF]' : 'bg-[#120A2A]'} px-4 py-2.5 rounded-[20px]`}>
                <p className="text-sm text-white">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-5 border-t border-[#1A0F3E]">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 h-[50px] bg-[#120A2A] rounded-[15px] px-4 text-white placeholder:text-[#413663] focus:outline-none"
          />
          <button type="submit" disabled={!newMessage.trim()} className="w-[50px] h-[50px] bg-[#0038FF] rounded-[15px] flex items-center justify-center disabled:opacity-50 hover:bg-[#1a4dff] transition-colors">
            <Icon icon="lucide:send" className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}