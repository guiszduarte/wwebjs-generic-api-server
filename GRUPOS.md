# 📱 Funcionalidades de Grupos - WhatsApp Web.js MultiCliente Server

Este documento descreve as novas funcionalidades para interação com grupos do WhatsApp implementadas no servidor.

## 🚀 Funcionalidades Disponíveis

### 1. **Listar Grupos**
Lista todos os grupos disponíveis para um cliente específico.

**Endpoint:** `GET /client/:clientId/groups`

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/client/meu-cliente/groups?token=SEU_TOKEN"
```

**Resposta:**
```json
{
  "clientId": "meu-cliente",
  "groups": [
    {
      "id": "120363123456789@g.us",
      "name": "Família",
      "participantsCount": 8,
      "description": "Grupo da família",
      "createdAt": "2023-01-15T10:30:00.000Z",
      "isReadOnly": false,
      "isMuted": false,
      "unreadCount": 3,
      "lastMessage": {
        "body": "Oi pessoal!",
        "timestamp": "2024-01-20T15:45:00.000Z",
        "from": "5511999999999@c.us"
      }
    }
  ],
  "total": 1
}
```

### 2. **Buscar Grupo por Nome**
Encontra um grupo específico pelo nome (busca parcial).

**Endpoint:** `GET /client/:clientId/groups/:groupName`

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/client/meu-cliente/groups/Família?token=SEU_TOKEN"
```

**Resposta:**
```json
{
  "clientId": "meu-cliente",
  "group": {
    "id": "120363123456789@g.us",
    "name": "Família",
    "participantsCount": 8,
    "description": "Grupo da família",
    "createdAt": "2023-01-15T10:30:00.000Z",
    "isReadOnly": false,
    "isMuted": false,
    "unreadCount": 3
  }
}
```

### 3. **Informações Detalhadas do Grupo**
Obtém informações completas do grupo, incluindo lista de participantes.

**Endpoint:** `GET /client/:clientId/groups/:groupName/info`

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/client/meu-cliente/groups/Família/info?token=SEU_TOKEN"
```

**Resposta:**
```json
{
  "clientId": "meu-cliente",
  "group": {
    "id": "120363123456789@g.us",
    "name": "Família",
    "description": "Grupo da família",
    "participantsCount": 8,
    "participants": [
      {
        "id": "5511999999999@c.us",
        "name": "João Silva",
        "number": "5511999999999",
        "isAdmin": true,
        "isSuperAdmin": false
      },
      {
        "id": "5511888888888@c.us",
        "name": "Maria Silva",
        "number": "5511888888888",
        "isAdmin": false,
        "isSuperAdmin": false
      }
    ],
    "createdAt": "2023-01-15T10:30:00.000Z",
    "isReadOnly": false,
    "isMuted": false,
    "unreadCount": 3
  }
}
```

### 4. **Enviar Mensagem para Grupo**
Envia uma mensagem para um grupo específico usando o nome do grupo.

**Endpoint:** `POST /client/:clientId/groups/send`

**Body:**
```json
{
  "groupName": "Família",
  "message": "Olá pessoal! Como estão?"
}
```

**Exemplo:**
```bash
curl -X POST "http://localhost:3000/client/meu-cliente/groups/send?token=SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Família",
    "message": "Olá pessoal! Como estão?"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "groupId": "120363123456789@g.us",
  "groupName": "Família",
  "message": "Olá pessoal! Como estão?",
  "timestamp": "2024-01-20T16:30:00.000Z"
}
```

### 5. **Obter Mensagens do Grupo**
Recupera mensagens de um grupo específico com filtros opcionais.

**Endpoint:** `GET /client/:clientId/groups/:groupName/messages`

**Parâmetros de Query:**
- `from`: Filtrar por nome do remetente
- `lastHours`: Mensagens das últimas X horas
- `type`: Tipo de mensagem (text, image, audio, etc.)
- `limit`: Limite de mensagens retornadas

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/client/meu-cliente/groups/Família/messages?token=SEU_TOKEN&limit=10&lastHours=24"
```

**Resposta:**
```json
{
  "groupId": "120363123456789@g.us",
  "groupName": "Família",
  "messages": [
    {
      "id": "3EB0123456789ABCDEF",
      "from": "120363123456789@g.us",
      "body": "Oi pessoal!",
      "type": "chat",
      "timestamp": "2024-01-20T15:45:00.000Z",
      "isGroup": true,
      "contact": {
        "id": "5511999999999@c.us",
        "name": "João Silva",
        "number": "5511999999999"
      },
      "chat": {
        "id": "120363123456789@g.us",
        "name": "Família",
        "isGroup": true,
        "participantsCount": 8
      }
    }
  ],
  "total": 1
}
```

## 🔍 Busca de Grupos

### Busca por Nome Exato
Se você fornecer o nome exato do grupo, ele será encontrado diretamente.

### Busca Parcial
Se você fornecer parte do nome, o sistema buscará grupos que contenham essa string (case-insensitive).

### Múltiplos Resultados
Se múltiplos grupos forem encontrados com o mesmo termo de busca:
- O sistema tentará encontrar uma correspondência exata primeiro
- Se não houver correspondência exata, retornará um erro listando todos os grupos encontrados

**Exemplo de erro com múltiplos resultados:**
```json
{
  "error": "Múltiplos grupos encontrados com o nome \"trabalho\". Grupos encontrados: Trabalho - Equipe A, Trabalho - Equipe B, Trabalho - Geral"
}
```

## 🛡️ Segurança e Permissões

Todas as funcionalidades de grupos respeitam o sistema de tokens e permissões:

- **Token Master**: Acesso total a todos os clientes e seus grupos
- **Token Específico**: Acesso apenas aos grupos do cliente autorizado
- **Verificação de Permissões**: Cada requisição verifica se o token tem permissão para acessar o cliente especificado

## 📝 Exemplo de Uso Completo

Veja o arquivo `examples/groups-example.js` para um exemplo completo de como usar todas as funcionalidades de grupos.

Para executar o exemplo:

```bash
cd examples
node groups-example.js
```

## 🔄 WebSocket - Eventos em Tempo Real

As mensagens de grupos são automaticamente enviadas via WebSocket para clientes conectados e inscritos no cliente WhatsApp correspondente. Os eventos incluem:

- `new_message`: Nova mensagem recebida (incluindo mensagens de grupos)
- `client_status_change`: Mudança de status do cliente
- `qr_code`: Novo QR Code gerado

## ⚠️ Considerações Importantes

1. **Nomes de Grupos**: Use sempre o nome exato do grupo ou parte dele para buscas
2. **Encoding**: Nomes de grupos com caracteres especiais devem ser codificados na URL
3. **Performance**: Para grupos com muitos participantes, a obtenção de informações detalhadas pode ser mais lenta
4. **Permissões do WhatsApp**: O bot precisa estar no grupo para enviar mensagens
5. **Rate Limiting**: Respeite os limites do WhatsApp para evitar bloqueios

## 🐛 Tratamento de Erros

Principais erros que podem ocorrer:

- `Cliente não encontrado`: O clientId especificado não existe
- `Nenhum grupo encontrado`: Não há grupos com o nome especificado
- `Múltiplos grupos encontrados`: Mais de um grupo corresponde ao termo de busca
- `Acesso negado`: Token não tem permissão para acessar o cliente
- `Token inválido`: Token fornecido é inválido ou expirado

## 📊 Monitoramento

Use o endpoint `/websocket/stats` para monitorar conexões WebSocket ativas e estatísticas do servidor.