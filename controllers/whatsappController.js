const whatsappService = require('../services/whatsappService');
const tokenService = require('../services/tokenService');

class WhatsAppController {

  /**
   * Verifica se o token tem permissão para acessar o clientId especificado
   */
  _checkPermission(req, targetClientId) {
    const requestingClientId = req.clientId;
    
    if (!tokenService.hasPermission(requestingClientId, targetClientId)) {
      throw new Error(`Acesso negado: token não tem permissão para acessar o cliente ${targetClientId}`);
    }
  }

  async createClient(req, res) {
    try {
      const { clientId } = req.body;
      if (!clientId) return res.status(400).json({ error: 'clientId é obrigatório' });
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const result = await whatsappService.createClient(clientId);
      res.json(result);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getQRCode(req, res) {
    try {
      const { clientId } = req.params;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const qrData = whatsappService.getQRCode(clientId);
      res.json({
        clientId,
        qrCode: qrData.qrCodeDataURL,
        timestamp: qrData.timestamp
      });
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async getStatus(req, res) {
    try {
      const { clientId } = req.params;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const status = whatsappService.getStatus(clientId);
      res.json(status);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { clientId } = req.params;
      const { number, message } = req.body;
      if (!number || !message) {
        return res.status(400).json({ error: 'number e message são obrigatórios' });
      }
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const result = await whatsappService.sendMessage(clientId, number, message);
      res.json(result);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async removeClient(req, res) {
    try {
      const { clientId } = req.params;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const result = await whatsappService.removeClient(clientId);
      res.json(result);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async listClients(req, res) {
    try {
      const allClients = whatsappService.listClients();
      
      // Se não é master, filtra apenas os clientes que o token pode acessar
      if (!req.isMaster) {
        const allowedClients = allClients.filter(client => 
          tokenService.hasPermission(req.clientId, client.clientId)
        );
        return res.json({ clients: allowedClients });
      }
      
      res.json({ clients: allClients });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Novos endpoints para gerenciar mensagens recebidas
  async getMessages(req, res) {
    try {
      const { clientId } = req.params;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const options = {};

      // Parâmetros de filtro opcionais
      if (req.query.from) options.from = req.query.from;
      if (req.query.lastHours) options.lastHours = parseInt(req.query.lastHours);
      if (req.query.type) options.type = req.query.type;
      if (req.query.limit) options.limit = parseInt(req.query.limit);
      if (req.query.onlyGroups !== undefined) {
        options.onlyGroups = req.query.onlyGroups === 'true';
      }

      const result = whatsappService.getMessages(clientId, options);
      res.json(result);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async getMessageStats(req, res) {
    try {
      const { clientId } = req.params;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const stats = whatsappService.getMessageStats(clientId);
      res.json(stats);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async clearMessages(req, res) {
    try {
      const { clientId } = req.params;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const result = whatsappService.clearMessages(clientId);
      res.json(result);
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async getLatestMessages(req, res) {
    try {
      const { clientId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      // Verifica permissão
      this._checkPermission(req, clientId);
      
      const result = whatsappService.getMessages(clientId, { 
        limit,
        lastHours: 24 // Últimas 24 horas por padrão
      });
      
      res.json({
        clientId,
        limit,
        messages: result.messages
      });
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }

  async searchMessages(req, res) {
    try {
      const { clientId } = req.params;
      const { query, type, onlyGroups } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Parâmetro query é obrigatório para busca' });
      }

      // Verifica permissão
      this._checkPermission(req, clientId);

      const options = {
        limit: parseInt(req.query.limit) || 50
      };

      if (type) options.type = type;
      if (onlyGroups !== undefined) options.onlyGroups = onlyGroups === 'true';

      const result = whatsappService.getMessages(clientId, options);
      
      // Filtrar mensagens que contenham o termo de busca
      const filteredMessages = result.messages.filter(msg => 
        msg.body.toLowerCase().includes(query.toLowerCase()) ||
        msg.fromName.toLowerCase().includes(query.toLowerCase())
      );

      res.json({
        clientId,
        query,
        total: filteredMessages.length,
        messages: filteredMessages
      });
    } catch (error) {
      if (error.message.includes('Acesso negado')) {
        return res.status(403).json({ error: error.message });
      }
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new WhatsAppController();