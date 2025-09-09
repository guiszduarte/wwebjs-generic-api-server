/**
 * Middleware de autenticação por token
 * Verifica se o token fornecido é válido (master ou específico de cliente)
 */

const tokenService = require('../services/tokenService');

const authMiddleware = (req, res, next) => {
  // Obtém o token da query string ou do header Authorization
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  // Token master definido nas variáveis de ambiente
  const masterToken = process.env.ACCESS_TOKEN;
  
  // Se não há token master configurado, permite acesso (para desenvolvimento)
  if (!masterToken) {
    console.warn('⚠️  AVISO: ACCESS_TOKEN não configurado. Acesso liberado para desenvolvimento.');
    req.clientId = '*'; // Acesso total em modo desenvolvimento
    req.isMaster = true;
    return next();
  }
  
  // Verifica se o token foi fornecido
  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso obrigatório',
      message: 'Forneça o token via query parameter (?token=seu_token) ou header Authorization'
    });
  }
  
  // Valida o token usando o serviço de tokens
  const tokenValidation = tokenService.validateToken(token);
  
  if (!tokenValidation || !tokenValidation.isValid) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'O token fornecido não é válido ou expirou'
    });
  }

  // Adiciona informações do token à requisição
  req.clientId = tokenValidation.clientId;
  req.isMaster = tokenValidation.isMaster;
  req.tokenData = tokenValidation;
  
  // Token válido, continua para a próxima função
  next();
};

module.exports = authMiddleware;