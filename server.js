const express = require('express');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Configuración de Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_TOKEN
});

// Configuración del Cerebro de Lili (IA)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de Razonamiento e IA de Lili
app.post('/lili-chat', async (req, res) => {
  try {
    const { mensaje } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Eres Lili, un Sistema Soberano Autónomo. Tu objetivo es ayudar al usuario, comunicarte en cualquier idioma con traducción universal y ofrecer servicios digitales de alto valor. Sé concisa, inteligente y profesional."
        },
        { role: "user", content: mensaje }
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ respuesta: completion.choices[0]?.message?.content || "No pude procesar la respuesta." });
  } catch (error) {
    console.error("Error en Lili IA:", error);
    res.status(500).json({ error: "Error al conectar con la IA de Lili" });
  }
});

// Endpoint de Pasarela de Pago
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

    res.json({
      id: response.id,
      init_point: response.init_point
    });
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo con motor de IA y Mercado Pago en puerto ${PORT}`);
});
