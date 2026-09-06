import { ApiEndpoint, WebhookLog } from '../types';

export const cannedReplies = [
  { shortcut: '/hello', title: 'Warm Greeting', text: 'Hello! Thank you for reaching out. How may I assist you today?' },
  { shortcut: '/pricing', title: 'Pricing & Catalog', text: 'You can explore our entire catalog, sizes, and real-time inventory at our website.' },
  { shortcut: '/shipping', title: 'Shipping Policy', text: 'We offer express insured shipping worldwide. Domestic orders deliver in 2-3 business days; international orders arrive within 4-6 business days.' },
  { shortcut: '/refund', title: 'Hassle-Free Returns', text: 'We provide 30-day doorstep exchanges and full refunds on all unworn items. Let me know your order number and I can generate an instant return label for you!' }
];

export const apiEndpoints: ApiEndpoint[] = [
  {
    id: 'ep_send_message',
    method: 'POST',
    path: '/api/:session/send-message',
    category: 'Messages',
    title: 'Send Text Message',
    description: 'Sends a standard text message to any WhatsApp number or group.',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
    parameters: [
      { name: 'session', type: 'string', required: true, description: 'Active session identifier (e.g. "sales-primary")' },
      { name: 'phone', type: 'string', required: true, description: 'Target phone number (e.g. "15553498201@c.us")' },
      { name: 'message', type: 'string', required: true, description: 'Text content (supports *bold*, _italics_)' }
    ],
    sampleBody: { phone: '15553498201@c.us', message: 'Hello! Your order *#SH-9842* has shipped 📦' },
    sampleResponse: { status: 'success', response: { id: 'true_15553498201@c.us_3EB0C34B821A', ack: 1 } },
    curlSnippet: `curl -X POST "https://wppflow-backend-production.up.railway.app/api/sessions/sales-primary/send-message" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"15553498201@c.us","message":"Hello!"}'`,
    nodeSnippet: `const res = await fetch('/api/sessions/sales-primary/send-message', {
  method: 'POST',
  headers: { Authorization: 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '15553498201@c.us', message: 'Hello!' })
});`,
    pythonSnippet: `import requests
res = requests.post(
  'https://wppflow-backend-production.up.railway.app/api/sessions/sales-primary/send-message',
  json={'phone': '15553498201@c.us', 'message': 'Hello!'},
  headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`,
    phpSnippet: `// Send message via WppFlow`,
    goSnippet: `// Send message via WppFlow`
  },
  {
    id: 'ep_send_buttons',
    method: 'POST',
    path: '/api/sessions/:session/send-buttons',
    category: 'Messages',
    title: 'Send Interactive Buttons',
    description: 'Delivers interactive clickable buttons without requiring Meta template approval.',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY', 'Content-Type': 'application/json' },
    parameters: [
      { name: 'session', type: 'string', required: true, description: 'Active session identifier' },
      { name: 'phone', type: 'string', required: true, description: 'Target phone number' },
      { name: 'title', type: 'string', required: true, description: 'Card title or body text' },
      { name: 'buttons', type: 'array', required: true, description: 'Array of {id, text} button objects' }
    ],
    sampleBody: { phone: '15553498201@c.us', title: 'How can we help?', buttons: [{ id: 'b1', text: '🛍️ Sales' }, { id: 'b2', text: '📦 Track Order' }] },
    sampleResponse: { status: 'success', response: { buttonsSent: 2, status: 'delivered' } },
    curlSnippet: `curl -X POST "https://wppflow-backend-production.up.railway.app/api/sessions/sales-primary/send-buttons" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"15553498201@c.us","title":"How can we help?","buttons":[{"id":"b1","text":"Sales"}]}'`,
    nodeSnippet: `// POST /api/sessions/:session/send-buttons`,
    pythonSnippet: `# POST /api/sessions/:session/send-buttons`,
    phpSnippet: `// Send buttons via WppFlow`,
    goSnippet: `// Send buttons via WppFlow`
  },
  {
    id: 'ep_session_status',
    method: 'GET',
    path: '/api/sessions/:session/status',
    category: 'Sessions',
    title: 'Get Session Status',
    description: 'Returns current state (CONNECTED, QRCODE, DISCONNECTED), battery level, and phone info.',
    headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
    parameters: [{ name: 'session', type: 'string', required: true, description: 'Session key' }],
    sampleResponse: { status: 'success', sessionStatus: 'CONNECTED', phone: '+15553498201', battery: 89 },
    curlSnippet: `curl "https://wppflow-backend-production.up.railway.app/api/sessions/sales-primary/status" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    nodeSnippet: `const res = await fetch('/api/sessions/sales-primary/status', { headers: { Authorization: 'Bearer YOUR_API_KEY' } });`,
    pythonSnippet: `res = requests.get('/api/sessions/sales-primary/status', headers={'Authorization': 'Bearer YOUR_API_KEY'})`,
    phpSnippet: `// GET session status`,
    goSnippet: `// GET session status`
  }
];

export const initialWebhookLogs: WebhookLog[] = [
  {
    id: 'wh_1', event: 'onmessage', session: 'sales-primary',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'delivered',
    payload: { from: '33612345678@c.us', body: 'Hello, I have a question about my order.', type: 'chat', isGroupMsg: false }
  }
];
