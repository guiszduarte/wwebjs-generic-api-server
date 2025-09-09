/**
 * Serviço WebSocket para comunicação em tempo real
 * Gerencia conexões, autenticação e eventos de mensagens
 */

const tokenService = require('./tokenService');

class WebSocketService {
  constructor() {
    this.io = null;
    this.authenticatedClients = new Map(); // Map de socket.id -> { clientIds: [], tokenData: {} }
  }

  initialize(server) {
    const { Server } = require('socket.io');

    this.io = new Server(server, {
      cors: {
        origin: "*", // Em produção, configure origins específicas
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente WebSocket conectado: ${socket.id}`);

      // Evento de autenticação
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Evento para se inscrever em um cliente WhatsApp específico
      socket.on('subscribe', (data) => {
        this.handleSubscription(socket, data);
      });

      // Evento para cancelar inscrição
      socket.on('unsubscribe', (data) => {
        this.handleUnsubscription(socket, data);
      });

      // Evento de desconexão
      socket.on('disconnect', () => {
        console.log(`🔌 Cliente WebSocket desconectado: ${socket.id}`);
        this.authenticatedClients.delete(socket.id);
      });

      // Evento para listar clientes disponíveis
      socket.on('list_clients', () => {
        this.handleListClients(socket);
      });
    });

    console.log('🌐 Servidor WebSocket inicializado');
  }

  handleAuthentication(socket, data) {
    const { token } = data;
    const masterToken = process.env.ACCESS_TOKEN;

    // Verificar se não há token master configurado (modo desenvolvimento)
    if (!masterToken) {
      console.warn('⚠️  ACCESS_TOKEN não configurado - permitindo conexão');
      this.authenticatedClients.set(socket.id, {
        clientIds: [],
        tokenData: { clientId: '*', isMaster: true, isValid: true }
      });
      socket.emit('authenticated', { success: true, message: 'Autenticado (modo desenvolvimento)' });
      return;
    }

    if (!token) {
      socket.emit('authentication_error', {
        error: 'Token inválido ou não fornecido',
        message: 'Forneça um token válido para autenticação'
      });
      return;
    }

    // Valida o token usando o serviço de tokens
    const tokenValidation = tokenService.validateToken(token);

    if (!tokenValidation || !tokenValidation.isValid) {
      socket.emit('authentication_error', {
        error: 'Token inválido ou expirado',
        message: 'O token fornecido não é válido ou expirou'
      });
      return;
    }

    // Token válido
    this.authenticatedClients.set(socket.id, {
      clientIds: [],
      tokenData: tokenValidation
    });

    socket.emit('authenticated', {
      success: true,
      message: 'Autenticado com sucesso',
      socketId: socket.id,
      clientId: tokenValidation.clientId,
      isMaster: tokenValidation.isMaster
    });

    console.log(`🔐 Cliente ${socket.id} autenticado via WebSocket (clientId: ${tokenValidation.clientId})`);
  }

  handleSubscription(socket, data) {
    const clientData = this.authenticatedClients.get(socket.id);

    if (!clientData) {
      socket.emit('subscription_error', {
        error: 'Não autenticado',
        message: 'Faça a autenticação antes de se inscrever'
      });
      return;
    }

    const { clientId } = data;
    if (!clientId) {
      socket.emit('subscription_error', {
        error: 'clientId obrigatório',
        message: 'Forneça o ID do cliente WhatsApp'
      });
      return;
    }

    // Verifica se o token tem permissão para acessar este clientId
    if (!tokenService.hasPermission(clientData.tokenData.clientId, clientId)) {
      socket.emit('subscription_error', {
        error: 'Acesso negado',
        message: `Token não tem permissão para acessar o cliente ${clientId}`
      });
      return;
    }

    try {
      // Adiciona o clientId à lista de inscrições se não estiver já inscrito
      if (!clientData.clientIds.includes(clientId)) {
        clientData.clientIds.push(clientId);
        this.authenticatedClients.set(socket.id, clientData);
      }

      socket.emit('subscribed', {
        success: true,
        clientId,
        message: `Inscrito no cliente ${clientId}`
      });

      console.log(`📱 Cliente ${socket.id} inscrito no WhatsApp cliente: ${clientId}`);
    } catch (error) {
      socket.emit('subscription_error', {
        error: error.message,
        clientId
      });
    }
  }

  handleUnsubscription(socket, data) {
    const clientData = this.authenticatedClients.get(socket.id);

    if (!clientData) {
      return;
    }

    const { clientId } = data;
    const index = clientData.clientIds.indexOf(clientId);

    if (index > -1) {
      clientData.clientIds.splice(index, 1);
      this.authenticatedClients.set(socket.id, clientData);

      socket.emit('unsubscribed', {
        success: true,
        clientId,
        message: `Cancelada inscrição do cliente ${clientId}`
      });

      console.log(`📱 Cliente ${socket.id} cancelou inscrição do WhatsApp cliente: ${clientId}`);
    }
  }

  handleListClients(socket) {
    const clientData = this.authenticatedClients.get(socket.id);

    if (!clientData) {
      socket.emit('clients_list_error', {
        error: 'Não autenticado'
      });
      return;
    }

    try {
      const whatsappService = require('./whatsappService');
      const allClients = whatsappService.listClients();

      // Se não é master, filtra apenas os clientes que o token pode acessar
      let clients = allClients;
      if (!clientData.tokenData.isMaster) {
        clients = allClients.filter(client =>
          tokenService.hasPermission(clientData.tokenData.clientId, client.clientId)
        );
      }

      socket.emit('clients_list', {
        clients,
        subscribedTo: clientData.clientIds
      });
    } catch (error) {
      socket.emit('clients_list_error', {
        error: error.message
      });
    }
  }

  // Método para emitir nova mensagem para clientes inscritos
  emitNewMessage(clientId, messageData) {
    if (!this.io) return;

    // Encontrar todos os sockets inscritos neste cliente
    for (const [socketId, clientData] of this.authenticatedClients.entries()) {
      if (clientData.clientIds.includes(clientId)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('new_message', {
            clientId,
            message: messageData,
            timestamp: new Date()
          });
        }
      }
    }

    console.log(`📨 Mensagem emitida via WebSocket para cliente: ${clientId}`);
  }

  // Método para emitir mudança de status do cliente
  emitStatusChange(clientId, status) {
    if (!this.io) return;

    for (const [socketId, clientData] of this.authenticatedClients.entries()) {
      if (clientData.clientIds.includes(clientId)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('client_status_change', {
            clientId,
            status,
            timestamp: new Date()
          });
        }
      }
    }

    console.log(`📱 Status do cliente ${clientId} alterado para: ${status}`);
  }

  // Método para emitir QR Code atualizado
  emitQRCode(clientId, qrData) {
    if (!this.io) return;

    for (const [socketId, clientData] of this.authenticatedClients.entries()) {
      if (clientData.clientIds.includes(clientId)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('qr_code', {
            clientId,
            qrCode: qrData.qrCodeDataURL,
            timestamp: qrData.timestamp
          });
        }
      }
    }

    console.log(`📱 QR Code emitido via WebSocket para cliente: ${clientId}`);
  }

  // Obter estatísticas das conexões
  getConnectionStats() {
    const totalConnections = this.authenticatedClients.size;
    const authenticatedConnections = Array.from(this.authenticatedClients.values())
      .filter(client => client.token !== null).length;

    const subscriptions = {};
    for (const clientData of this.authenticatedClients.values()) {
      for (const clientId of clientData.clientIds) {
        subscriptions[clientId] = (subscriptions[clientId] || 0) + 1;
      }
    }

    return {
      totalConnections,
      authenticatedConnections,
      subscriptions
    };
  }
}

module.exports = new WebSocketService();