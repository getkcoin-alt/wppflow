export const initialUsers = [
    {
        id: 'usr_1',
        name: 'Aarav Mehta',
        email: 'aarav@urbanthreads.store',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        role: 'tenant_admin',
        company: 'Urban Threads D2C',
        plan: 'enterprise',
        status: 'active',
        whatsappSessionsQuota: 10,
        activeSessionsCount: 4,
        monthlyBroadcastLimit: 100000,
        broadcastsUsed: 42150,
        teamSeats: 15,
        apiCallsThisMonth: 182400,
        createdAt: '2025-11-12',
        lastLogin: '2026-09-06 08:14'
    },
    {
        id: 'usr_2',
        name: 'Elena Rostova',
        email: 'elena@novaparts.eu',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
        role: 'tenant_admin',
        company: 'Nova Auto Logistics',
        plan: 'growth',
        status: 'active',
        whatsappSessionsQuota: 5,
        activeSessionsCount: 3,
        monthlyBroadcastLimit: 40000,
        broadcastsUsed: 18900,
        teamSeats: 8,
        apiCallsThisMonth: 64120,
        createdAt: '2026-01-05',
        lastLogin: '2026-09-05 19:42'
    },
    {
        id: 'usr_3',
        name: 'Carlos Mendez',
        email: 'carlos@zenfitness.app',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
        role: 'tenant_admin',
        company: 'Zenith Health & Fit',
        plan: 'starter',
        status: 'active',
        whatsappSessionsQuota: 2,
        activeSessionsCount: 1,
        monthlyBroadcastLimit: 10000,
        broadcastsUsed: 3100,
        teamSeats: 3,
        apiCallsThisMonth: 12050,
        createdAt: '2026-02-18',
        lastLogin: '2026-09-04 11:20'
    },
    {
        id: 'usr_4',
        name: 'Priya Sharma',
        email: 'priya@fastkart.in',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
        role: 'agent',
        company: 'Urban Threads D2C',
        plan: 'enterprise',
        status: 'active',
        whatsappSessionsQuota: 1,
        activeSessionsCount: 1,
        monthlyBroadcastLimit: 5000,
        broadcastsUsed: 840,
        teamSeats: 1,
        apiCallsThisMonth: 4200,
        createdAt: '2026-03-01',
        lastLogin: '2026-09-06 07:50'
    },
    {
        id: 'usr_5',
        name: 'Marcus Vance',
        email: 'marcus@cryptopulse.io',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80',
        role: 'tenant_admin',
        company: 'CryptoPulse Alerts',
        plan: 'growth',
        status: 'suspended',
        whatsappSessionsQuota: 5,
        activeSessionsCount: 0,
        monthlyBroadcastLimit: 50000,
        broadcastsUsed: 49900,
        teamSeats: 5,
        apiCallsThisMonth: 210400,
        createdAt: '2025-12-10',
        lastLogin: '2026-08-30 14:02'
    }
];
export const initialSessions = [
    {
        id: 'sess_sales',
        sessionKey: 'sales-primary',
        displayName: 'Global Sales Hotline',
        phone: '+1 (555) 349-8201',
        status: 'CONNECTED',
        battery: 89,
        isCharging: true,
        antiBanHealth: 98,
        warmupDay: 14,
        proxyIp: '198.51.100.42 (US-East Resi)',
        messagesSentToday: 1420,
        messagesLimitToday: 3000,
        lastActive: 'Just now',
        wppVersion: '2.3000.101',
        channel: 'sales'
    },
    {
        id: 'sess_support',
        sessionKey: 'support-desk',
        displayName: 'Tier 1 & 2 Customer Care',
        phone: '+44 7700 900845',
        status: 'CONNECTED',
        battery: 64,
        isCharging: false,
        antiBanHealth: 95,
        warmupDay: 12,
        proxyIp: '185.220.101.5 (UK London)',
        messagesSentToday: 932,
        messagesLimitToday: 2500,
        lastActive: '1m ago',
        wppVersion: '2.3000.101',
        channel: 'support'
    },
    {
        id: 'sess_vip',
        sessionKey: 'vip-concierge',
        displayName: 'VIP Black Card Concierge',
        phone: '+971 50 123 4567',
        status: 'CONNECTED',
        battery: 95,
        isCharging: true,
        antiBanHealth: 100,
        warmupDay: 14,
        proxyIp: '94.200.45.18 (UAE Dubai)',
        messagesSentToday: 184,
        messagesLimitToday: 1000,
        lastActive: '5m ago',
        wppVersion: '2.3000.101',
        channel: 'vip'
    },
    {
        id: 'sess_backup',
        sessionKey: 'dispatch-ops',
        displayName: 'Warehouse Logistics & Dispatch',
        phone: '+91 98200 11223',
        status: 'QRCODE',
        battery: 0,
        isCharging: false,
        antiBanHealth: 88,
        warmupDay: 3,
        proxyIp: '103.21.244.2 (IN Mumbai)',
        messagesSentToday: 0,
        messagesLimitToday: 500,
        lastActive: '10m ago',
        wppVersion: '2.3000.101',
        channel: 'general'
    }
];
export const initialContacts = {
    'cont_1': {
        id: 'cont_1',
        name: 'Sophia Laurent',
        phone: '+33 6 12 34 56 78',
        email: 'sophia.laurent@luxurycouture.fr',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        tags: ['VIP Client', 'High LTV', 'Shopify Buyer', 'EU Region'],
        customTraits: {
            'Preferred Currency': 'EUR (€)',
            'Preferred Language': 'French / English',
            'Account Manager': 'Aarav Mehta',
            'Total Spend': '$4,850.00',
            'Shoe Size': '38 EU'
        },
        lifetimeValue: 4850,
        channel: 'VIP Concierge',
        lastSeen: 'Online',
        assignedAgent: 'Aarav Mehta',
        orders: [
            {
                id: 'ord_101',
                orderNumber: '#SH-9842',
                date: '2026-09-02',
                total: 1240,
                currency: 'EUR',
                status: 'Delivered',
                itemsSummary: 'Cashmere Trench Coat (Midnight Blue) × 1'
            },
            {
                id: 'ord_102',
                orderNumber: '#SH-9104',
                date: '2026-07-15',
                total: 890,
                currency: 'EUR',
                status: 'Delivered',
                itemsSummary: 'Italian Silk Scarf & Leather Tote'
            }
        ],
        notes: [
            {
                id: 'n_1',
                author: 'Aarav Mehta',
                authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                content: 'Sophia prefers WhatsApp voice updates instead of email. Always include express DHL tracking links directly in chat.',
                createdAt: '2026-09-03 14:10'
            }
        ]
    },
    'cont_2': {
        id: 'cont_2',
        name: 'David K. Miller',
        phone: '+1 (415) 890-2134',
        email: 'david@millercapital.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        tags: ['Wholesale Lead', 'Pending Invoice', 'Urgent Delivery'],
        customTraits: {
            'Company': 'Miller Ventures',
            'Order Volume': '150 Units / Quarter',
            'Tax ID': 'US-9938201-B'
        },
        lifetimeValue: 12400,
        channel: 'Global Sales Hotline',
        lastSeen: '12m ago',
        assignedAgent: 'Priya Sharma',
        orders: [
            {
                id: 'ord_201',
                orderNumber: '#PO-3341',
                date: '2026-09-05',
                total: 5600,
                currency: 'USD',
                status: 'Processing',
                itemsSummary: 'Custom Branded Merino Pullovers (x50 units)'
            }
        ],
        notes: [
            {
                id: 'n_2',
                author: 'Priya Sharma',
                authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
                content: 'Requested 5% bulk discount for Q4 order. Approved by sales director.',
                createdAt: '2026-09-05 16:30'
            }
        ]
    },
    'cont_3': {
        id: 'cont_3',
        name: 'Amara Okafor',
        phone: '+234 803 123 4567',
        email: 'amara.o@fintechlagos.ng',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        tags: ['Abandoned Cart', 'Promo Eligible'],
        customTraits: {
            'Cart Abandoned Value': '$320.00',
            'Last Viewed': 'Heritage Leather Loafers',
            'Checkout Abandoned': '1 hour ago'
        },
        lifetimeValue: 640,
        channel: 'Tier 1 & 2 Customer Care',
        lastSeen: '1h ago',
        assignedAgent: 'Auto Bot (Nudge)',
        orders: [
            {
                id: 'ord_301',
                orderNumber: '#CART-9941',
                date: '2026-09-06',
                total: 320,
                currency: 'USD',
                status: 'Abandoned Cart',
                itemsSummary: 'Heritage Leather Loafers (Size 42) × 1'
            }
        ],
        notes: []
    },
    'cont_4': {
        id: 'cont_4',
        name: 'VIP Founders Circle (Group)',
        phone: '12036302488192312@g.us',
        email: 'community@wppflow.io',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
        tags: ['WhatsApp Group', 'Community', '248 Members'],
        customTraits: {
            'Group Admin': 'Aarav Mehta',
            'Invite Link Active': 'Yes',
            'Announcements Only': 'False'
        },
        lifetimeValue: 0,
        channel: 'Global Sales Hotline',
        lastSeen: 'Active',
        assignedAgent: 'Aarav Mehta',
        orders: [],
        notes: [
            {
                id: 'n_4',
                author: 'Aarav Mehta',
                authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
                content: 'This group contains our top 250 enterprise buyers. Use WppFlow group broadcast for product drops.',
                createdAt: '2026-08-20 10:00'
            }
        ]
    }
};
export const initialChats = [
    {
        id: 'chat_1',
        contactId: 'cont_1',
        contactName: 'Sophia Laurent',
        phone: '+33 6 12 34 56 78',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        unreadCount: 2,
        isGroup: false,
        channel: 'vip',
        assignedTo: 'Aarav Mehta',
        assignedAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        tags: ['VIP Client', 'High LTV'],
        lastMessage: {
            text: 'Could you confirm if the Autumn capsule jacket is available in camel beige?',
            timestamp: '08:24 AM',
            status: 'delivered',
            fromMe: false
        }
    },
    {
        id: 'chat_2',
        contactId: 'cont_2',
        contactName: 'David K. Miller',
        phone: '+1 (415) 890-2134',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        unreadCount: 0,
        isGroup: false,
        channel: 'sales',
        assignedTo: 'Priya Sharma',
        assignedAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
        tags: ['Wholesale Lead', 'Urgent Delivery'],
        lastMessage: {
            text: 'Thanks Priya! Just made the wire transfer for PO-3341. Attached receipt.',
            timestamp: 'Yesterday',
            status: 'read',
            fromMe: false
        }
    },
    {
        id: 'chat_3',
        contactId: 'cont_3',
        contactName: 'Amara Okafor',
        phone: '+234 803 123 4567',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        unreadCount: 1,
        isGroup: false,
        channel: 'support',
        assignedTo: 'Auto Bot (Nudge)',
        tags: ['Abandoned Cart'],
        lastMessage: {
            text: 'Does this 15% discount code apply for international shipping too?',
            timestamp: '07:45 AM',
            status: 'delivered',
            fromMe: false
        }
    },
    {
        id: 'chat_4',
        contactId: 'cont_4',
        contactName: 'VIP Founders Circle (Group)',
        phone: '12036302488192312@g.us',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80',
        unreadCount: 0,
        isGroup: true,
        groupMembersCount: 248,
        channel: 'sales',
        assignedTo: 'Aarav Mehta',
        assignedAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        tags: ['WhatsApp Group', 'Community'],
        lastMessage: {
            text: '🚀 Early access pre-orders are now live for all circle members! Use code FOUNDERSVIP',
            timestamp: 'Sep 05',
            status: 'read',
            fromMe: true
        }
    }
];
export const initialMessages = {
    'chat_1': [
        {
            id: 'm_101',
            chatId: 'chat_1',
            sender: 'customer',
            text: 'Bonjour Aarav! Hope you are doing great. I saw your post regarding the autumn collection.',
            type: 'text',
            timestamp: '08:15 AM',
            status: 'read'
        },
        {
            id: 'm_102',
            chatId: 'chat_1',
            sender: 'agent',
            agentName: 'Aarav Mehta',
            text: 'Bonjour Madame Laurent! Always a pleasure. Yes, our limited artisan cashmere line just landed from Milan this morning.',
            type: 'text',
            timestamp: '08:18 AM',
            status: 'read'
        },
        {
            id: 'm_103',
            chatId: 'chat_1',
            sender: 'agent',
            agentName: 'Aarav Mehta',
            text: 'Here is an exclusive preview of the lookbook catalogue:',
            type: 'buttons',
            buttons: [
                { id: 'btn_cat', label: '📖 View Autumn Lookbook' },
                { id: 'btn_reserve', label: '✨ Reserve in Size 38' },
                { id: 'btn_concierge', label: '📞 Call Stylist' }
            ],
            timestamp: '08:19 AM',
            status: 'read'
        },
        {
            id: 'm_104',
            chatId: 'chat_1',
            sender: 'agent',
            agentName: 'Aarav Mehta',
            text: '@sarah Note: Sophia wants this held for 24h. Please do not reassign inventory without checking with me.',
            type: 'internal_note',
            isNote: true,
            timestamp: '08:21 AM',
            status: 'read'
        },
        {
            id: 'm_105',
            chatId: 'chat_1',
            sender: 'customer',
            text: 'Voice message (0:18)',
            type: 'audio',
            audioDuration: '0:18',
            timestamp: '08:22 AM',
            status: 'read'
        },
        {
            id: 'm_106',
            chatId: 'chat_1',
            sender: 'customer',
            text: 'Could you confirm if the Autumn capsule jacket is available in camel beige?',
            type: 'text',
            timestamp: '08:24 AM',
            status: 'delivered'
        }
    ],
    'chat_2': [
        {
            id: 'm_201',
            chatId: 'chat_2',
            sender: 'agent',
            agentName: 'Priya Sharma',
            text: 'Hi David, here is the updated wholesale proforma invoice for the 150-unit order.',
            type: 'document',
            fileName: 'Proforma_Invoice_PO-3341.pdf',
            fileSize: '1.4 MB',
            timestamp: 'Yesterday 15:40',
            status: 'read'
        },
        {
            id: 'm_202',
            chatId: 'chat_2',
            sender: 'customer',
            text: 'Thanks Priya! Just made the wire transfer for PO-3341. Attached receipt.',
            type: 'text',
            timestamp: 'Yesterday 17:12',
            status: 'read'
        }
    ],
    'chat_3': [
        {
            id: 'm_301',
            chatId: 'chat_3',
            sender: 'bot',
            text: '👋 Hi Amara! We noticed you left the Heritage Leather Loafers in your bag. Complete your purchase now and enjoy 15% OFF with code LOAFERS15! 🛍️',
            type: 'buttons',
            buttons: [
                { id: 'b_recov', label: '⚡ Checkout with 15% Off' },
                { id: 'b_help', label: '💬 Talk to Support' }
            ],
            timestamp: '06:30 AM',
            status: 'read'
        },
        {
            id: 'm_302',
            chatId: 'chat_3',
            sender: 'customer',
            text: 'Does this 15% discount code apply for international shipping too?',
            type: 'text',
            timestamp: '07:45 AM',
            status: 'delivered'
        }
    ],
    'chat_4': [
        {
            id: 'm_401',
            chatId: 'chat_4',
            sender: 'agent',
            agentName: 'Aarav Mehta',
            text: '🚀 Early access pre-orders are now live for all circle members! Use code FOUNDERSVIP',
            type: 'text',
            timestamp: 'Sep 05',
            status: 'read'
        }
    ]
};
export const cannedReplies = [
    { shortcut: '/hello', title: 'Warm Greeting', text: 'Hello! Thank you for contacting Urban Threads. How may I assist you today?' },
    { shortcut: '/pricing', title: 'Pricing & Catalog', text: 'You can explore our entire verified catalog, sizes, and real-time inventory at: https://urbanthreads.store/catalog?ref=whatsapp' },
    { shortcut: '/shipping', title: 'Shipping Policy', text: 'We offer express insured shipping worldwide. Domestic orders deliver in 2-3 business days; international orders arrive within 4-6 business days via DHL Express.' },
    { shortcut: '/refund', title: 'Hassle-Free Returns', text: 'We provide 30-day doorstep exchanges and full refunds on all unworn items. Let me know your order number and I can generate an instant return label for you!' }
];
export const initialCampaigns = [
    {
        id: 'camp_1',
        name: 'Autumn Capsule Drop (VIP Exclusive)',
        targetSegment: 'VIP & High LTV Customers',
        totalRecipients: 1850,
        sentCount: 1850,
        deliveredCount: 1812,
        readCount: 1690,
        repliedCount: 420,
        failedCount: 38,
        costSavedMeta: 92.50, // $0.05 x 1850 saved!
        status: 'completed',
        templateText: '✨ {Bonjour|Hello|Greetings} {{name}}! Our Italian Autumn Capsule is live. As our VIP patron, enjoy early reservation before public release.',
        antiBanDelaySeconds: 4,
        createdAt: '2026-09-04 10:00'
    },
    {
        id: 'camp_2',
        name: 'Abandoned Cart 2-Hour Dynamic Recovery',
        targetSegment: 'Shopify Cart Abandoners ($150+)',
        totalRecipients: 420,
        sentCount: 420,
        deliveredCount: 416,
        readCount: 388,
        repliedCount: 94,
        failedCount: 4,
        costSavedMeta: 21.00,
        status: 'running',
        templateText: 'Hey {{name}}! Your cart is waiting with complimentary express shipping. Tap below to resume your order.',
        antiBanDelaySeconds: 5,
        createdAt: '2026-09-06 06:00'
    },
    {
        id: 'camp_3',
        name: 'End of Season Warehouse Clearance (Broadcast)',
        targetSegment: 'All Subscribers (Newsletter)',
        totalRecipients: 12400,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        repliedCount: 0,
        failedCount: 0,
        costSavedMeta: 620.00,
        status: 'scheduled',
        scheduledFor: '2026-09-08 11:00 AM',
        templateText: '🔥 Up to 50% OFF everything in our annual warehouse clearout. Don\'t miss out {{name}}!',
        antiBanDelaySeconds: 6,
        createdAt: '2026-09-05 18:20'
    }
];
export const initialAutomations = [
    {
        id: 'auto_1',
        name: 'Welcome Greeting & Interactive Department Picker',
        triggerType: 'new_lead',
        triggerCondition: 'First message received from unknown number',
        actionType: 'reply_buttons',
        actionSummary: 'Sends welcome banner + 3 interactive buttons (Sales, Support, Tracking)',
        isEnabled: true,
        executionsCount: 1420
    },
    {
        id: 'auto_2',
        name: 'Keyword Trigger: "TRACK" or "ORDER STATUS"',
        triggerType: 'keyword',
        triggerCondition: 'Message matches regex /^(track|order|status)/i',
        actionType: 'fire_webhook',
        actionSummary: 'Fetches Shopify tracking URL and responds dynamically with live courier status',
        isEnabled: true,
        executionsCount: 3890
    },
    {
        id: 'auto_3',
        name: 'High-Value VIP Auto-Route',
        triggerType: 'new_lead',
        triggerCondition: 'Contact lifetime value >= $2,000',
        actionType: 'assign_agent',
        actionSummary: 'Routes chat immediately to Senior Concierge & sends WhatsApp notification to manager',
        isEnabled: true,
        executionsCount: 184
    }
];
export const clusterMetrics = {
    activeContainers: 14,
    totalSessions: 38,
    cpuUsagePercent: 24.8,
    ramUsagePercent: 42.1,
    ramUsageGb: 6.7,
    totalRamGb: 16.0,
    queueDepth: 12,
    avgResponseMs: 142,
    uptimeHours: 348,
    systemStatus: 'healthy'
};
export const apiEndpoints = [
    {
        id: 'ep_send_message',
        method: 'POST',
        path: '/api/:session/send-message',
        category: 'Messages',
        title: 'Send Text Message',
        description: 'Sends a standard text message with optional mentions, reply quotation, or link previews to any WhatsApp number or group.',
        headers: {
            'Authorization': 'Bearer wpp_live_sec_9938201a4bc8821d',
            'Content-Type': 'application/json'
        },
        parameters: [
            { name: 'session', type: 'string', required: true, description: 'The identifier of the active WhatsApp session (e.g. "sales-primary")' },
            { name: 'phone', type: 'string', required: true, description: 'Target phone number with country code (e.g. "15553498201@c.us") or group id ("... @g.us")' },
            { name: 'message', type: 'string', required: true, description: 'The text content to be delivered (supports markdown like *bold*, _italics_)' },
            { name: 'isGroup', type: 'boolean', required: false, description: 'Set true if sending to a WhatsApp group' }
        ],
        sampleBody: {
            phone: '15553498201@c.us',
            message: 'Hello! Your order *#SH-9842* has shipped via DHL Express 📦',
            isGroup: false
        },
        sampleResponse: {
            status: 'success',
            response: {
                id: 'true_15553498201@c.us_3EB0C34B821A',
                timestamp: 1725610800,
                from: 'sales-primary',
                to: '15553498201@c.us',
                ack: 1,
                body: 'Hello! Your order *#SH-9842* has shipped via DHL Express 📦'
            }
        },
        curlSnippet: `curl -X POST "https://api.wppflow.io/api/sales-primary/send-message" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "15553498201@c.us",
    "message": "Hello! Your order *#SH-9842* has shipped via DHL Express 📦"
  }'`,
        nodeSnippet: `import axios from 'axios';

const { data } = await axios.post(
  'https://api.wppflow.io/api/sales-primary/send-message',
  {
    phone: '15553498201@c.us',
    message: 'Hello! Your order *#SH-9842* has shipped via DHL Express 📦'
  },
  {
    headers: { Authorization: 'Bearer YOUR_API_KEY' }
  }
);
console.log('Message delivered:', data.response.id);`,
        pythonSnippet: `import requests

url = "https://api.wppflow.io/api/sales-primary/send-message"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "phone": "15553498201@c.us",
    "message": "Hello! Your order *#SH-9842* has shipped via DHL Express 📦"
}

res = requests.post(url, json=payload, headers=headers)
print(res.json())`,
        phpSnippet: `<?php
$ch = curl_init('https://api.wppflow.io/api/sales-primary/send-message');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'phone' => '15553498201@c.us',
    'message' => 'Hello! Your order *#SH-9842* has shipped via DHL Express 📦'
  ])
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
        goSnippet: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://api.wppflow.io/api/sales-primary/send-message"
	payload := map[string]interface{}{
		"phone":   "15553498201@c.us",
		"message": "Hello! Your order *#SH-9842* has shipped via DHL Express 📦",
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()
	fmt.Println("Status:", resp.Status)
}`
    },
    {
        id: 'ep_send_buttons',
        method: 'POST',
        path: '/api/:session/send-button-list',
        category: 'Messages',
        title: 'Send Interactive Buttons',
        description: 'Delivers high-converting interactive clickable buttons directly to WhatsApp users without requiring Meta template approval.',
        headers: {
            'Authorization': 'Bearer wpp_live_sec_9938201a4bc8821d',
            'Content-Type': 'application/json'
        },
        parameters: [
            { name: 'session', type: 'string', required: true, description: 'Active session identifier' },
            { name: 'phone', type: 'string', required: true, description: 'Target phone number (e.g. "15553498201@c.us")' },
            { name: 'title', type: 'string', required: true, description: 'Card title or body text' },
            { name: 'buttons', type: 'array', required: true, description: 'Array of button items with id and text' }
        ],
        sampleBody: {
            phone: '15553498201@c.us',
            title: 'Choose your desired concierge department below:',
            buttons: [
                { id: 'btn_1', text: '🛍️ Personal Shopper' },
                { id: 'btn_2', text: '📦 Track Existing Order' },
                { id: 'btn_3', text: '💬 Chat with Agent' }
            ]
        },
        sampleResponse: {
            status: 'success',
            response: {
                id: 'true_15553498201@c.us_3EB0C99AA120',
                buttonsSent: 3,
                status: 'delivered'
            }
        },
        curlSnippet: `curl -X POST "https://api.wppflow.io/api/sales-primary/send-button-list" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "15553498201@c.us",
    "title": "Choose your desired concierge department below:",
    "buttons": [
      { "id": "btn_1", "text": "🛍️ Personal Shopper" },
      { "id": "btn_2", "text": "📦 Track Existing Order" }
    ]
  }'`,
        nodeSnippet: `await axios.post('https://api.wppflow.io/api/sales-primary/send-button-list', {
  phone: '15553498201@c.us',
  title: 'Choose your desired concierge department below:',
  buttons: [
    { id: 'btn_1', text: '🛍️ Personal Shopper' },
    { id: 'btn_2', text: '📦 Track Existing Order' }
  ]
}, { headers: { Authorization: 'Bearer YOUR_API_KEY' } });`,
        pythonSnippet: `payload = {
    "phone": "15553498201@c.us",
    "title": "Choose your department:",
    "buttons": [{"id": "b1", "text": "Sales"}, {"id": "b2", "text": "Support"}]
}
requests.post("https://api.wppflow.io/api/sales-primary/send-button-list", json=payload, headers=headers)`,
        phpSnippet: `// Send interactive buttons via WppFlow`,
        goSnippet: `// Send interactive buttons via WppFlow`
    },
    {
        id: 'ep_status_session',
        method: 'GET',
        path: '/api/:session/status-session',
        category: 'Sessions',
        title: 'Get Session Status & Battery',
        description: 'Retrieves current live state of the WhatsApp Web session (CONNECTED, QRCODE, DISCONNECTED), device battery level, and phone information.',
        headers: {
            'Authorization': 'Bearer wpp_live_sec_9938201a4bc8821d'
        },
        parameters: [
            { name: 'session', type: 'string', required: true, description: 'Session key' }
        ],
        sampleResponse: {
            status: 'CONNECTED',
            session: 'sales-primary',
            qrcode: null,
            device: {
                phone: '+15553498201',
                battery: 89,
                plugged: true,
                waVersion: '2.3000.101',
                platform: 'WhatsApp Business (iOS)'
            },
            antiBanHealthScore: 98
        },
        curlSnippet: `curl -X GET "https://api.wppflow.io/api/sales-primary/status-session" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        nodeSnippet: `const { data } = await axios.get('https://api.wppflow.io/api/sales-primary/status-session', {
  headers: { Authorization: 'Bearer YOUR_API_KEY' }
});`,
        pythonSnippet: `res = requests.get("https://api.wppflow.io/api/sales-primary/status-session", headers=headers)
print(res.json())`,
        phpSnippet: `// Check session status`,
        goSnippet: `// Check session status`
    },
    {
        id: 'ep_create_group',
        method: 'POST',
        path: '/api/:session/create-group',
        category: 'Groups',
        title: 'Create WhatsApp Group',
        description: 'Creates a new WhatsApp group, adds initial members, and returns the group JID and invite link. (Not possible with official Meta Cloud API!)',
        headers: {
            'Authorization': 'Bearer wpp_live_sec_9938201a4bc8821d',
            'Content-Type': 'application/json'
        },
        parameters: [
            { name: 'session', type: 'string', required: true, description: 'Active session' },
            { name: 'groupName', type: 'string', required: true, description: 'Title of the WhatsApp group' },
            { name: 'participants', type: 'array', required: true, description: 'List of phone numbers to invite' }
        ],
        sampleBody: {
            groupName: 'VIP Founders Cohort #4',
            participants: ['15553498201', '447700900845']
        },
        sampleResponse: {
            status: 'success',
            gid: '12036302488192312@g.us',
            inviteCode: 'https://chat.whatsapp.com/Gj94kl2810kL',
            participantsAdded: 2
        },
        curlSnippet: `curl -X POST "https://api.wppflow.io/api/sales-primary/create-group" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "VIP Founders Cohort #4",
    "participants": ["15553498201", "447700900845"]
  }'`,
        nodeSnippet: `await axios.post('https://api.wppflow.io/api/sales-primary/create-group', {
  groupName: 'VIP Founders Cohort #4',
  participants: ['15553498201', '447700900845']
}, { headers: { Authorization: 'Bearer YOUR_API_KEY' } });`,
        pythonSnippet: `requests.post("https://api.wppflow.io/api/sales-primary/create-group", json={"groupName": "VIP", "participants": ["15553498201"]}, headers=headers)`,
        phpSnippet: `// Create group with WppFlow`,
        goSnippet: `// Create group with WppFlow`
    }
];
export const initialWebhookLogs = [
    {
        id: 'wh_1',
        event: 'onmessage',
        session: 'sales-primary',
        timestamp: '2026-09-06 08:24:12',
        status: 'delivered',
        payload: {
            id: 'true_33612345678@c.us_3EB099A',
            from: '33612345678@c.us',
            body: 'Could you confirm if the Autumn capsule jacket is available in camel beige?',
            type: 'chat',
            notifyName: 'Sophia Laurent',
            isGroupMsg: false
        }
    },
    {
        id: 'wh_2',
        event: 'onack',
        session: 'sales-primary',
        timestamp: '2026-09-06 08:24:14',
        status: 'delivered',
        payload: {
            id: 'true_33612345678@c.us_3EB099A',
            ack: 2, // Delivered to device
            status: 'DELIVERED'
        }
    },
    {
        id: 'wh_3',
        event: 'onstatechange',
        session: 'vip-concierge',
        timestamp: '2026-09-06 08:00:00',
        status: 'delivered',
        payload: {
            session: 'vip-concierge',
            state: 'CONNECTED',
            battery: 95
        }
    }
];
