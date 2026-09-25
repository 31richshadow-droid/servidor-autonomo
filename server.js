import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Groq from 'groq-sdk';

const app = express();
app.use(cors());
app.use(express.json());

// Clientes de integración
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});
const preference = new Preference(client);

let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// 1. Endpoint base de servicio
app.get('/', (req, res) => {
    res.json({
        sistema: "Lili Autonomous Engine",
        estado: "ONLINE",
        endpoints: ["/lili-chat", "/crear-preferencia", "/vender-servicio"]
    });
});

// 2. Chat de Inteligencia
app.post('/lili-chat', async (req, res) => {
    try {
        const { mensaje } = req.body;
        if (!groq) {
            return res.json({ respuesta: 'Lili activa sin GROQ_API_KEY.' });
        }
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'Eres Lili, un agente virtual autónomo de servicios digitales y ventas.' },
                { role: 'user', content: mensaje }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        res.json({ respuesta: chatCompletion.choices[0]?.message?.content || 'Sin respuesta' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Generador Autónomo de Enlaces de Cobro
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
                }],
                back_urls: {
                    success: "https://servidor-autonomo.onrender.com",
                    failure: "https://servidor-autonomo.onrender.com"
                },
                auto_return: "approved"
            }
        });

        res.json({
            status: "OK",
            mensaje: `Enlace generado para ${servicio || 'Servicio Digital'}`,
            pago_url: response.init_point
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Lili activa en puerto ${PORT}`));
