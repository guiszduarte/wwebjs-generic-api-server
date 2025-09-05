const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.clients = new Map();
    this.qrCodes = new Map();
    this.clientStatus = new Map();
  }

  async createClient(clientId) {
    if (this.clients.has(clientId)) throw new Error(`Cliente ${clientId} já existe`);
    const sessionPath = path.join(__dirname, '..', 'sessions', clientId);
    await fs.ensureDir(sessionPath);

    const client = new Client({
      authStrategy: new LocalAuth({ clientId, dataPath: sessionPath }),
      puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] }
    });

    client.on('qr', async (qr) => {
      const qrCodeDataURL = await qrcode.toDataURL(qr);
      this.qrCodes.set(clientId, { qr, qrCodeDataURL, timestamp: new Date() });
      this.clientStatus.set(clientId, 'qr_generated');
    });

    client.on('ready', () => { this.clientStatus.set(clientId, 'ready'); this.qrCodes.delete(clientId); });
    client.on('authenticated', () => { this.clientStatus.set(clientId, 'authenticated'); });
    client.on('auth_failure', () => { this.clientStatus.set(clientId, 'auth_failure'); });
    client.on('disconnected', () => { this.clientStatus.set(clientId, 'disconnected'); });

    client.on('message', (msg) => {
      console.log(`📨 [${clientId}] ${msg.from}: ${msg.body}`);
    });

    this.clients.set(clientId, client);
    this.clientStatus.set(clientId, 'initializing');
    await client.initialize();
    return { success: true, message: `Cliente ${clientId} criado` };
  }

  getQRCode(clientId) {
    if (!this.clients.has(clientId)) throw new Error(`Cliente ${clientId} não encontrado`);
    const qrData = this.qrCodes.get(clientId);
    if (!qrData) throw new Error(`QR Code não disponível para o cliente ${clientId}`);
    return qrData;
  }

  getStatus(clientId) {
    if (!this.clients.has(clientId)) throw new Error(`Cliente ${clientId} não encontrado`);
    const status = this.clientStatus.get(clientId);
    return { clientId, status, isReady: status === 'ready' };
  }

  async sendMessage(clientId, number, message) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado`);
    const chatId = number.includes('@') ? number : `${number}@c.us`;
    const result = await client.sendMessage(chatId, message);
    return { success: true, to: chatId, message, timestamp: new Date() };
  }

  async removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Cliente ${clientId} não encontrado`);
    await client.destroy();
    this.clients.delete(clientId);
    this.qrCodes.delete(clientId);
    this.clientStatus.delete(clientId);
    const sessionPath = path.join(__dirname, '..', 'sessions', clientId);
    await fs.remove(sessionPath);
    return { success: true, message: `Cliente ${clientId} removido` };
  }

  listClients() {
    return Array.from(this.clients.keys()).map(id => ({
      clientId: id,
      status: this.clientStatus.get(id) || 'unknown',
      hasQR: this.qrCodes.has(id)
    }));
  }

  async destroyAllClients() {
    for (const [id, client] of this.clients) {
      try { await client.destroy(); } catch {}
    }
    this.clients.clear();
    this.qrCodes.clear();
    this.clientStatus.clear();
  }
}

module.exports = new WhatsAppService();