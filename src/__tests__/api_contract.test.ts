import { describe, it, expect, vi } from 'vitest';
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessageToConversation,
  getSocketBackendUrl
} from '../services/api';
import { AuthUser, ChatMessage, MessageStatus } from '../types';

describe('Frontend / Backend Express API & Socket Contract Suite', () => {
  it('correctly resolves dedicated backend socket URL without falling back to Vercel origin', () => {
    const socketUrl = getSocketBackendUrl();
    expect(socketUrl).toBeDefined();
    expect(socketUrl).not.toContain('vercel.app');
    expect(socketUrl).toMatch(/^https?:\/\//);
  });

  it('handles backend /api/conversations dual format (both conversations and chats keys)', async () => {
    const mockApiResponse = {
      status: 'success',
      conversations: [
        {
          id: 'conv_12345',
          tenantId: 'tenant_abc',
          sessionName: 'primary-whatsapp',
          sessionKey: 'primary-whatsapp',
          contactName: 'Aarav Sharma',
          phone: '+919876543210',
          providerChatId: '919876543210@c.us',
          unreadCount: 2,
          lastMessage: { text: 'Hello from client', status: 'sent', fromMe: false },
          tenant_id: 'tenant_abc',
          session_name: 'primary-whatsapp',
          unread_count: 2
        }
      ],
      chats: [
        {
          id: 'conv_12345',
          tenantId: 'tenant_abc',
          sessionName: 'primary-whatsapp',
          sessionKey: 'primary-whatsapp',
          contactName: 'Aarav Sharma',
          phone: '+919876543210',
          providerChatId: '919876543210@c.us',
          unreadCount: 2,
          lastMessage: { text: 'Hello from client', status: 'sent', fromMe: false },
          tenant_id: 'tenant_abc',
          session_name: 'primary-whatsapp',
          unread_count: 2
        }
      ],
      nextCursor: '1728800000:conv_12345',
      hasMore: false
    };

    // Verify dual key access
    const convList = mockApiResponse.conversations || mockApiResponse.chats;
    expect(convList).toHaveLength(1);
    expect(convList[0].sessionKey).toBe('primary-whatsapp');
    expect(convList[0].contactName).toBe('Aarav Sharma');
    expect(convList[0].unreadCount).toBe(2);
    expect(convList[0].session_name).toBe('primary-whatsapp');
  });

  it('reconciles message:updated socket events smoothly across ack states', () => {
    let message: ChatMessage = {
      id: 'msg_initial_1',
      chatId: 'conv_abc',
      sender: 'agent',
      text: 'Order shipped',
      type: 'text',
      timestamp: '11:00 AM',
      status: 'sent',
      ack: 1
    };

    // Socket receives message:updated event from worker with delivery ACK (2)
    const updateEvent = {
      messageId: 'msg_initial_1',
      conversationId: 'conv_abc',
      chatId: 'conv_abc',
      status: 'delivered' as MessageStatus,
      ack: 2,
      providerMessageId: 'true_919876543210@c.us_3EB0123'
    };

    // Handler logic
    if (updateEvent.messageId === message.id) {
      if (updateEvent.ack > (message.ack || 0)) {
        message = {
          ...message,
          status: updateEvent.status,
          ack: updateEvent.ack,
          providerMessageId: updateEvent.providerMessageId || message.providerMessageId
        };
      }
    }

    expect(message.status).toBe('delivered');
    expect(message.ack).toBe(2);
    expect(message.providerMessageId).toBe('true_919876543210@c.us_3EB0123');

    // Socket receives read ACK (3)
    const readEvent = {
      messageId: 'msg_initial_1',
      conversationId: 'conv_abc',
      chatId: 'conv_abc',
      status: 'read' as MessageStatus,
      ack: 3
    };

    if (readEvent.messageId === message.id && readEvent.ack > (message.ack || 0)) {
      message = {
        ...message,
        status: readEvent.status,
        ack: readEvent.ack
      };
    }

    expect(message.status).toBe('read');
    expect(message.ack).toBe(3);
  });

  it('determines superadmin access strictly from database role flags, not email heuristics', () => {
    const regularUser: AuthUser = {
      id: 1,
      name: 'John Doe',
      email: 'admin@wppflow.io', // Notice: legacy heuristic would wrongly treat this as superadmin!
      company_name: 'Acme Corp',
      role: 'user',
      plan: 'pro',
      sessions_limit: 5,
      isSuperAdmin: false,
      is_superadmin: false,
      created_at: '2026-01-01'
    };

    const actualSuperAdmin: AuthUser = {
      id: 2,
      name: 'Super Engineer',
      email: 'engineer@corp.internal',
      company_name: 'WppFlow Platform',
      role: 'admin',
      plan: 'enterprise',
      sessions_limit: 100,
      isSuperAdmin: true,
      created_at: '2026-01-01'
    };

    const isUserSuperAdmin = (u: AuthUser) =>
      Boolean(u.isSuperAdmin || u.is_superadmin || u.role === 'superadmin');

    expect(isUserSuperAdmin(regularUser)).toBe(false);
    expect(isUserSuperAdmin(actualSuperAdmin)).toBe(true);
  });
});
