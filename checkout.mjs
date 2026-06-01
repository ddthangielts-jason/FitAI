// api/checkout.js
// Tạo Stripe Checkout Session để thu tiền user

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  // ==============================================
  // ĐIỀN PRICE ID CỦA BẠN VÀO ĐÂY
  // Lấy từ: Stripe Dashboard → Products → FitAI Pro → Prices
  const PRICE_ANNUAL  = process.env.STRIPE_PRICE_ANNUAL  || 'price_annual_xxx';
  const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_xxx';
  // ==============================================

  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe chưa được cấu hình' });
  }

  try {
    const { plan, email } = req.body; // plan = 'annual' hoặc 'monthly'

    const priceId = plan === 'annual' ? PRICE_ANNUAL : PRICE_MONTHLY;

    // Lấy base URL của app
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

    // Gọi Stripe API tạo checkout session
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${baseUrl}/app.html?pro=true&session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${baseUrl}/app.html`,
        'customer_email': email || '',
        // Dùng thử 7 ngày miễn phí
        'subscription_data[trial_period_days]': '7',
        'payment_method_types[0]': 'card',
        // Cho phép thanh toán bằng nhiều phương thức
        'locale': 'vi'
      })
    });

    const session = await stripeRes.json();

    if (session.error) {
      return res.status(400).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url });

  } catch (error) {
    return res.status(500).json({ error: 'Lỗi tạo checkout', detail: error.message });
  }
}
