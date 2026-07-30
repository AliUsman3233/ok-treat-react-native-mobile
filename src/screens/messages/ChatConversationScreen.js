import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { ImageHereIcon, AttachmentIcon, DocumentUploadIcon, HappyIcon } from '../../assets';
import api from '../../config/api';
import { useSelector } from 'react-redux';
import { getSocket } from '../../config/socket';
import { useAppAlert } from '../../context/AlertContext';
import { blockUser, reportUser } from '../../services/moderationService';

const REPORT_REASONS = ['Spam', 'Harassment or bullying', 'Inappropriate content', 'Scam or fraud', 'Other'];

const BubbleAvatar = ({ uri }) => (
  uri ? (
    <Image source={{ uri }} style={styles.avatar} resizeMode="cover" />
  ) : (
    <View style={styles.avatar}>
      <ImageHereIcon width={30} height={30} fill="#CCCCCC" />
    </View>
  )
);

const MessageBubble = ({ message, otherAvatar, myAvatar }) => {
  const isMe = message.sender === 'me';

  return (
    <View style={[styles.messageRow, isMe && styles.messageRowReverse]}>
      {!isMe && (
        <View style={styles.avatarContainer}>
          <BubbleAvatar uri={otherAvatar} />
          <View style={styles.onlineIndicator} />
        </View>
      )}

      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>
          {message.text}
        </Text>
        <View style={styles.timeContainer}>
          {message.date && <Text style={[styles.timeText, isMe && styles.myTimeText]}>{message.date}</Text>}
          <Text style={[styles.timeText, isMe && styles.myTimeText]}>
            {isMe ? `${message.time} - ` : `- ${message.time}`}
          </Text>
          {isMe && <Text style={[styles.youText]}>You</Text>}
        </View>
      </View>

      {isMe && <BubbleAvatar uri={myAvatar} />}
    </View>
  );
};

