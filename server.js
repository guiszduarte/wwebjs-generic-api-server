const express = require('express');
const cors = require('cors');
const whatsappController = require('./controllers/whatsappController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor WhatsApp MultiCliente rodando!',
    endpoints: {
      'POST /client/create': 'Criar novo cliente',
      'GET /client/:clientId/qr': 'Obter QR Code',
      'GET /client/:clientId/status': 'Status do cliente',
      'POST /client/:clientId/send': 'Enviar mensagem',
      'DELETE /client/:clientId': 'Remover cliente',
      'GET /clients': 'Listar todos os clientes'
    }
  });
});

app.post('/client/create', whatsappController.createClient);
app.get('/client/:clientId/qr', whatsappController.getQRCode);
app.get('/client/:clientId/status', whatsappController.getStatus);
app.post('/client/:clientId/send', whatsappController.sendMessage);
app.delete('/client/:clientId', whatsappController.removeClient);
app.get('/clients', whatsappController.listClients);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  const whatsappService = require('./services/whatsappService');
  await whatsappService.destroyAllClients();
  process.exit(0);
});