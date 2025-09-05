const whatsappService = require('../services/whatsappService');

class WhatsAppController {
  async createClient(req, res) {
    try {
      const { clientId } = req.body;
      if (!clientId) return res.status(400).json({ error: 'clientId é obrigatório' });
      const result = await whatsappService.createClient(clientId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getQRCode(req, res) {
    try {
      const { clientId } = req.params;
      const qrData = whatsappService.getQRCode(clientId);
      res.json({
        clientId,
        qrCode: qrData.qrCodeDataURL,
        timestamp: qrData.timestamp
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatus(req, res) {
    try {
      const { clientId } = req.params;
      const status = whatsappService.getStatus(clientId);
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { clientId } = req.params;
      const { number, message } = req.body;
      if (!number || !message) return res.status(400).json({ error: 'number e message são obrigatórios' });
      const result = await whatsappService.sendMessage(clientId, number, message);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeClient(req, res) {
    try {
      const { clientId } = req.params;
      const result = await whatsappService.removeClient(clientId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async listClients(req, res) {
    try {
      const clients = whatsappService.listClients();
      res.json({ clients });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WhatsAppController();