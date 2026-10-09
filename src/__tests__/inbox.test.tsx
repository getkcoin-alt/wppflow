import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Inbox } from '../components/user/Inbox';
import { ChatThread, ChatMessage, WhatsAppSession } from '../types';

const mockSessions: WhatsAppSession[] = [
  {
    id: 'sess_1',
    sessionKey: 'sales-primary',
    displayName: 'Sales Primary',
    phone: '+1 555-0100',
    status: 'CONNECTED',
    battery: 100,
    isCharging: true,
    antiBanHealth: 98,
    warmupDay: 14,
    proxyIp: '127.0.0.1',
    messagesSentToday: 12,
    messagesLimitToday: 3000,
    lastActive: 'Just now',
    wppVersion: '2.3000.101',
    channel: 'sales'
  }
];

const mockChats: ChatThread[] = [
  {
    id: 'conv_1',
    contactId: 'cont_1',
    contactName: 'Alice Johnson',
    phone: '+1 555-0101',
    avatar: '',
    unreadCount: 2,
    isGroup: false,
    channel: 'sales',
    assignedTo: 'Aarav Mehta',
    tags: ['VIP', 'Customer'],
    lastMessage: {
      text: 'Can you confirm order #4120?',
      timestamp: '10:30 AM',
      status: 'delivered',
      fromMe: false
    }
  },
  {
    id: 'conv_2',
    contactId: 'cont_2',
    contactName: 'Product VIP Group',
    phone: '12036304@g.us',
    avatar: '',
    unreadCount: 0,
    isGroup: true,
    groupMembersCount: 15,
    channel: 'sales',
    assignedTo: 'Priya Sharma',
    tags: ['Community'],
    lastMessage: {
      text: 'Thanks everyone for joining!',
      timestamp: 'Yesterday',
      status: 'read',
      fromMe: true
    }
  }
];

const mockMessages: Record<string, ChatMessage[]> = {
  conv_1: [
    {
      id: 'msg_1',
      chatId: 'conv_1',
      sender: 'customer',
      text: 'Can you confirm order #4120?',
      type: 'text',
      timestamp: '10:30 AM',
      status: 'delivered'
    }
  ]
};

const mockContacts = {
  cont_1: {
    id: 'cont_1',
    name: 'Alice Johnson',
    phone: '+1 555-0101',
    email: 'alice@example.com',
    avatar: '',
    tags: ['VIP', 'Customer'],
    lifetimeValue: 1250,
    orders: [
      { id: 'ord_1', orderNumber: 'ORD-4120', date: 'Yesterday', total: 240, currency: 'USD', status: 'Processing', itemsSummary: '2x Silk shirts' }
    ],
    notes: []
  }
};

describe('WhatsApp Web Inbox Component', () => {
  it('renders chat threads and header indicators', () => {
    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />
    );

    expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Product VIP Group')).toBeDefined();
    expect(screen.getByText('WhatsApp Inbox')).toBeDefined();
    expect(screen.getByText('Connected (1)')).toBeDefined();
  });

  it('filters conversation list when clicking Unread or Groups pills', () => {
    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        onSendMessage={vi.fn()}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />
    );

    // Click 'Unread' filter pill
    const unreadButton = screen.getByRole('button', { name: /Unread/i });
    fireEvent.click(unreadButton);

    expect(screen.getAllByText('Alice Johnson').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Product VIP Group')).toBeNull();

    // Click 'Groups' filter pill
    const groupsButton = screen.getByRole('button', { name: /Groups/i });
    fireEvent.click(groupsButton);

    expect(screen.queryByText('Product VIP Group')).toBeDefined();
  });

  it('triggers onSendMessage with text when submitting composer', () => {
    const handleSendMessage = vi.fn();

    render(
      <Inbox
        chats={mockChats}
        messages={mockMessages}
        contacts={mockContacts}
        cannedReplies={[]}
        sessions={mockSessions}
        selectedChatId="conv_1"
        onSendMessage={handleSendMessage}
        onSendAttachment={vi.fn()}
        onAssignAgent={vi.fn()}
        onToggleResolve={vi.fn()}
        onOpenChat={vi.fn()}
        onSyncInbox={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Type a message');
    fireEvent.change(input, { target: { value: 'Your order is confirmed!' } });

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleSendMessage).toHaveBeenCalledWith('conv_1', 'Your order is confirmed!', false);
  });
});
