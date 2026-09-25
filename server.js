const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_AQUI';

const client = new MercadoPagoConfig({ 
    accessToken: MP_TOKEN 
});
const preference = new Preference(client);

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Servidor Autónomo</title>
            <style>
                body { font-family: sans-serif; background: #121212; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: #1e1e1e; padding: 2rem; border-radius: 12px; text-align: center; width: 90%; max-width: 350px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                input { width: 100%; padding: 10px; margin: 10px 0; border-radius: 6px; border: 1px solid #333; background: #2a2a2a; color: #fff; box-sizing: border-box; }
                button { width: 100%; padding: 12px; border: none; border-radius: 6px; background: #009ee3; color: white; font-weight: bold; cursor: pointer; }
                a { color: #00e676; text-decoration: none; font-weight: bold; display: block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>🚀 Servidor Autónomo</h2>
                <p>Generar enlace de cobro</p>
                <input type="text" id="servicio" value="Servicio Digital" placeholder="Nombre del servicio">
                <input type="number" id="precio" value="150" placeholder="Precio MXN">
                <button onclick="generarPago()">Crear Enlace de Pago</button>
                <div id="resultado"></div>
            </div>
            <script>
                async function generarPago() {
                    const servicio = document.getElementById('servicio').value;
                    const precio = document.getElementById('precio').value;
                    const div = document.getElementById('resultado');
                    div.innerHTML = '<p>Cargando...</p>';
                    try {
                        const res = await fetch('/crear-preferencia', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ titulo: servicio, precio })
                        });
                        const data = await res.json();
                        if (data.init_point) {
                            div.innerHTML = '<a href="' + data.init_point + '" target="_blank">✅ Click aquí para Pagar $' + precio + ' MXN</a>';
                        } else {
                            div.innerHTML = '❌ Error al crear el pago';
                        }
                    } catch (err) {
                        div.innerHTML = '❌ Error de conexión';
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/crear-preferencia', async (req, res) => {
    try {
        const { titulo, precio } = req.body;
        const response = await preference.create({
            body: {
                items: [{
                    title: titulo || 'Servicio Digital Lili',
                    unit_price: Number(precio) || 150,
                    quantity: 1,
                    currency_id: 'MXN'
                }]
            }
        });
        res.json({ init_point: response.init_point });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
