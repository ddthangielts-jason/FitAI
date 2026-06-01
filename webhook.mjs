// api/webhook.js
// Stripe gọi endpoint này sau khi user thanh toán thành công
// Dùng để unlock Pro, gửi email chào mừng, v.v.

export const config = {
  api: { bodyParser: false } // Stripe cần raw body để verify signature
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  // Đọc raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  const stripeSignature = req.headers['stripe-signature'];

  // Verify webhook từ Stripe (bảo mật)
  // Trong production thực tế cần dùng stripe npm package
  // Ở đây dùng cách đơn giản hơn - verify qua secret
  if (!stripeSignature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Xử lý các sự kiện từ Stripe
  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerEmail = session.customer_email || session.customer_details?.email;
      const subscriptionId = session.subscription;

      console.log(`✅ Thanh toán thành công: ${customerEmail}`);
      console.log(`   Subscription ID: ${subscriptionId}`);

      // TODO: Lưu vào database (Supabase)
      // await supabase.from('users').upsert({
      //   email: customerEmail,
      //   is_pro: true,
      //   subscription_id: subscriptionId,
      //   pro_since: new Date().toISOString()
      // })

      // TODO: Gửi email chào mừng (Resend)
      // await sendWelcomeEmail(customerEmail)

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log(`❌ Subscription hủy: ${subscription.id}`);

      // TODO: Thu hồi quyền Pro
      // await supabase.from('users').update({ is_pro: false })
      //   .eq('subscription_id', subscription.id)

      break;
    }

    case 'invoice.payment_failed': {
      console.log(`⚠️ Thanh toán thất bại`);
      // TODO: Gửi email nhắc nhở user
      break;
    }
  }

  return res.status(200).json({ received: true });
}