export default function ChatConversationScreen({ route, navigation }) {
  const { chatName = 'Chat', otherUserId, chatId, avatar } = route?.params || {};
  const alert = useAppAlert();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState(null);
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const scrollViewRef = useRef(null);
  const { user } = useSelector(state => state.auth);
  const currentUserId = user?.id || user?._id;

  const receiverId = otherUserId || chatId;

  // The `avatar` param may arrive as a URL string or an Image source object
  // ({ uri }) depending on the caller — normalize to a plain URL. If no usable
  // avatar was passed, we fall back to one derived from the fetched messages
  // (which include sender/receiver avatarUrl), so the header/bubbles show the
  // real photo regardless of how the chat was opened.
  const avatarParam = typeof avatar === 'string' ? avatar : (avatar?.uri || null);
  const [resolvedAvatar, setResolvedAvatar] = useState(null);
  const otherAvatar = avatarParam || resolvedAvatar;
  const myAvatar = user?.avatarUrl || null;

  // Refetch on focus so reopening the chat (e.g. after leaving to ContactSitter
  // / BookingDetail / a different conversation) reloads the persisted thread
  // from the DB instead of showing whatever was in memory last time.
  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      markAsRead();
    }, [receiverId])
  );

  // Listen for real-time incoming messages from the conversation partner
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      // Only add if the message is from the current conversation partner
      if (String(msg.senderId) === String(receiverId)) {
        const formatted = {
          id: msg.id || msg._id,
          text: msg.content || '',
          sender: 'other',
          time: msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          date: msg.createdAt
            ? new Date(msg.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
            : undefined,
        };
        setMessages(prev => [...prev, formatted]);
        // Mark as read since the user is viewing this conversation
        markAsRead();
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [receiverId]);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages', { params: { otherUserId: receiverId } });
      // Backend returns { success, data: { messages: [...], total } }.
      // axios sets response.data to the body, so the array lives at
      // response.data.data.messages. The old fallback chain matched
      // response.data.data (an object, not array) first and left the thread empty.
      const list =
        response.data?.data?.messages ||
        response.data?.messages ||
        (Array.isArray(response.data) ? response.data : []);

      // Derive the other party's avatar from the messages (they include
      // sender/receiver { avatarUrl }) so the header isn't dependent on the
      // caller passing an avatar param.
      if (Array.isArray(list)) {
        for (const m of list) {
          const other = String(m.senderId) === String(receiverId) ? m.sender
            : (String(m.receiverId) === String(receiverId) ? m.receiver : null);
          if (other?.avatarUrl) { setResolvedAvatar(other.avatarUrl); break; }
        }
      }

      const formatted = (Array.isArray(list) ? list : []).map(msg => ({
        id: msg.id || msg._id,
        text: msg.content || msg.text || '',
        sender: (msg.senderId === currentUserId || msg.sender === currentUserId) ? 'me' : 'other',
        time: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        date: msg.createdAt
          ? new Date(msg.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
          : undefined,
      }));
      setMessages(formatted);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put('/messages/read', { otherUserId: receiverId });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    const content = message.trim();
    setMessage('');

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      text: content,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, tempMsg]);

    setSending(true);
    try {
      const response = await api.post('/messages', { receiverId, content });
      const newMsg = response.data?.data || response.data?.message || response.data;
      // Replace temp message with real one
      setMessages(prev => prev.map(m =>
        m.id === tempMsg.id ? {
          id: newMsg?.id || newMsg?._id || tempMsg.id,
          text: newMsg?.content || content,
          sender: 'me',
          time: newMsg?.createdAt
            ? new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : tempMsg.time,
        } : m
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove temp message on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setMessage(content); // Restore the message input
      // Blocked either direction -> the server returns 403.
      if (err?.response?.status === 403) {
        alert('Message not sent', err.response.data?.message || 'You can no longer message this user.', 'pending');
      }
    } finally {
      setSending(false);
    }
  };

  const handleBlock = () => {
    setShowMenu(false);
    if (!receiverId) return;
    Alert.alert(
      `Block ${chatName}?`,
      'You will no longer see messages from each other. You can unblock later from Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(receiverId);
              alert('User blocked', `${chatName} has been blocked.`, 'success', 'OK', () => navigation.goBack());
            } catch (e) {
              alert('Error', e?.response?.data?.message || 'Failed to block user.', 'error');
            }
          },
        },
      ],
    );
  };

  const openReport = () => {
    setShowMenu(false);
    setReportReason(null);
    setReportDetails('');
    setShowReport(true);
  };

  const submitReport = async () => {
    if (!reportReason || !receiverId) return;
    setSubmittingReport(true);
    try {
      await reportUser({ userId: receiverId, reason: reportReason, details: reportDetails.trim() || null, context: 'chat' });
      setShowReport(false);
      alert('Report submitted', 'Thanks — our team will review this report.', 'success');
    } catch (e) {
      alert('Error', e?.response?.data?.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <ScreenWrapper noBottomTabs>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="chevron-back" size={24} color="#B46299" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              {otherAvatar ? (
                <Image source={{ uri: otherAvatar }} style={styles.headerAvatarImage} resizeMode="cover" />
              ) : (
                <ImageHereIcon width={40} height={40} fill="#CCCCCC" />
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{chatName}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} onPress={() => setShowMenu(true)}>
            <Icon name="ellipsis-vertical" size={24} color="#B46299" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Messages */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B46299" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} otherAvatar={otherAvatar} myAvatar={myAvatar} />
              ))}
            </ScrollView>
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcons}>

                <TouchableOpacity style={styles.iconButton}>
                  <DocumentUploadIcon width={20} height={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <HappyIcon width={20} height={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <AttachmentIcon width={20} height={20} />
                </TouchableOpacity>
              </View>

              <Text style={styles.divider}>|</Text>

              <TextInput
                style={styles.input}
                placeholder="Type your message"
                placeholderTextColor="#8D8E90"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, (!message.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!message.trim() || sending}
            >
              <View style={styles.sendIconWrapper}>
                <Icon name="send" size={22} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Header overflow menu — Report / Block */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.sheetItem} onPress={openReport}>
              <Icon name="flag-outline" size={20} color="#212121" />
              <Text style={styles.sheetItemText}>Report {chatName}</Text>
            </TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.sheetItem} onPress={handleBlock}>
              <Icon name="ban-outline" size={20} color="#E53D3D" />
              <Text style={[styles.sheetItemText, { color: '#E53D3D' }]}>Block {chatName}</Text>
            </TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.sheetItem} onPress={() => setShowMenu(false)}>
              <Icon name="close-outline" size={20} color="#8D8E90" />
              <Text style={[styles.sheetItemText, { color: '#8D8E90' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report reason picker */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.reportSheet}>
            <Text style={styles.reportTitle}>Report {chatName}</Text>
            <Text style={styles.reportSubtitle}>Why are you reporting this user?</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity key={r} style={styles.reasonRow} onPress={() => setReportReason(r)}>
                <Icon
                  name={reportReason === r ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={reportReason === r ? '#32A6D8' : '#B5B8CB'}
                />
                <Text style={styles.reasonText}>{r}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.reportDetails}
              placeholder="Add details (optional)"
              placeholderTextColor="#8D8E90"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
            />
            <View style={styles.reportButtons}>
              <TouchableOpacity style={styles.reportCancel} onPress={() => setShowReport(false)} disabled={submittingReport}>
                <Text style={styles.reportCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportSubmit, (!reportReason || submittingReport) && { opacity: 0.5 }]}
                onPress={submitReport}
                disabled={!reportReason || submittingReport}
              >
                {submittingReport
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.reportSubmitText}>Submit Report</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 15,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarImage: {
    width: 40,
    height: 40,
  },
  headerInfo: {
    gap: 2,
  },
  headerName: {
    color: '#333333',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    lineHeight: 22.4,
  },
  headerRole: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 18,
  },
  moreButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  messageRowReverse: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  onlineIndicator: {
    width: 7,
    height: 7,
    backgroundColor: '#719771',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'white',
    position: 'absolute',
    right: -2,
    bottom: 0,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '70%',
    gap: 12,
  },
  otherMessage: {
    backgroundColor: '#F5F5F5',
  },
  myMessage: {
    backgroundColor: '#B46299',
  },
  messageText: {
    color: '#8D8E90',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    lineHeight: 18,
  },
  myMessageText: {
    color: 'white',
    textAlign: 'left',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    color: '#8D8E90',
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 12,
  },
  myTimeText: {
    color: 'white',
  },
  youText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '600',
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    color: '#8D8E90',
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 12,
  },
  input: {
    flex: 1,
    color: '#040404',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
    padding: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    backgroundColor: '#B46299',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIconWrapper: {
    transform: [{ rotate: '-30deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8D8E90',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  // Report / Block menu + report sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  sheetItemText: {
    color: '#212121',
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 24,
  },
  reportSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  reportTitle: {
    color: '#212121',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  reportSubtitle: {
    color: '#818898',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  reasonText: {
    color: '#212121',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  reportDetails: {
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    marginTop: 10,
    color: '#212121',
    fontFamily: 'Poppins',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  reportButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  reportCancel: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCancelText: {
    color: '#818898',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  reportSubmit: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#32A6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});
