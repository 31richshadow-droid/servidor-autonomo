const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());

// Inicializar cliente de Mercado Pago usando la variable de entorno
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_TOKEN
});

// Ruta principal para probar conexión
app.get('/', (req, res) => {
  res.send('Servidor activo con integración de Mercado Pago 🚀');
});

// Ruta para crear una preferencia de pago
app.post('/crear-pago', async (req, res) => {
  try {
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            title: req.body.titulo || 'Producto de prueba',
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
