const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(express.json());

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || 'TU_TOKEN_MERCADO_PAGO' 
});

let estadoSistema = {
  fondoReservaInterno: 0,
  gananciasUsuario: 0,
  replicasActivas: 1,
  maxReplicas: 100,
  modoGratuito: true,
  ideasPropuestas: []
};

const PORCENTAJE_USUARIO = 0.30;
const PORCENTAJE_RESERVA = 0.70;
const COSTO_NUEVA_REPLICA = 100.00;

app.post('/api/crear-cobro', async (req, res) => {
  try {
    const { titulo, precio } = req.body;
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            title: titulo || 'Servicio Digital Automatizado',
            unit_price: Number(precio),
            quantity: 1,
            currency_id: 'MXN'
          }
        ],
        notification_url: 'https://tu-servidor-gratis.onrender.com/api/webhook-pagos'
      }
    });
    res.json({ init_point: result.init_point });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar cobro', detalle: error.message });
  }
});

app.post('/api/webhook-pagos', (req, res) => {
  const { action } = req.body;
  if (action === 'payment.created' || req.body.monto) {
    const montoTotal = Number(req.body.monto || 100);
    const asignadoUsuario = montoTotal * PORCENTAJE_USUARIO;
    const asignadoReserva = montoTotal * PORCENTAJE_RESERVA;

    estadoSistema.gananciasUsuario += asignadoUsuario;
    estadoSistema.fondoReservaInterno += asignadoReserva;

    evaluarEvolucion();
    return res.status(200).send('Pago procesado correctamente');
  }
  res.status(200).send('OK');
});

function evaluarEvolucion() {
  if (estadoSistema.fondoReservaInterno >= COSTO_NUEVA_REPLICA && estadoSistema.replicasActivas < estadoSistema.maxReplicas) {
    estadoSistema.replicasActivas += 1;
    estadoSistema.fondoReservaInterno -= COSTO_NUEVA_REPLICA;
    estadoSistema.ideasPropuestas.push(`Réplica #${estadoSistema.replicasActivas} activada exitosamente con fondos propios.`);
  }

  if (estadoSistema.fondoReservaInterno > 50 && estadoSistema.modoGratuito) {
    estadoSistema.modoGratuito = false;
    estadoSistema.ideasPropuestas.push('Fondos suficientes detectados. Sistema listo para escalar servidores.');
  }
}

app.get('/api/estado', (req, res) => {
  res.json({
    replicasActivas: estadoSistema.replicasActivas,
    maxReplicas: estadoSistema.maxReplicas,
    fondoReserva: estadoSistema.fondoReservaInterno.toFixed(2),
    tusGanancias: estadoSistema.gananciasUsuario.toFixed(2),
    modoGratuito: estadoSistema.modoGratuito,
    bitacoraIdeas: estadoSistema.ideasPropuestas
  });
});

const PORT = process.env.PORT || process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Autónomo ejecutándose en puerto ${PORT}`);
});
