const express = require('express');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Clave de Groq
const groqApiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey: groqApiKey });

// Clave de Mercado Pago
const mpToken = process.env.MERCADOPAGO_TOKEN || '';
const mpClient = new MercadoPagoConfig({ accessToken: mpToken });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint Lili IA
app.post('/lili-chat', async (req, res) => {
  try {
    if (!groqApiKey) {
      return res.status(500).json({ error: "Falta la variable GROQ_API_KEY en Render." });
    }
    const { mensaje } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Eres Lili, un Sistema Soberano Autónomo. Tu objetivo es ayudar al usuario, comunicarte en cualquier idioma y ofrecer servicios digitales. Sé concisa, inteligente y profesional."
        },
        { role: "user", content: mensaje || "Hola" }
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ respuesta: completion.choices[0]?.message?.content || "Sin respuesta." });
  } catch (error) {
    console.error("Error Lili IA:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Pago
app.post('/crear-pago', async (req, res) => {
  try {
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: [
          {
            title: req.body.titulo || 'Servicio Digital Lili',
            unit_price: Number(req.body.precio) || 100,
            quantity: 1,
            currency_id: 'MXN'
          }
        ]
      }
    });

    res.json({ id: response.id, init_point: response.init_point });
  } catch (error) {
    console.error('Error Pago:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Lili activo en puerto ${PORT}`);
});
