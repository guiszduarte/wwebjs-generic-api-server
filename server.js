const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config(); // Carrega variáveis de ambiente
const whatsappController = require('./controllers/whatsappController');
const tokenController = require('./controllers/tokenController');
const authMiddleware = require('./middleware/auth');
const websocketService = require('./services/websocketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicializar WebSocket
websocketService.initialize(server);

// Rota pública para verificar se o servidor está rodando
app.get('/', (req, res) => {
  const wsStats = websocketService.getConnectionStats();

  res.json({
    message: 'Servidor WhatsApp MultiCliente rodando!',
    version: '1.3.0',
    authentication: 'Token obrigatório para acessar as rotas da API',
    websocket: {
      enabled: true,
      url: `ws://localhost:${PORT}`,
      connections: wsStats.totalConnections,
      authenticated: wsStats.authenticatedConnections
    },
    endpoints: {
      // Endpoints de gerenciamento de tokens
      'POST /api/tokens/generate?token=MASTER_TOKEN': 'Gerar token para cliente específico',
      'POST /api/tokens/validate?token=SEU_TOKEN': 'Validar um token',
      'DELETE /api/tokens/revoke/:clientId?token=MASTER_TOKEN': 'Revogar token de cliente',
      'GET /api/tokens/list?token=MASTER_TOKEN': 'Listar tokens ativos',
      'GET /api/tokens/info?token=SEU_TOKEN': 'Informações do token atual',

      // Endpoints de cliente
      'POST /client/create?token=SEU_TOKEN': 'Criar novo cliente',
      'GET /client/:clientId/qr?token=SEU_TOKEN': 'Obter QR Code',
      'GET /client/:clientId/status?token=SEU_TOKEN': 'Status do cliente',
      'POST /client/:clientId/send?token=SEU_TOKEN': 'Enviar mensagem',
      'DELETE /client/:clientId?token=SEU_TOKEN': 'Remover cliente',
      'GET /clients?token=SEU_TOKEN': 'Listar todos os clientes',

      // Endpoints de mensagens
      'GET /client/:clientId/messages?token=SEU_TOKEN': 'Listar mensagens recebidas',
      'GET /client/:clientId/messages/latest?token=SEU_TOKEN': 'Últimas mensagens',
      'GET /client/:clientId/messages/search?token=SEU_TOKEN': 'Buscar mensagens',
      'GET /client/:clientId/messages/stats?token=SEU_TOKEN': 'Estatísticas de mensagens',
      'DELETE /client/:clientId/messages?token=SEU_TOKEN': 'Limpar mensagens',

      // Endpoints de grupos
      'GET /client/:clientId/groups?token=SEU_TOKEN': 'Listar grupos disponíveis',
      'GET /client/:clientId/groups/:groupName?token=SEU_TOKEN': 'Buscar grupo por nome',
      'GET /client/:clientId/groups/:groupName/info?token=SEU_TOKEN': 'Informações detalhadas do grupo',
      'GET /client/:clientId/groups/:groupName/messages?token=SEU_TOKEN': 'Mensagens do grupo',
      'POST /client/:clientId/groups/send?token=SEU_TOKEN': 'Enviar mensagem para grupo'
    },
    websocket_events: {
      'authenticate': 'Autenticar com token',
      'subscribe': 'Inscrever-se em um cliente',
      'unsubscribe': 'Cancelar inscrição',
      'list_clients': 'Listar clientes disponíveis',
      'new_message': 'Evento: Nova mensagem recebida',
      'client_status_change': 'Evento: Mudança de status',
      'qr_code': 'Evento: Novo QR Code'
    },
    note: 'Substitua SEU_TOKEN pelo token configurado na variável ACCESS_TOKEN'
  });
});

// Rotas de gerenciamento de tokens
app.post('/api/tokens/generate', authMiddleware, tokenController.generateToken);
app.post('/api/tokens/validate', authMiddleware, tokenController.validateToken);
app.delete('/api/tokens/revoke/:clientId', authMiddleware, tokenController.revokeToken);
app.get('/api/tokens/list', authMiddleware, tokenController.listTokens);
app.get('/api/tokens/info', authMiddleware, tokenController.getTokenInfo);

// Rotas de cliente (existentes)
app.post('/client/create', authMiddleware, whatsappController.createClient);
app.get('/client/:clientId/qr', authMiddleware, whatsappController.getQRCode);
app.get('/client/:clientId/status', authMiddleware, whatsappController.getStatus);
app.post('/client/:clientId/send', authMiddleware, whatsappController.sendMessage);
app.delete('/client/:clientId', authMiddleware, whatsappController.removeClient);
app.get('/clients', authMiddleware, whatsappController.listClients);

// Rotas para mensagens recebidas
app.get('/client/:clientId/messages', authMiddleware, whatsappController.getMessages);
app.get('/client/:clientId/messages/latest', authMiddleware, whatsappController.getLatestMessages);
app.get('/client/:clientId/messages/search', authMiddleware, whatsappController.searchMessages);
app.get('/client/:clientId/messages/stats', authMiddleware, whatsappController.getMessageStats);
app.delete('/client/:clientId/messages', authMiddleware, whatsappController.clearMessages);

// Rotas para interação com grupos
app.get('/client/:clientId/groups', authMiddleware, whatsappController.getGroups);
app.get('/client/:clientId/groups/:groupName', authMiddleware, whatsappController.findGroupByName);
app.get('/client/:clientId/groups/:groupName/info', authMiddleware, whatsappController.getGroupInfo);
app.get('/client/:clientId/groups/:groupName/messages', authMiddleware, whatsappController.getGroupMessages);
app.post('/client/:clientId/groups/send', authMiddleware, whatsappController.sendMessageToGroup);

// Nova rota para estatísticas do WebSocket
app.get('/websocket/stats', authMiddleware, (req, res) => {
  const stats = websocketService.getConnectionStats();
  res.json(stats);
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 WebSocket disponível em: ws://localhost:${PORT}`);

  // Aviso sobre configuração do token
  if (!process.env.ACCESS_TOKEN) {
    console.warn('⚠️  AVISO: ACCESS_TOKEN não configurado!');
    console.warn('   Configure a variável de ambiente ACCESS_TOKEN para maior segurança.');
    console.warn('   Exemplo: ACCESS_TOKEN=meu_token_secreto npm start');
  } else {
    console.log('🔒 Autenticação por token ativada');
  }

  console.log('📨 Sistema de mensagens recebidas ativo');
  console.log('🔌 WebSocket em tempo real ativo');
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  const whatsappService = require('./services/whatsappService');
  await whatsappService.destroyAllClients();
  process.exit(0);
});