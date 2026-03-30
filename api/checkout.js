import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cart } = req.body;

    // PREPARA OS METADADOS DA SESSÃO

    const sessionMetadata = {};
    cart.forEach((photo, index) => {
      sessionMetadata[`photo_${index}`] = photo.id;
    });

    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cart.map(photo => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: photo.name || 'Foto Digital (Alta Resolução)',
            images: [photo.thumbnail_url],
          },
          unit_amount: Math.round(Number(photo.price) * 100), // Convertendo para centavos
        },
        quantity: 1,
      })),
      mode: 'payment',
      metadata: sessionMetadata,
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erro no Stripe:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento' });
  }
}
