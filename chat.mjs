// api/chat.js — FitAI AI Proxy

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({
      content: [{ type: 'text', text: 'API key chưa được cấu hình. Vào Vercel → Settings → Environment Variables → thêm ANTHROPIC_API_KEY.' }]
    });
  }

  try {
    const { messages, system, max_tokens = 800 } = req.body;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ content: [{ type: 'text', text: 'Invalid request.' }] });
    }

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: Math.min(max_tokens, 1000),
      messages,
    };
    if (system) body.system = system;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(200).json({
        content: [{ type: 'text', text: `Lỗi từ AI (${response.status}). Thử lại sau.` }]
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(200).json({
      content: [{ type: 'text', text: 'Lỗi kết nối AI. Kiểm tra API key và thử lại.' }]
    });
  }
}
