// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     const { cart } = req.body;

//     // PREPARA OS METADADOS DA SESSÃO

//     const sessionMetadata = {};
//     cart.forEach((photo, index) => {
//       sessionMetadata[`photo_${index}`] = photo.id;
//     });

//     // Cria a sessão de checkout no Stripe
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: cart.map(photo => ({
//         price_data: {
//           currency: 'brl',
//           product_data: {
//             name: photo.name || 'Foto Digital (Alta Resolução)',
//             images: [photo.thumbnail_url],
//           },
//           unit_amount: Math.round(Number(photo.price) * 100), // Convertendo para centavos
//         },
//         quantity: 1,
//       })),
//       mode: 'payment',
//       metadata: sessionMetadata,
//       success_url: `${req.headers.origin}/?success=true`,
//       cancel_url: `${req.headers.origin}/?canceled=true`,
//     });

//     res.status(200).json({ url: session.url });
//   } catch (error) {
//     console.error('Erro no Stripe:', error);
//     res.status(500).json({ error: 'Erro ao criar sessão de pagamento' });
//   }
// }

import Stripe from 'stripe';

export default async function handler(req, res) {
  // Trava de segurança para aceitar apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Trazemos a inicialização para DENTRO do try/catch
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('A chave STRIPE_SECRET_KEY não foi encontrada!');
    }

    const stripe = new Stripe(secretKey);
    const { cart } = req.body;

    // 2. Prepara os metadados
    const sessionMetadata = {};
    cart.forEach((photo, index) => {
      sessionMetadata[`photo_${index}`] = photo.id;
    });

    // 3. Cria a sessão de checkout
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
    // 4. Agora sim! Se explodir, ele avisa no terminal e não derruba o servidor.
    console.error('🔥 Erro Crítico no Backend do Stripe:', error.message);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento' });
  }
}
