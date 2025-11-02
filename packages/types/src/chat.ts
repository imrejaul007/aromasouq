import { UUID, ISODateTime, Timestamps } from './common';

export interface ChatConversation extends Timestamps {
  id: UUID;
  userId: UUID;
  vendorId?: UUID;
  supportAgentId?: UUID;
  type: 'customer_support' | 'vendor_chat' | 'video_call';
  status: 'active' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  lastMessageAt: ISODateTime;
  unreadCount: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface ChatMessage extends Timestamps {
  id: UUID;
  conversationId: UUID;
  senderId: UUID;
  senderType: 'user' | 'vendor' | 'support' | 'bot';
  content: string;
  contentType: 'text' | 'image' | 'video' | 'file' | 'product' | 'order';
  attachments?: MessageAttachment[];
  metadata?: {
    productId?: UUID;
    orderId?: UUID;
    botIntent?: string;
    botConfidence?: number;
  };
  readAt?: ISODateTime;
  deliveredAt?: ISODateTime;
}

export interface MessageAttachment {
  id: UUID;
  type: 'image' | 'video' | 'document';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface SendMessageRequest {
  conversationId?: UUID;
  content: string;
  contentType: ChatMessage['contentType'];
  attachments?: File[];
  metadata?: ChatMessage['metadata'];
}

export interface VideoCallSession extends Timestamps {
  id: UUID;
  conversationId: UUID;
  initiatorId: UUID;
  participantId: UUID;
  channelName: string;
  token: string;
  status: 'pending' | 'active' | 'ended' | 'cancelled';
  startedAt?: ISODateTime;
  endedAt?: ISODateTime;
  duration?: number; // in seconds
  recordingUrl?: string;
}

export interface StartVideoCallRequest {
  conversationId: UUID;
  participantId: UUID;
}

export interface AIBotContext {
  userId: UUID;
  conversationHistory: ChatMessage[];
  userPreferences?: Record<string, any>;
  currentIntent?: string;
  entities?: Record<string, any>;
}

export interface AIBotResponse {
  message: string;
  intent: string;
  confidence: number;
  suggestedProducts?: UUID[];
  suggestedActions?: {
    type: 'view_product' | 'view_order' | 'contact_support' | 'video_call';
    label: string;
    data?: any;
  }[];
  needsHumanHandoff: boolean;
}
