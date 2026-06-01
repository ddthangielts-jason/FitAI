module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const key = process.env.STRIPE_SECRET_KEY;
  const priceAnnual = process.env.STRIPE_PRICE_ANNUAL || 'price_xxx';
  const priceMonthly = process.env.STRIPE_PRICE_MONTHLY || 'price_xxx';
  const base = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

  if (!key) return res.status(200).json({ error: 'Stripe chưa cấu hình' });

  try {
    const { plan } = req.body;
    const priceId = plan === 'yr' ? priceAnnual : priceMonthly;
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${base}/app.html?pro=true`,
        'cancel_url': `${base}/app.html`,
        'subscription_data[trial_period_days]': '7'
      })
    });
    const data = await r.json();
    return res.status(200).json({ url: data.url });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
