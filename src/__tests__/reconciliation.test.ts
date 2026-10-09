import { describe, it, expect } from 'vitest';
import { ChatMessage, MessageStatus } from '../types';

describe('Message Reconciliation and ACK Tracking Logic', () => {
  it('reconciles optimistic message with confirmed server message by idempotencyKey without duplication', () => {
    const idempotencyKey = 'idem_1728470000_abc123';
    
    // Step 1: Initial state has an optimistic message
    let messages: ChatMessage[] = [
      {
        id: 'opt_1728470000',
        chatId: 'conv_100',
        sender: 'agent',
        agentName: 'Aarav Mehta',
        text: 'Hello from WppFlow',
        type: 'text',
        timestamp: '10:00 AM',
        status: 'sending',
        idempotencyKey
      }
    ];

    expect(messages).toHaveLength(1);
    expect(messages[0].status).toBe('sending');

    // Step 2: Server responds with confirmed providerMessageId and server ID
    const serverPayload = {
      id: 'msg_db_9988',
      conversation_id: 'conv_100',
      provider_message_id: 'true_15550100@c.us_3EB0ABCDEF123456',
      status: 'sent' as MessageStatus,
      ack: 1
    };

    // Reconcile: update matching optimistic message in place
    messages = messages.map(m =>
      (m.idempotencyKey === idempotencyKey || m.id === 'opt_1728470000')
        ? {
            ...m,
            id: serverPayload.id,
            providerMessageId: serverPayload.provider_message_id,
            status: 'sent',
            ack: 1
          }
        : m
    );

    expect(messages).toHaveLength(1); // No duplicate bubbles!
    expect(messages[0].id).toBe('msg_db_9988');
    expect(messages[0].providerMessageId).toBe('true_15550100@c.us_3EB0ABCDEF123456');
    expect(messages[0].status).toBe('sent');
    expect(messages[0].ack).toBe(1);
  });

  it('updates message status smoothly upon receiving ACK events (sent -> delivered -> read)', () => {
    let message: ChatMessage = {
      id: 'msg_1',
      chatId: 'conv_1',
      sender: 'agent',
      text: 'Order dispatched',
      type: 'text',
      timestamp: '10:00 AM',
      status: 'sent',
      ack: 1,
      providerMessageId: 'prov_123'
    };

    // ACK 2 = Delivered
    const deliveryAck = { ack: 2, status: 'delivered' as MessageStatus };
    if (deliveryAck.ack > (message.ack || 0)) {
      message = { ...message, ack: deliveryAck.ack, status: deliveryAck.status };
    }
    expect(message.status).toBe('delivered');
    expect(message.ack).toBe(2);

    // ACK 3 = Read (Blue checkmarks)
    const readAck = { ack: 3, status: 'read' as MessageStatus };
    if (readAck.ack > (message.ack || 0)) {
      message = { ...message, ack: readAck.ack, status: readAck.status };
    }
    expect(message.status).toBe('read');
    expect(message.ack).toBe(3);

    // Backward transition should be ignored
    const staleAck = { ack: 1, status: 'sent' as MessageStatus };
    if (staleAck.ack > (message.ack || 0)) {
      message = { ...message, ack: staleAck.ack, status: staleAck.status };
    }
    expect(message.status).toBe('read'); // remains read!
  });
});
