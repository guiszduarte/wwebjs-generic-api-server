const tokenService = require('../services/tokenService');

/**
 * Controller para gerenciar tokens de clientes
 */
class TokenController {
  
  /**
   * Gera um novo token para um clientId específico
   * POST /api/tokens/generate
   * Body: { clientId: string, expiresIn?: number }
   */
  async generateToken(req, res) {
    try {
      const { clientId, expiresIn } = req.body;

      // Validação de entrada
      if (!clientId) {
        return res.status(400).json({
          error: 'ClientId obrigatório',
          message: 'Forneça o clientId para gerar o token'
        });
      }

      // Apenas tokens master podem gerar tokens para clientes
      if (!req.isMaster) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Apenas tokens master podem gerar tokens para clientes'
        });
      }

      // Gera o token
      const tokenData = tokenService.generateClientToken(clientId, expiresIn);

      res.json({
        success: true,
        message: 'Token gerado com sucesso',
        data: tokenData
      });

    } catch (error) {
      console.error('Erro ao gerar token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Valida um token específico
   * POST /api/tokens/validate
   * Body: { token: string }
   */
  async validateToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Token obrigatório',
          message: 'Forneça o token para validação'
        });
      }

      const validation = tokenService.validateToken(token);

      if (!validation || !validation.isValid) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado',
          isValid: false
        });
      }

      res.json({
        success: true,
        message: 'Token válido',
        isValid: true,
        data: {
          clientId: validation.clientId,
          isMaster: validation.isMaster,
          createdAt: validation.createdAt,
          expiresAt: validation.expiresAt
        }
      });

    } catch (error) {
      console.error('Erro ao validar token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Revoga um token de cliente específico
   * DELETE /api/tokens/revoke/:clientId
   */
  async revokeToken(req, res) {
    try {
      const { clientId } = req.params;

      if (!clientId) {
        return res.status(400).json({
          error: 'ClientId obrigatório',
          message: 'Forneça o clientId do token a ser revogado'
        });
      }

      // Apenas tokens master podem revogar tokens
      if (!req.isMaster) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Apenas tokens master podem revogar tokens'
        });
      }

      const revoked = tokenService.revokeClientToken(clientId);

      if (!revoked) {
        return res.status(404).json({
          error: 'Token não encontrado',
          message: `Nenhum token ativo encontrado para o cliente ${clientId}`
        });
      }

      res.json({
        success: true,
        message: `Token do cliente ${clientId} revogado com sucesso`
      });

    } catch (error) {
      console.error('Erro ao revogar token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Lista todos os tokens ativos
   * GET /api/tokens/list
   */
  async listTokens(req, res) {
    try {
      // Apenas tokens master podem listar tokens
      if (!req.isMaster) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Apenas tokens master podem listar tokens'
        });
      }

      const activeTokens = tokenService.listActiveTokens();

      res.json({
        success: true,
        message: 'Tokens ativos listados com sucesso',
        data: {
          count: activeTokens.length,
          tokens: activeTokens
        }
      });

    } catch (error) {
      console.error('Erro ao listar tokens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obtém informações sobre o token atual
   * GET /api/tokens/info
   */
  async getTokenInfo(req, res) {
    try {
      res.json({
        success: true,
        message: 'Informações do token atual',
        data: {
          clientId: req.clientId,
          isMaster: req.isMaster,
          tokenData: req.tokenData
        }
      });

    } catch (error) {
      console.error('Erro ao obter informações do token:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

module.exports = new TokenController();