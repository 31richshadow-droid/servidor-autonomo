const express = require('express');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());

// Servir la interfaz web estática
app.use(express.static(__dirname));

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_TOKEN
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/crear-pago', async (req, res) => {
  try {
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            title: req.body.titulo || 'Producto',
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
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
