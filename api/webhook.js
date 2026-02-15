import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`⚠️ Erro na assinatura: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💰 PAGAMENTO APROVADO! Sessão:', session.id);

      // 1. Puxa todas as "gavetinhas" de fotos que mandamos no checkout
      const photoIds = Object.keys(session.metadata)
        .filter(key => key.startsWith('photo_'))
        .map(key => session.metadata[key]);

      if (photoIds.length > 0) {
        // 2. Vai no Supabase e muda o is_paid para TRUE em todas as fotos!
        const { data, error } = await supabase
          .from('photos')
          .update({ is_paid: true })
          .in('id', photoIds); // Atualiza várias de uma vez só!

        if (error) {
          console.error('❌ Erro ao liberar fotos no banco:', error);
        } else {
          console.log(`✅ SUCESSO! ${photoIds.length} fotos foram liberadas!`);
        }
      } else {
        console.log(
          '⚠️ Pagamento caiu, mas nenhuma foto foi encontrada nos metadados.'
        );
      }
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
