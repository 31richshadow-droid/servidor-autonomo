import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Inicializar Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' 
});
const preference = new Preference(client);

// Inicializar Groq
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Ruta principal para servir la interfaz gráfica
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint de chat con Lili
app.post('/lili-chat', async (req, res) => {
    try {
        const { mensaje } = req.body;
        if (!groq) {
            return res.json({ respuesta: 'Hola, soy Lili. Mi módulo de IA aún no tiene configurada la GROQ_API_KEY en Render, pero el servidor está activo.' });
        }
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'Eres Lili, una asistente virtual inteligente y autónoma. Respondes de forma concisa, profesional y empática en español.' },
                { role: 'user', content: mensaje }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const respuesta = chatCompletion.choices[0]?.message?.content || 'Sin respuesta';
        res.json({ respuesta });
    } catch (error) {
        console.error('Error en Lili Chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para crear preferencia de pago
app.post('/crear-preferencia', async (req, res) => {
    try {
        const response = await preference.create({
            body: {
                items: [{
                    title: req.body.titulo || 'Servicio Digital Lili',
                    unit_price: Number(req.body.precio) || 100,
                    quantity: 1,
                    currency_id: 'MXN'
                }]
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
