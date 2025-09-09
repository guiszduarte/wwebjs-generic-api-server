const axios = require('axios');

/**
 * Exemplo prático de como usar o sistema de tokens por cliente
 */

const BASE_URL = 'http://localhost:3000';
const MASTER_TOKEN = process.env.ACCESS_TOKEN || 'seu_token_master_aqui';

class TokenManager {
  constructor(masterToken) {
    this.masterToken = masterToken;
    this.clientTokens = new Map();
  }

  /**
   * Gera um token específico para um cliente
   */
  async generateClientToken(clientId, expiresInDays = 7) {
    try {
      const expiresIn = expiresInDays * 24 * 60 * 60 * 1000; // Converte dias para ms
      
      const response = await axios.post(`${BASE_URL}/api/tokens/generate`, {
        clientId,
        expiresIn
      }, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`
        }
      });

      const tokenData = response.data.data;
      this.clientTokens.set(clientId, tokenData.token);
      
      console.log(`✅ Token gerado para cliente ${clientId}:`);
      console.log(`   Token: ${tokenData.token.substring(0, 16)}...`);
      console.log(`   Expira em: ${tokenData.expiresAt}`);
      
      return tokenData.token;
    } catch (error) {
      console.error(`❌ Erro ao gerar token para ${clientId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Valida um token
   */
  async validateToken(token) {
    try {
      const response = await axios.post(`${BASE_URL}/api/tokens/validate`, {
        token
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`✅ Token válido:`, response.data.data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Token inválido:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Lista todos os tokens ativos
   */
  async listActiveTokens() {
    try {
      const response = await axios.get(`${BASE_URL}/api/tokens/list`, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`
        }
      });

      console.log(`📋 Tokens ativos (${response.data.data.count}):`);
      response.data.data.tokens.forEach(token => {
        console.log(`   Cliente: ${token.clientId}`);
        console.log(`   Token: ${token.token}`);
        console.log(`   Criado: ${token.createdAt}`);
        console.log(`   Expira: ${token.expiresAt || 'Nunca'}`);
        console.log('   ---');
      });

      return response.data.data.tokens;
    } catch (error) {
      console.error(`❌ Erro ao listar tokens:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Revoga um token de cliente
   */
  async revokeClientToken(clientId) {
    try {
      const response = await axios.delete(`${BASE_URL}/api/tokens/revoke/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`
        }
      });

      console.log(`🔒 Token revogado para cliente ${clientId}`);
      this.clientTokens.delete(clientId);
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao revogar token para ${clientId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém o token de um cliente (se já foi gerado)
   */
  getClientToken(clientId) {
    return this.clientTokens.get(clientId);
  }
}

/**
 * Classe para simular um cliente final usando token específico
 */
class WhatsAppClient {
  constructor(clientId, token) {
    this.clientId = clientId;
    this.token = token;
  }

  /**
   * Cria o cliente WhatsApp
   */
  async createClient() {
    try {
      const response = await axios.post(`${BASE_URL}/client/create`, {
        clientId: this.clientId
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log(`📱 Cliente ${this.clientId} criado:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao criar cliente ${this.clientId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém o QR Code
   */
  async getQRCode() {
    try {
      const response = await axios.get(`${BASE_URL}/client/${this.clientId}/qr`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log(`📱 QR Code para ${this.clientId} obtido`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao obter QR Code para ${this.clientId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém mensagens
   */
  async getMessages(options = {}) {
    try {
      const params = new URLSearchParams(options);
      const response = await axios.get(`${BASE_URL}/client/${this.clientId}/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log(`📨 Mensagens para ${this.clientId}:`, response.data.messages?.length || 0, 'mensagens');
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao obter mensagens para ${this.clientId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Tenta acessar outro cliente (deve falhar)
   */
  async tryAccessOtherClient(otherClientId) {
    try {
      const response = await axios.get(`${BASE_URL}/client/${otherClientId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      console.log(`⚠️  INESPERADO: Conseguiu acessar cliente ${otherClientId}`);
      return response.data;
    } catch (error) {
      console.log(`✅ Acesso negado ao cliente ${otherClientId} (como esperado):`, error.response?.data?.error);
      return null;
    }
  }
}

/**
 * Exemplo de uso completo
 */
async function exemploCompleto() {
  console.log('🚀 Iniciando exemplo do sistema de tokens\n');

  // 1. Criar gerenciador de tokens (servidor intermediário)
  const tokenManager = new TokenManager(MASTER_TOKEN);

  try {
    // 2. Gerar tokens para diferentes clientes
    console.log('📝 Gerando tokens para clientes...');
    const tokenEmpresaA = await tokenManager.generateClientToken('empresa_a', 30);
    const tokenEmpresaB = await tokenManager.generateClientToken('empresa_b', 7);
    console.log('');

    // 3. Listar tokens ativos
    console.log('📋 Listando tokens ativos...');
    await tokenManager.listActiveTokens();
    console.log('');

    // 4. Simular clientes finais usando seus tokens específicos
    console.log('👥 Simulando clientes finais...');
    const clienteA = new WhatsAppClient('empresa_a', tokenEmpresaA);
    const clienteB = new WhatsAppClient('empresa_b', tokenEmpresaB);

    // 5. Cliente A cria seu cliente WhatsApp
    console.log('📱 Cliente A criando seu cliente WhatsApp...');
    await clienteA.createClient();
    console.log('');

    // 6. Cliente A tenta acessar dados do Cliente B (deve falhar)
    console.log('🔒 Cliente A tentando acessar dados do Cliente B...');
    await clienteA.tryAccessOtherClient('empresa_b');
    console.log('');

    // 7. Cliente B cria seu cliente WhatsApp
    console.log('📱 Cliente B criando seu cliente WhatsApp...');
    await clienteB.createClient();
    console.log('');

    // 8. Validar tokens
    console.log('✅ Validando tokens...');
    await tokenManager.validateToken(tokenEmpresaA);
    await tokenManager.validateToken(tokenEmpresaB);
    console.log('');

    // 9. Revogar token do Cliente A
    console.log('🔒 Revogando token do Cliente A...');
    await tokenManager.revokeClientToken('empresa_a');
    console.log('');

    // 10. Tentar usar token revogado (deve falhar)
    console.log('❌ Tentando usar token revogado...');
    await tokenManager.validateToken(tokenEmpresaA);
    console.log('');

    console.log('✅ Exemplo concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no exemplo:', error.message);
  }
}

// Executar exemplo se este arquivo for executado diretamente
if (require.main === module) {
  exemploCompleto().catch(console.error);
}

module.exports = {
  TokenManager,
  WhatsAppClient,
  exemploCompleto
};