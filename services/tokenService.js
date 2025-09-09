const crypto = require('crypto');

/**
 * Serviço para gerenciar tokens específicos por clientId
 * Permite gerar tokens únicos para cada cliente WhatsApp
 */
class TokenService {
  constructor() {
    // Map para armazenar tokens por clientId
    this.clientTokens = new Map();
    // Map para fazer lookup reverso (token -> clientId)
    this.tokenToClient = new Map();
    // Token master para administração
    this.masterToken = process.env.ACCESS_TOKEN;
  }

  /**
   * Gera um token único para um clientId específico
   * @param {string} clientId - ID do cliente WhatsApp
   * @param {number} expiresIn - Tempo de expiração em milissegundos (opcional)
   * @returns {object} Objeto com token e informações de expiração
   */
  generateClientToken(clientId, expiresIn = null) {
    if (!clientId) {
      throw new Error('ClientId é obrigatório');
    }

    // Gera um token único usando crypto
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calcula data de expiração se fornecida
    const expirationDate = expiresIn ? new Date(Date.now() + expiresIn) : null;
    
    const tokenData = {
      token,
      clientId,
      createdAt: new Date(),
      expiresAt: expirationDate,
      isActive: true
    };

    // Armazena o token
    this.clientTokens.set(clientId, tokenData);
    this.tokenToClient.set(token, clientId);

    console.log(`🔑 Token gerado para cliente ${clientId}: ${token.substring(0, 8)}...`);

    return {
      token,
      clientId,
      createdAt: tokenData.createdAt,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Valida um token e retorna o clientId associado
   * @param {string} token - Token a ser validado
   * @returns {object|null} Dados do cliente se válido, null se inválido
   */
  validateToken(token) {
    if (!token) {
      return null;
    }

    // Verifica se é o token master
    if (this.masterToken && token === this.masterToken) {
      return {
        clientId: '*', // Token master tem acesso a todos os clientes
        isMaster: true,
        isValid: true
      };
    }

    // Verifica se é um token de cliente específico
    const clientId = this.tokenToClient.get(token);
    if (!clientId) {
      return null;
    }

    const tokenData = this.clientTokens.get(clientId);
    if (!tokenData || !tokenData.isActive) {
      return null;
    }

    // Verifica se o token expirou
    if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
      this.revokeClientToken(clientId);
      return null;
    }

    return {
      clientId,
      isMaster: false,
      isValid: true,
      createdAt: tokenData.createdAt,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Revoga o token de um cliente específico
   * @param {string} clientId - ID do cliente
   * @returns {boolean} True se revogado com sucesso
   */
  revokeClientToken(clientId) {
    const tokenData = this.clientTokens.get(clientId);
    if (!tokenData) {
      return false;
    }

    // Remove das duas estruturas de dados
    this.tokenToClient.delete(tokenData.token);
    this.clientTokens.delete(clientId);

    console.log(`🔒 Token revogado para cliente ${clientId}`);
    return true;
  }

  /**
   * Lista todos os tokens ativos
   * @returns {Array} Lista de tokens ativos
   */
  listActiveTokens() {
    const activeTokens = [];
    
    for (const [clientId, tokenData] of this.clientTokens.entries()) {
      if (tokenData.isActive) {
        // Verifica se não expirou
        if (!tokenData.expiresAt || new Date() <= tokenData.expiresAt) {
          activeTokens.push({
            clientId,
            token: tokenData.token.substring(0, 8) + '...', // Mostra apenas parte do token
            createdAt: tokenData.createdAt,
            expiresAt: tokenData.expiresAt
          });
        } else {
          // Remove tokens expirados
          this.revokeClientToken(clientId);
        }
      }
    }

    return activeTokens;
  }

  /**
   * Verifica se um clientId tem permissão para acessar outro clientId
   * @param {string} requestingClientId - ID do cliente que está fazendo a requisição
   * @param {string} targetClientId - ID do cliente que se quer acessar
   * @returns {boolean} True se tem permissão
   */
  hasPermission(requestingClientId, targetClientId) {
    // Token master tem acesso a tudo
    if (requestingClientId === '*') {
      return true;
    }

    // Cliente só pode acessar seus próprios dados
    return requestingClientId === targetClientId;
  }

  /**
   * Limpa tokens expirados
   */
  cleanupExpiredTokens() {
    const now = new Date();
    const expiredClients = [];

    for (const [clientId, tokenData] of this.clientTokens.entries()) {
      if (tokenData.expiresAt && now > tokenData.expiresAt) {
        expiredClients.push(clientId);
      }
    }

    expiredClients.forEach(clientId => {
      this.revokeClientToken(clientId);
    });

    if (expiredClients.length > 0) {
      console.log(`🧹 Removidos ${expiredClients.length} tokens expirados`);
    }
  }
}

// Instância singleton
const tokenService = new TokenService();

// Limpa tokens expirados a cada hora
setInterval(() => {
  tokenService.cleanupExpiredTokens();
}, 60 * 60 * 1000);

module.exports = tokenService;