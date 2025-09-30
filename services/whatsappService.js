const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

class WhatsAppService {
  constructor() {
    this.clients = new Map();
    this.clientStatus = new Map();
    this.qrCodes = new Map();
    this.receivedMessages = new Map(); // Armazena mensagens recebidas por cliente
    this.websocketService = null; // Será inicializado quando necessário
  }

  // Método para obter o serviço WebSocket (lazy loading)
  getWebSocketService() {
    if (!this.websocketService) {
      this.websocketService = require("./websocketService");
    }
    return this.websocketService;
  }

  async sendWebhook(clientId, message) {

    // Ignora se nao estiver habilitado
    if (process.env.WEBHOOK_ENABLED !== "true") return;

    // Pegamos o Webhook
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("WEBHOOK_URL not configured in .env file");
      return;
    }

    // Construimos o ayload
    const payload = {
      event: "message",
      data: {
        clientId: clientId,
        message: {
          id: message.id,
          from: message.from,
          body: message.body,
          timestamp: message.timestamp,
        },
      },
      timestamp: new Date().toISOString(), // timestamp em ISO format
    };

    try {
      // Enviamos o post
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Webhook enviado:", response.status);
    } catch (error) {
      console.error("Erro ao enviar webhook:", error.message);
    }
  }

  async createClient(clientId) {
    if (this.clients.has(clientId)) {
      throw new Error(`Cliente ${clientId} já existe`);
    }

    // Inicializar array de mensagens para o cliente
    this.receivedMessages.set(clientId, []);

    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
      puppeteer: { headless: true },
    });

    client.on("qr", async (qr) => {
      const qrCodeDataURL = await qrcode.toDataURL(qr);
      const qrData = { qr, qrCodeDataURL, timestamp: new Date() };
      this.qrCodes.set(clientId, qrData);
      console.log(`📱 QR Code gerado para cliente: ${clientId}`);

      this.clientStatus.set(clientId, "qr_generated");

      // Emitir QR Code via WebSocket
      this.getWebSocketService().emitQRCode(clientId, qrData);
      // Emitir mudança de status via WebSocket
      this.getWebSocketService().emitStatusChange(clientId, "qr_generated");
    });

    client.on("ready", () => {
      this.clientStatus.set(clientId, "ready");
      this.qrCodes.delete(clientId);
      console.log(`✅ Cliente ${clientId} pronto!`);

      // Emitir mudança de status via WebSocket
      this.getWebSocketService().emitStatusChange(clientId, "ready");
    });

    client.on("authenticated", () => {
      this.clientStatus.set(clientId, "authenticated");
      console.log(`🔐 Cliente ${clientId} autenticado`);

      // Emitir mudança de status via WebSocket
      this.getWebSocketService().emitStatusChange(clientId, "authenticated");
    });

    client.on("auth_failure", () => {
      this.clientStatus.set(clientId, "auth_failure");
      console.log(`❌ Falha na autenticação do cliente ${clientId}`);

      // Emitir mudança de status via WebSocket
      this.getWebSocketService().emitStatusChange(clientId, "auth_failure");
    });

    client.on("disconnected", () => {
      this.clientStatus.set(clientId, "disconnected");
      console.log(`🔌 Cliente ${clientId} desconectado`);

      // Emitir mudança de status via WebSocket
      this.getWebSocketService().emitStatusChange(clientId, "disconnected");
    });

    client.on("message", async (msg) => {
      console.log(`📨 [${clientId}] ${msg.from}: ${msg.body}`);

      // Obter informações detalhadas do contato
      let contactInfo = {};
      try {
        const contact = await msg.getContact();
        contactInfo = {
          id: contact.id._serialized,
          name: contact.name || contact.pushname || "Sem nome",
          pushname: contact.pushname,
          shortName: contact.shortName,
          number: contact.number,
          isMyContact: contact.isMyContact,
          isUser: contact.isUser,
          isGroup: contact.isGroup,
          isWAContact: contact.isWAContact,
          profilePicUrl: null, // Será obtido separadamente se necessário
        };

        // Tentar obter foto do perfil (pode falhar)
        try {
          contactInfo.profilePicUrl = await contact.getProfilePicUrl();
        } catch (error) {
          // Foto do perfil não disponível
          contactInfo.profilePicUrl = null;
        }
      } catch (error) {
        console.warn(`Erro ao obter informações do contato: ${error.message}`);
        // Fallback para informações básicas
        contactInfo = {
          id: msg.from,
          name: msg._data.notifyName || msg.from,
          number: msg.from.replace("@c.us", "").replace("@g.us", ""),
          isGroup: msg.from.includes("@g.us"),
        };
      }

      // Obter informações do chat se for grupo
      let chatInfo = {};
      if (msg.from.includes("@g.us")) {
        try {
          const chat = await msg.getChat();
          chatInfo = {
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            participantsCount: chat.participants ? chat.participants.length : 0,
            description: chat.description || null,
            createdAt: chat.createdAt ? new Date(chat.createdAt * 1000) : null,
          };
        } catch (error) {
          console.warn(`Erro ao obter informações do chat: ${error.message}`);
        }
      }

      // Armazenar mensagem recebida com informações completas
      const messageData = {
        id: msg.id._serialized,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        type: msg.type,
        timestamp: new Date(msg.timestamp * 1000),
        isGroup: msg.from.includes("@g.us"),
        hasMedia: msg.hasMedia,
        receivedAt: new Date(),

        // Informações detalhadas do contato
        contact: contactInfo,

        // Informações do chat (se for grupo)
        chat: msg.from.includes("@g.us") ? chatInfo : null,

        // Informações adicionais da mensagem
        isForwarded: msg.isForwarded,
        forwardingScore: msg.forwardingScore || 0,
        isStatus: msg.isStatus,
        isStarred: msg.isStarred,
        broadcast: msg.broadcast,
        fromMe: msg.fromMe,
        deviceType: msg.deviceType,

        // Informações de localização (se aplicável)
        location: null,

        // Informações de citação (se aplicável)
        hasQuotedMsg: msg.hasQuotedMsg,
        quotedMsg: null,
      };

      // Adicionar informações de mídia se existir
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          messageData.media = {
            mimetype: media.mimetype,
            filename: media.filename,
            data: media.data, // Base64
            size: media.data ? Buffer.from(media.data, "base64").length : 0,
          };
        } catch (error) {
          console.error(`Erro ao baixar mídia: ${error.message}`);
          messageData.mediaError = error.message;
        }
      }

      // Adicionar informações de localização se for mensagem de localização
      if (msg.type === "location" && msg.location) {
        messageData.location = {
          latitude: msg.location.latitude,
          longitude: msg.location.longitude,
          description: msg.location.description || null,
        };
      }

      // Adicionar mensagem citada se existir
      if (msg.hasQuotedMsg) {
        try {
          const quotedMsg = await msg.getQuotedMessage();
          messageData.quotedMsg = {
            id: quotedMsg.id._serialized,
            body: quotedMsg.body,
            from: quotedMsg.from,
            type: quotedMsg.type,
            timestamp: new Date(quotedMsg.timestamp * 1000),
          };
        } catch (error) {
          console.warn(`Erro ao obter mensagem citada: ${error.message}`);
        }
      }

      // Adicionar à lista de mensagens do cliente
      const clientMessages = this.receivedMessages.get(clientId) || [];
      clientMessages.push(messageData);

      // Manter apenas as últimas 1000 mensagens por cliente para evitar uso excessivo de memória
      if (clientMessages.length > 1000) {
        clientMessages.shift();
      }

      this.receivedMessages.set(clientId, clientMessages);

      // Emitir nova mensagem via WebSocket e Webhook
      this.sendWebhook(clientId, messageData);
      this.getWebSocketService().emitNewMessage(clientId, messageData);
    });

    this.clients.set(clientId, client);
    this.clientStatus.set(clientId, "initializing");

    // Emitir mudança de status via WebSocket
    this.getWebSocketService().emitStatusChange(clientId, "initializing");

    await client.initialize();
    return { success: true, message: `Cliente ${clientId} criado` };
  }

  getQRCode(clientId) {
    if (!this.clients.has(clientId))
      throw new Error(`Cliente ${clientId} não encontrado`);
    const qrData = this.qrCodes.get(clientId);
    if (!qrData)
      throw new Error(`QR Code não disponível para o cliente ${clientId}`);
    return qrData;
  }

  getStatus(clientId) {
    const status = this.clientStatus.get(clientId) || "not_found";
    return { clientId, status, isReady: status === "ready" };
  }

  async sendMessage(clientId, number, message) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado`);
    const chatId = number.includes("@") ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    return { success: true, to: chatId, message, timestamp: new Date() };
  }

  // Métodos para interação com grupos
  async getGroups(clientId) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado`);

    const chats = await client.getChats();
    const groups = chats
      .filter((chat) => chat.isGroup)
      .map((group) => ({
        id: group.id._serialized,
        name: group.name,
        participantsCount: group.participants ? group.participants.length : 0,
        description: group.description || null,
        createdAt: group.createdAt ? new Date(group.createdAt * 1000) : null,
        isReadOnly: group.isReadOnly || false,
        isMuted: group.isMuted || false,
        unreadCount: group.unreadCount || 0,
        lastMessage: group.lastMessage
          ? {
              body: group.lastMessage.body,
              timestamp: new Date(group.lastMessage.timestamp * 1000),
              from: group.lastMessage.from,
            }
          : null,
      }));

    return groups;
  }

  async findGroupByName(clientId, groupName) {
    if (!groupName) {
      return res.status(400).json({ error: "Nome do grupo não informado" });
    }

    const groups = await this.getGroups(clientId);
    const foundGroups = groups.filter((group) =>
      group.name.toLowerCase().includes(groupName.toLowerCase())
    );

    if (foundGroups.length === 0) {
      throw new Error(`Nenhum grupo encontrado com o nome: ${groupName}`);
    }

    if (foundGroups.length > 1) {
      const exactMatch = foundGroups.find(
        (group) => group.name.toLowerCase() === groupName.toLowerCase()
      );
      if (exactMatch) {
        return exactMatch;
      }

      throw new Error(
        `Múltiplos grupos encontrados com o nome "${groupName}". Grupos encontrados: ${foundGroups
          .map((g) => g.name)
          .join(", ")}`
      );
    }

    return foundGroups[0];
  }

  async sendMessageToGroup(clientId, groupName, message) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado`);

    const group = await this.findGroupByName(clientId, groupName);
    await client.sendMessage(group.id, message);

    return {
      success: true,
      groupId: group.id,
      groupName: group.name,
      message,
      timestamp: new Date(),
    };
  }

  async getGroupMessages(clientId, groupName, options = {}) {
    if (!this.clients.has(clientId)) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }

    const group = await this.findGroupByName(clientId, groupName);
    const messages = this.receivedMessages.get(clientId) || [];

    // Filtrar mensagens apenas do grupo específico
    let filteredMessages = messages.filter(
      (msg) => msg.isGroup && msg.from === group.id
    );

    // Aplicar filtros adicionais
    if (options.from) {
      filteredMessages = filteredMessages.filter(
        (msg) =>
          msg.contact &&
          msg.contact.name &&
          msg.contact.name.toLowerCase().includes(options.from.toLowerCase())
      );
    }

    if (options.lastHours) {
      const hoursAgo = new Date(
        Date.now() - options.lastHours * 60 * 60 * 1000
      );
      filteredMessages = filteredMessages.filter(
        (msg) => new Date(msg.timestamp) >= hoursAgo
      );
    }

    if (options.type) {
      filteredMessages = filteredMessages.filter(
        (msg) => msg.type === options.type
      );
    }

    // Ordenar por timestamp (mais recente primeiro)
    filteredMessages.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Aplicar limite
    if (options.limit) {
      filteredMessages = filteredMessages.slice(0, options.limit);
    }

    return {
      groupId: group.id,
      groupName: group.name,
      messages: filteredMessages,
      total: filteredMessages.length,
    };
  }

  async getGroupInfo(clientId, groupName) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado`);

    const group = await this.findGroupByName(clientId, groupName);
    const chat = await client.getChatById(group.id);

    const participants = chat.participants
      ? await Promise.all(
          chat.participants.map(async (participant) => {
            try {
              const contact = await client.getContactById(
                participant.id._serialized
              );
              return {
                id: participant.id._serialized,
                name: contact.name || contact.pushname || "Sem nome",
                number: contact.number,
                isAdmin: participant.isAdmin || false,
                isSuperAdmin: participant.isSuperAdmin || false,
              };
            } catch (error) {
              return {
                id: participant.id._serialized,
                name: "Erro ao obter nome",
                number: participant.id._serialized.replace("@c.us", ""),
                isAdmin: participant.isAdmin || false,
                isSuperAdmin: participant.isSuperAdmin || false,
              };
            }
          })
        )
      : [];

    return {
      id: group.id,
      name: group.name,
      description: chat.description || null,
      participantsCount: participants.length,
      participants: participants,
      createdAt: chat.createdAt ? new Date(chat.createdAt * 1000) : null,
      isReadOnly: chat.isReadOnly || false,
      isMuted: chat.isMuted || false,
      unreadCount: chat.unreadCount || 0,
    };
  }

  // Métodos para gerenciar mensagens recebidas (mantidos iguais)
  getMessages(clientId, options = {}) {
    if (!this.clients.has(clientId)) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }

    const messages = this.receivedMessages.get(clientId) || [];
    let filteredMessages = [...messages];

    // Filtrar por remetente
    if (options.from) {
      filteredMessages = filteredMessages.filter(
        (msg) =>
          msg.contact &&
          msg.contact.name &&
          msg.contact.name.toLowerCase().includes(options.from.toLowerCase())
      );
    }

    // Filtrar por últimas horas
    if (options.lastHours) {
      const hoursAgo = new Date(
        Date.now() - options.lastHours * 60 * 60 * 1000
      );
      filteredMessages = filteredMessages.filter(
        (msg) => new Date(msg.timestamp) >= hoursAgo
      );
    }

    // Filtrar por tipo de mensagem
    if (options.type) {
      filteredMessages = filteredMessages.filter(
        (msg) => msg.type === options.type
      );
    }

    // Filtrar apenas grupos ou apenas individuais
    if (options.onlyGroups !== undefined) {
      filteredMessages = filteredMessages.filter((msg) =>
        options.onlyGroups ? msg.isGroup : !msg.isGroup
      );
    }

    // Ordenar por timestamp (mais recente primeiro)
    filteredMessages.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Aplicar limite
    if (options.limit) {
      filteredMessages = filteredMessages.slice(0, options.limit);
    }

    return {
      messages: filteredMessages,
      total: filteredMessages.length,
      filters: options,
    };
  }

  getMessageStats(clientId) {
    if (!this.clients.has(clientId)) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }

    const messages = this.receivedMessages.get(clientId) || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: messages.length,
      today: messages.filter((msg) => new Date(msg.timestamp) >= today).length,
      yesterday: messages.filter((msg) => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= yesterday && msgDate < today;
      }).length,
      thisWeek: messages.filter((msg) => new Date(msg.timestamp) >= thisWeek)
        .length,
      byType: {},
      groups: messages.filter((msg) => msg.isGroup).length,
      individual: messages.filter((msg) => !msg.isGroup).length,
      withMedia: messages.filter((msg) => msg.hasMedia).length,
    };

    // Contar por tipo
    messages.forEach((msg) => {
      stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1;
    });

    return stats;
  }

  clearMessages(clientId) {
    if (!this.clients.has(clientId)) {
      throw new Error(`Cliente ${clientId} não encontrado`);
    }

    const messageCount = this.receivedMessages.get(clientId)?.length || 0;
    this.receivedMessages.set(clientId, []);

    return {
      success: true,
      clearedMessages: messageCount,
      timestamp: new Date(),
    };
  }

  async destroyAllClients() {
    console.log("🔄 Encerrando todos os clientes WhatsApp...");

    for (const [clientId, client] of this.clients) {
      try {
        await client.destroy();
        console.log(`✅ Cliente ${clientId} encerrado`);
      } catch (error) {
        console.error(
          `❌ Erro ao encerrar cliente ${clientId}:`,
          error.message
        );
      }
    }

    this.clients.clear();
    this.clientStatus.clear();
    this.qrCodes.clear();
    this.receivedMessages.clear();

    console.log("✅ Todos os clientes foram encerrados");
  }
}

module.exports = new WhatsAppService();
