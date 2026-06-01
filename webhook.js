module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  // Handle Stripe webhooks here
  return res.status(200).json({ received: true });
}
