# Sistema de Tokens por Cliente

Este documento explica como usar o novo sistema de tokens específicos por cliente.

## Visão Geral

O sistema agora suporta dois tipos de tokens:

1. **Token Master (ACCESS_TOKEN)**: Tem acesso total a todos os clientes e pode gerar/revogar tokens
2. **Tokens de Cliente**: Tokens específicos que só podem acessar um cliente WhatsApp específico

## Como Funciona

### 1. Token Master
- Definido na variável de ambiente `ACCESS_TOKEN`
- Tem acesso a todos os endpoints e clientes
- Pode gerar e gerenciar tokens de clientes específicos

### 2. Tokens de Cliente
- Gerados pelo token master para clientes específicos
- Só podem acessar dados do cliente para o qual foram gerados
- Podem ter data de expiração opcional

## Endpoints de Gerenciamento de Tokens

### Gerar Token para Cliente
```bash
POST /api/tokens/generate
Authorization: Bearer SEU_TOKEN_MASTER

Body:
{
  "clientId": "cliente1",
  "expiresIn": 86400000  // Opcional: tempo em ms (24h neste exemplo)
}

Response:
{
  "success": true,
  "message": "Token gerado com sucesso",
  "data": {
    "token": "a1b2c3d4e5f6...",
    "clientId": "cliente1",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "expiresAt": "2024-01-02T10:00:00.000Z"
  }
}
```

### Validar Token
```bash
POST /api/tokens/validate
Authorization: Bearer SEU_TOKEN

Body:
{
  "token": "token_para_validar"
}

Response:
{
  "success": true,
  "message": "Token válido",
  "isValid": true,
  "data": {
    "clientId": "cliente1",
    "isMaster": false,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "expiresAt": "2024-01-02T10:00:00.000Z"
  }
}
```

### Revogar Token de Cliente
```bash
DELETE /api/tokens/revoke/cliente1
Authorization: Bearer SEU_TOKEN_MASTER

Response:
{
  "success": true,
  "message": "Token do cliente cliente1 revogado com sucesso"
}
```

### Listar Tokens Ativos
```bash
GET /api/tokens/list
Authorization: Bearer SEU_TOKEN_MASTER

Response:
{
  "success": true,
  "message": "Tokens ativos listados com sucesso",
  "data": {
    "count": 2,
    "tokens": [
      {
        "clientId": "cliente1",
        "token": "a1b2c3d4...",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "expiresAt": "2024-01-02T10:00:00.000Z"
      }
    ]
  }
}
```

### Informações do Token Atual
```bash
GET /api/tokens/info
Authorization: Bearer SEU_TOKEN

Response:
{
  "success": true,
  "message": "Informações do token atual",
  "data": {
    "clientId": "cliente1",
    "isMaster": false,
    "tokenData": {
      "clientId": "cliente1",
      "isMaster": false,
      "isValid": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "expiresAt": "2024-01-02T10:00:00.000Z"
    }
  }
}
```

## Exemplo de Uso Prático

### 1. Servidor Intermediário Gera Token para Cliente
```javascript
// Servidor intermediário usa token master para gerar token específico
const response = await fetch('http://localhost:3000/api/tokens/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_MASTER'
  },
  body: JSON.stringify({
    clientId: 'empresa_abc',
    expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 dias
  })
});

const tokenData = await response.json();
const clientToken = tokenData.data.token;

// Agora pode fornecer este token para o cliente final
```

### 2. Cliente Final Usa Token Específico
```javascript
// Cliente final usa o token específico para acessar apenas seus dados
const response = await fetch('http://localhost:3000/client/empresa_abc/messages', {
  headers: {
    'Authorization': `Bearer ${clientToken}`
  }
});

// Este token só funciona para o cliente 'empresa_abc'
// Tentativas de acessar outros clientes serão negadas
```

## WebSocket com Tokens Específicos

O WebSocket também suporta tokens específicos:

```javascript
const socket = io('ws://localhost:3000');

// Autenticação com token específico
socket.emit('authenticate', { token: 'token_do_cliente' });

socket.on('authenticated', (data) => {
  console.log('Autenticado:', data);
  // { success: true, clientId: 'cliente1', isMaster: false }
  
  // Só pode se inscrever no próprio cliente
  socket.emit('subscribe', { clientId: 'cliente1' });
});

socket.on('subscription_error', (error) => {
  console.error('Erro de inscrição:', error);
  // Será exibido se tentar se inscrever em cliente não autorizado
});
```

## Controle de Acesso

### Token Master (`*`)
- Pode acessar todos os clientes
- Pode criar, listar, revogar tokens
- Pode se inscrever em qualquer cliente via WebSocket

### Token de Cliente Específico
- Só pode acessar o cliente para o qual foi gerado
- Não pode gerar ou gerenciar outros tokens
- Só pode se inscrever no próprio cliente via WebSocket

## Segurança

1. **Tokens são únicos**: Cada token é gerado usando crypto.randomBytes(32)
2. **Expiração automática**: Tokens podem ter data de expiração
3. **Limpeza automática**: Tokens expirados são removidos automaticamente
4. **Controle granular**: Cada token só acessa o que foi autorizado
5. **Revogação**: Tokens podem ser revogados a qualquer momento

## Migração

O sistema é retrocompatível:
- Tokens master (ACCESS_TOKEN) continuam funcionando normalmente
- Novos tokens específicos podem ser gerados conforme necessário
- Clientes existentes não são afetados