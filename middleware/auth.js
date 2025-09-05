/**
 * Middleware de autenticação por token
 * Verifica se o token fornecido é válido
 */

const authMiddleware = (req, res, next) => {
  // Obtém o token da query string ou do header Authorization
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  // Token definido nas variáveis de ambiente
  const validToken = process.env.ACCESS_TOKEN;
  
  // Se não há token configurado, permite acesso (para desenvolvimento)
  if (!validToken) {
    console.warn('⚠️  AVISO: ACCESS_TOKEN não configurado. Acesso liberado para desenvolvimento.');
    return next();
  }
  
  // Verifica se o token foi fornecido
  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso obrigatório',
      message: 'Forneça o token via query parameter (?token=seu_token) ou header Authorization'
    });
  }
  
  // Verifica se o token é válido
  if (token !== validToken) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'O token fornecido não é válido'
    });
  }
  
  // Token válido, continua para a próxima função
  next();
};

module.exports = authMiddleware;