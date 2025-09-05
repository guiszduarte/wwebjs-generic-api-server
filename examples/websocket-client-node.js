/**
 * Exemplo de cliente WebSocket em Node.js
 * Para usar: node examples/websocket-client-node.js
 */

const io = require('socket.io-client');

class WhatsAppWebSocketClient {
  constructor(serverUrl, token) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.socket = null;
    this.isAuthenticated = false;
    this.subscribedClients = [];
  }

  connect() {
    console.log(`🔌 Conectando ao servidor: ${this.serverUrl}`);
    
    this.socket = io(this.serverUrl);

    // Eventos de conexão
    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket');
      console.log(`🆔 Socket ID: ${this.socket.id}`);
      
      // Autenticar automaticamente
      this.authenticate();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor');
      this.isAuthenticated = false;
      this.subscribedClients = [];
    });

    // Eventos de autenticação
    this.socket.on('authenticated', (data) => {
      console.log('🔐 Autenticado com sucesso:', data.message);
      this.isAuthenticated = true;
      
      // Listar clientes disponíveis
      this.listClients();
    });

    this.socket.on('authentication_error', (data) => {
      console.error('❌ Erro de autenticação:', data.message);
      process.exit(1);
    });

    // Eventos de inscrição
    this.socket.on('subscribed', (data) => {
      console.log(`📱 Inscrito no cliente: ${data.clientId}`);
      if (!this.subscribedClients.includes(data.clientId)) {
        this.subscribedClients.push(data.clientId);
      }
    });

    this.socket.on('unsubscribed', (data) => {
      console.log(`📱 Cancelou inscrição do cliente: ${data.clientId}`);
      const index = this.subscribedClients.indexOf(data.clientId);
      if (index > -1) {
        this.subscribedClients.splice(index, 1);
      }
    });

    this.socket.on('subscription_error', (data) => {
      console.error('❌ Erro na inscrição:', data.message);
    });

    // Eventos de clientes
    this.socket.on('clients_list', (data) => {
      console.log('\n📋 Clientes disponíveis:');
      data.clients.forEach(client => {
        console.log(`  • ${client.clientId} - Status: ${client.status} - Mensagens: ${client.messageCount}`);
      });
      
      console.log('\n📱 Inscrições ativas:', data.subscribedTo);
      
      // Se não há inscrições, perguntar qual cliente inscrever
      if (data.subscribedTo.length === 0 && data.clients.length > 0) {
        const firstClient = data.clients[0].clientId;
        console.log(`\n🔄 Inscrevendo automaticamente no primeiro cliente: ${firstClient}`);
        this.subscribe(firstClient);
      }
    });

    // Eventos em tempo real
    this.socket.on('new_message', (data) => {
      this.handleNewMessage(data);
    });

    this.socket.on('client_status_change', (data) => {
      console.log(`📱 Status do cliente ${data.clientId} alterado para: ${data.status}`);
    });

    this.socket.on('qr_code', (data) => {
      console.log(`📱 Novo QR Code disponível para cliente: ${data.clientId}`);
    });

    // Tratamento de erros
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error.message);
    });
  }

  authenticate() {
    if (!this.socket) return;
    
    console.log('🔐 Autenticando...');
    this.socket.emit('authenticate', { token: this.token });
  }

  listClients() {
    if (!this.socket || !this.isAuthenticated) return;
    
    this.socket.emit('list_clients');
  }

  subscribe(clientId) {
    if (!this.socket || !this.isAuthenticated) return;
    
    console.log(`📱 Inscrevendo-se no cliente: ${clientId}`);
    this.socket.emit('subscribe', { clientId });
  }

  unsubscribe(clientId) {
    if (!this.socket || !this.isAuthenticated) return;
    
    console.log(`📱 Cancelando inscrição do cliente: ${clientId}`);
    this.socket.emit('unsubscribe', { clientId });
  }

  handleNewMessage(data) {
    const msg = data.message;
    const contact = msg.contact;
    
    console.log('\n📨 NOVA MENSAGEM RECEBIDA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🆔 Cliente: ${data.clientId}`);
    console.log(`👤 De: ${contact.name || contact.number}`);
    console.log(`📞 Número: ${contact.number}`);
    console.log(`📱 ID: ${contact.id}`);
    
    if (msg.isGroup && msg.chat) {
      console.log(`👥 Grupo: ${msg.chat.name}`);
      console.log(`👥 Participantes: ${msg.chat.participantsCount || 'N/A'}`);
    }
    
    console.log(`💬 Mensagem: ${msg.body || '[Sem texto]'}`);
    console.log(`📝 Tipo: ${msg.type}`);
    
    if (msg.hasMedia) {
      console.log(`📎 Mídia: ${msg.media?.mimetype || 'Tipo desconhecido'}`);
      console.log(`📏 Tamanho: ${msg.media?.size ? (msg.media.size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
    }
    
    if (msg.location) {
      console.log(`📍 Localização: ${msg.location.latitude}, ${msg.location.longitude}`);
      if (msg.location.description) {
        console.log(`📍 Descrição: ${msg.location.description}`);
      }
    }
    
    if (msg.quotedMsg) {
      console.log(`💬 Respondendo a: ${msg.quotedMsg.body}`);
    }
    
    console.log(`🕐 Timestamp: ${new Date(msg.timestamp).toLocaleString()}`);
    console.log(`✅ Contato salvo: ${contact.isMyContact ? 'Sim' : 'Não'}`);
    console.log(`🔄 Encaminhada: ${msg.isForwarded ? 'Sim' : 'Não'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando...');
      this.socket.disconnect();
    }
  }
}

// Configuração
const SERVER_URL = process.env.WEBSOCKET_URL || 'ws://localhost:3000';
const TOKEN = process.env.ACCESS_TOKEN || '';

if (!TOKEN) {
  console.error('❌ Token de acesso não fornecido!');
  console.log('💡 Use: ACCESS_TOKEN=seu_token node examples/websocket-client-node.js');
  console.log('💡 Ou: WEBSOCKET_URL=ws://seu-servidor:3000 ACCESS_TOKEN=seu_token node examples/websocket-client-node.js');
  process.exit(1);
}

// Inicializar cliente
const client = new WhatsAppWebSocketClient(SERVER_URL, TOKEN);

console.log('🚀 Iniciando cliente WebSocket...');
console.log(`🌐 Servidor: ${SERVER_URL}`);
console.log(`🔑 Token: ${TOKEN.substring(0, 10)}...`);
console.log('');

client.connect();

// Tratamento de sinais para encerramento graceful
process.on('SIGINT', () => {
  console.log('\n🔄 Encerrando cliente...');
  client.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Encerrando cliente...');
  client.disconnect();
  process.exit(0);
});

// Manter o processo rodando
process.stdin.resume();