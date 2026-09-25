const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});
const preference = new Preference(client);

app.get('/', (req, res) => {
    res.json({
        sistema: "Lili Autonomous Engine",
        estado: "ONLINE",
        pasarela: "MercadoPago OK"
    });
});

app.post('/vender-servicio', async (req, res) => {
    try {
        const { servicio, precio } = req.body;
        const response = await preference.create({
            body: {
                items: [{
                    title: servicio || 'Servicio Digital Lili',
                    unit_price: Number(precio) || 150,
                    quantity: 1,
                    currency_id: 'MXN'
                }]
            }
        });
        res.json({ status: "OK", pago_url: response.init_point });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
