# 📱 WhatsApp Web.js MultiCliente Server v2.0

Servidor Node.js que utiliza **whatsapp-web.js** para controlar múltiplas sessões do WhatsApp Web, oferecendo uma **API REST** simples e **segura** para integração com sistemas externos.

## 🆕 **NOVA VERSÃO 2.0 - Sistema de Tokens por Cliente**

Esta versão introduz um **sistema revolucionário de tokens específicos por cliente**, permitindo que servidores intermediários gerem tokens únicos para cada cliente final, garantindo **isolamento total** e **segurança granular**.

---

## 🚀 Funcionalidades

### 🔐 **Sistema de Autenticação Avançado**
- **Token Master (ACCESS_TOKEN)**: Acesso total para administradores
- **Tokens Específicos por Cliente**: Acesso restrito a um cliente específico
- **Geração automática de tokens**: Via API REST
- **Controle de expiração**: Tokens com data de validade opcional
- **Revogação instantânea**: Desative tokens a qualquer momento

### 📱 **Recursos WhatsApp**
- Suporte a **múltiplos clientes** (sessões independentes)
- **Persistência de sessão** (não precisa reescanear o QR a cada execução)
- **API REST** completa para gerenciar clientes e mensagens
- **WebSocket em tempo real** com controle de permissões
- Suporte a QR Code em **Base64** (pronto para exibir em frontend)

### 📨 **Sistema de Mensagens**
- **Armazenamento automático** de mensagens recebidas (texto e mídia)
- **Filtros avançados** por remetente, data, tipo e grupos/contatos
- **Busca de mensagens** por conteúdo e remetente
- **Estatísticas detalhadas** de mensagens por cliente
- **Controle de acesso** baseado em permissões de token

### 🛠️ **Recursos Técnicos**
- **Gerenciamento completo de tokens** (geração, validação, revogação)
- **Limpeza automática** de tokens expirados
- **Logs detalhados** de operações e acessos
- Encerramento **graceful** (encerra todos os clientes ao parar o servidor)

---

## 📂 Estrutura do Projeto
```
whatsapp-server/
├── package.json
├── server.js
├── .env.example
├── .gitignore
├── controllers/
│   └── whatsappController.js
├── services/
│   ├── whatsappService.js
│   └── websocketService.js
├── middleware/
│   └── auth.js
├── examples/
│   ├── package.json
│   ├── websocket-client.html
│   └── websocket-client-node.js
└── sessions/ (criado automaticamente para salvar sessões)
```

---

## ⚙️ Instalação

1. Clone ou baixe este repositório:
```bash
git clone https://github.com/guiszduarte/wwebjs-generic-api-client.git
cd wwebjs-generic-api-client
```

2. Instale dependências:
```bash
npm install
```

3. **Configure o token de acesso:**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e defina seu token
# ACCESS_TOKEN=seu_token_super_secreto_aqui
```

4. Inicie o servidor:
```bash
npm start
```

Servidor rodará em: **http://localhost:3000**

---

## 🔒 Configuração de Segurança

### Token de Acesso
Para maior segurança, todas as rotas da API requerem um token de acesso. Configure a variável de ambiente `ACCESS_TOKEN`:

```bash
# No arquivo .env
ACCESS_TOKEN=meu_token_super_secreto_123456
```

### Formas de enviar o token:

1. **Via Query Parameter:**
```
GET /clients?token=seu_token_aqui
```

2. **Via Header Authorization:**
```bash
curl -H "Authorization: Bearer seu_token_aqui" http://localhost:3000/clients
```

### ⚠️ Importante:
- **Mantenha o token em segredo** e não o compartilhe publicamente.
- Use um token **forte e único** para cada ambiente.
- O arquivo `.env` está no `.gitignore` para evitar vazamentos acidentais.

---

## 🔑 API Endpoints

> **Nota:** Todos os endpoints requerem autenticação por token (Master ou Específico).

### 🔐 **Gerenciamento de Tokens** (Requer Token Master)

#### **Gerar Token para Cliente**
**POST** `/api/tokens/generate`
```bash
curl -X POST http://localhost:3000/api/tokens/generate \
  -H "Authorization: Bearer SEU_TOKEN_MASTER" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "empresa_abc", "expiresIn": 604800000}'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Token gerado com sucesso",
  "data": {
    "token": "a1b2c3d4e5f6789...",
    "clientId": "empresa_abc",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "expiresAt": "2024-01-08T10:00:00.000Z"
  }
}
```

#### **Validar Token**
**POST** `/api/tokens/validate`
```bash
curl -X POST http://localhost:3000/api/tokens/validate \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "token_para_validar"}'
```

#### **Revogar Token de Cliente**
**DELETE** `/api/tokens/revoke/:clientId`
```bash
curl -X DELETE http://localhost:3000/api/tokens/revoke/empresa_abc \
  -H "Authorization: Bearer SEU_TOKEN_MASTER"
```

#### **Listar Tokens Ativos**
**GET** `/api/tokens/list`
```bash
curl -X GET http://localhost:3000/api/tokens/list \
  -H "Authorization: Bearer SEU_TOKEN_MASTER"
```

#### **Informações do Token Atual**
**GET** `/api/tokens/info`
```bash
curl -X GET http://localhost:3000/api/tokens/info \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### 📱 **Gerenciamento de Clientes WhatsApp**

#### **1. Criar Cliente**
**POST** `/client/create`
```bash
curl -X POST http://localhost:3000/client/create \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "cliente1"}'
```

#### **2. Obter QR Code**
**GET** `/client/:clientId/qr`
```bash
curl -X GET http://localhost:3000/client/cliente1/qr \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "clientId": "cliente1",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

#### **3. Status do Cliente**
**GET** `/client/:clientId/status`
```bash
curl -X GET http://localhost:3000/client/cliente1/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "clientId": "cliente1",
  "status": "ready",
  "isReady": true
}
```

#### **4. Enviar Mensagem**
**POST** `/client/:clientId/send`
```bash
curl -X POST http://localhost:3000/client/cliente1/send \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"number": "5511999999999", "message": "Olá, mundo!"}'
```

**Resposta:**
```json
{
  "success": true,
  "to": "5511999999999@c.us",
  "message": "Olá, mundo!",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

#### **5. Remover Cliente**
**DELETE** `/client/:clientId`
```bash
curl -X DELETE http://localhost:3000/client/cliente1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **6. Listar Clientes**
**GET** `/clients`
```bash
curl -X GET http://localhost:3000/clients \
  -H "Authorization: Bearer SEU_TOKEN"
```

> **Nota:** Tokens específicos só veem o próprio cliente. Tokens master veem todos.

---

### 📨 **Gerenciamento de Mensagens**

---

## 📨 Endpoints de Mensagens Recebidas

#### **7. Listar Mensagens Recebidas**
**GET** `/client/:clientId/messages`

**Parâmetros opcionais:**
- `from` - Filtrar por remetente (número ou nome)
- `lastHours` - Mensagens das últimas X horas
- `type` - Tipo de mensagem (chat, image, video, audio, etc.)
- `limit` - Limite de mensagens (padrão: 50)
- `onlyGroups` - true/false para filtrar apenas grupos ou contatos

**Exemplo:**
```bash
curl -X GET "http://localhost:3000/client/cliente1/messages?limit=10&lastHours=24&onlyGroups=false" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "clientId": "cliente1",
  "total": 150,
  "filtered": 10,
  "messages": [
    {
      "id": "msg_id_123",
      "from": "5511999999999@c.us",
      "fromName": "João Silva",
      "to": "5511888888888@c.us",
      "body": "Olá! Como você está?",
      "type": "chat",
      "timestamp": "2024-01-01T10:30:00.000Z",
      "isGroup": false,
      "groupName": null
    }
  ]
}
```

#### **8. Últimas Mensagens**
**GET** `/client/:clientId/messages/latest`
```bash
curl -X GET "http://localhost:3000/client/cliente1/messages/latest?limit=5" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **9. Buscar Mensagens**
**GET** `/client/:clientId/messages/search`
```bash
curl -X GET "http://localhost:3000/client/cliente1/messages/search?query=olá&limit=20" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **10. Estatísticas de Mensagens**
**GET** `/client/:clientId/messages/stats`
```bash
curl -X GET http://localhost:3000/client/cliente1/messages/stats \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **11. Limpar Mensagens**
**DELETE** `/client/:clientId/messages`
```bash
curl -X DELETE http://localhost:3000/client/cliente1/messages \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🎯 **Fluxos de Uso**

### **🔐 Para Servidores Intermediários (Token Master)**

1. **Configure o token master** no arquivo `.env`
2. **Gere tokens específicos** para cada cliente final
3. **Distribua os tokens** para os clientes correspondentes
4. **Monitore e gerencie** tokens ativos
5. **Revogue tokens** quando necessário

```bash
# 1. Gerar token para cliente
curl -X POST http://localhost:3000/api/tokens/generate \
  -H "Authorization: Bearer SEU_TOKEN_MASTER" \
  -d '{"clientId": "empresa_abc", "expiresIn": 604800000}'

# 2. Listar tokens ativos
curl -X GET http://localhost:3000/api/tokens/list \
  -H "Authorization: Bearer SEU_TOKEN_MASTER"
```

### **📱 Para Clientes Finais (Token Específico)**

1. **Receba seu token específico** do servidor intermediário
2. **Crie seu cliente WhatsApp** usando o token
3. **Obtenha e escaneie o QR Code**
4. **Aguarde o status `ready`**
5. **Envie mensagens e monitore recebidas**

```bash
# 1. Criar cliente
curl -X POST http://localhost:3000/client/create \
  -H "Authorization: Bearer SEU_TOKEN_ESPECIFICO" \
  -d '{"clientId": "empresa_abc"}'

# 2. Obter QR Code
curl -X GET http://localhost:3000/client/empresa_abc/qr \
  -H "Authorization: Bearer SEU_TOKEN_ESPECIFICO"
```

---

## 🔒 **Segurança Avançada**

### **🛡️ Recursos de Segurança Implementados**
- ✅ **Sistema de tokens hierárquico** (Master + Específicos)
- ✅ **Isolamento total entre clientes**
- ✅ **Controle de expiração** de tokens
- ✅ **Revogação instantânea** de acesso
- ✅ **Validação rigorosa** de permissões
- ✅ **Logs detalhados** de operações
- ✅ **Limpeza automática** de tokens expirados
- ✅ **Autenticação via header ou query**
- ✅ **Proteção contra acesso cruzado**

### **🔐 Níveis de Acesso**

| Tipo de Token | Acesso | Pode Gerar Tokens | Pode Revogar | Vê Todos os Clientes |
|---------------|--------|-------------------|--------------|---------------------|
| **Master** | 🌟 Total | ✅ Sim | ✅ Sim | ✅ Sim |
| **Cliente Específico** | 🎯 Restrito | ❌ Não | ❌ Não | ❌ Só o próprio |

### **🚨 Recomendações de Segurança**

#### **Para Produção:**
- 🔒 **SEMPRE** configure `ACCESS_TOKEN`
- 🌐 Use **HTTPS** obrigatoriamente
- 🔥 Configure **firewall** restritivo
- ⏱️ Implemente **rate limiting**
- 📊 Monitore **logs de acesso**
- 🔄 **Rotacione tokens** periodicamente

#### **Para Tokens:**
- 🎯 Use **tokens específicos** para clientes finais
- ⏰ Configure **expiração** adequada
- 🗑️ **Revogue** tokens não utilizados
- 📝 **Documente** tokens distribuídos
- 🔍 **Monitore** uso de tokens

---

## 📨 **Sistema de Mensagens Avançado**

### **💾 Armazenamento Inteligente**
- **Captura automática** de todas as mensagens recebidas
- **Suporte completo** a texto, mídia e documentos
- **Metadados detalhados**: remetente, timestamp, tipo, grupo
- **Download automático** de mídia em Base64
- **Gestão de memória**: limite de 1000 mensagens por cliente
- **Isolamento por cliente**: cada token só vê suas mensagens

### **🔍 Recursos de Busca e Filtro**
- **Filtros avançados**: remetente, data, tipo, grupos/contatos
- **Busca textual** no conteúdo e nome do remetente
- **Estatísticas detalhadas** por cliente
- **Controle de limite** de resultados
- **Ordenação temporal** das mensagens

### **📊 Tipos de Mensagem Suportados**
| Tipo | Descrição | Mídia Incluída |
|------|-----------|----------------|
| `chat` | Mensagens de texto | ❌ |
| `image` | Imagens (JPG, PNG, etc.) | ✅ Base64 |
| `video` | Vídeos | ✅ Base64 |
| `audio` | Áudios e notas de voz | ✅ Base64 |
| `document` | Documentos (PDF, DOC, etc.) | ✅ Base64 |
| `sticker` | Figurinhas | ✅ Base64 |
| `location` | Localização | ❌ |


---

## 🌐 **WebSocket em Tempo Real com Controle de Acesso**

### **🔌 Conexão WebSocket Segura**
O servidor oferece comunicação em tempo real via WebSocket com **controle de permissões baseado em tokens**, eliminando a necessidade de polling e garantindo que cada cliente só receba dados autorizados.

**URL de Conexão:** `ws://localhost:3000`

### **🔐 Autenticação WebSocket**
```javascript
const socket = io('ws://localhost:3000');

// Autenticar com token específico
socket.emit('authenticate', { token: 'seu_token_especifico' });

// Confirmar autenticação
socket.on('authenticated', (data) => {
  console.log('Autenticado:', data.message);
  console.log('Cliente ID:', data.clientId);
  console.log('É Master:', data.isMaster);
});

// Tratar erros de autenticação
socket.on('authentication_error', (error) => {
  console.error('Erro de autenticação:', error.message);
});
```

### **📡 Eventos Disponíveis**

#### **📤 Eventos do Cliente para Servidor:**
| Evento | Descrição | Parâmetros |
|--------|-----------|------------|
| `authenticate` | Autenticar com token | `{ token: "seu_token" }` |
| `subscribe` | Inscrever-se em cliente WhatsApp | `{ clientId: "cliente1" }` |
| `unsubscribe` | Cancelar inscrição | `{ clientId: "cliente1" }` |
| `list_clients` | Listar clientes disponíveis | - |

#### **📥 Eventos do Servidor para Cliente:**
| Evento | Descrição | Dados Recebidos |
|--------|-----------|-----------------|
| `authenticated` | Confirmação de autenticação | `{ success, message, clientId, isMaster }` |
| `subscribed` | Confirmação de inscrição | `{ success, clientId, message }` |
| `new_message` | Nova mensagem recebida | `{ clientId, message, timestamp }` |
| `client_status_change` | Mudança de status | `{ clientId, status, timestamp }` |
| `qr_code` | Novo QR Code disponível | `{ clientId, qrCode, timestamp }` |
| `clients_list` | Lista de clientes | `{ clients, subscribedTo }` |

#### **⚠️ Eventos de Erro:**
| Evento | Descrição |
|--------|-----------|
| `authentication_error` | Erro na autenticação |
| `subscription_error` | Erro na inscrição |
| `unsubscription_error` | Erro ao cancelar inscrição |
| `clients_list_error` | Erro ao listar clientes |

### **💡 Exemplos de Uso**

#### **🎯 Cliente com Token Específico:**
```javascript
const socket = io('ws://localhost:3000');

// Autenticar com token específico
socket.emit('authenticate', { token: 'token_empresa_abc' });

socket.on('authenticated', (data) => {
  if (data.success) {
    // Só pode se inscrever no próprio cliente
    socket.emit('subscribe', { clientId: 'empresa_abc' });
  }
});

// Receber mensagens apenas do próprio cliente
socket.on('new_message', (data) => {
  console.log(`Nova mensagem para ${data.clientId}:`, data.message);
});

// Tentativa de inscrição não autorizada será rejeitada
socket.emit('subscribe', { clientId: 'outra_empresa' });
socket.on('subscription_error', (error) => {
  console.error('Acesso negado:', error.message);
});
```

#### **👑 Administrador com Token Master:**
```javascript
const socket = io('ws://localhost:3000');

// Autenticar com token master
socket.emit('authenticate', { token: 'token_master' });

socket.on('authenticated', (data) => {
  if (data.isMaster) {
    // Pode listar todos os clientes
    socket.emit('list_clients');

    // Pode se inscrever em qualquer cliente
    socket.emit('subscribe', { clientId: 'cliente1' });
    socket.emit('subscribe', { clientId: 'cliente2' });
  }
});

// Receber lista completa de clientes
socket.on('clients_list', (data) => {
  console.log('Clientes disponíveis:', data.clients);
  console.log('Inscrito em:', data.subscribedTo);
});
```

#### **🔄 Gerenciamento de Conexão:**
```javascript
const socket = io('ws://localhost:3000');

// Reconexão automática
socket.on('connect', () => {
  console.log('Conectado ao WebSocket');
  // Re-autenticar após reconexão
  socket.emit('authenticate', { token: 'seu_token' });
});

socket.on('disconnect', () => {
  console.log('Desconectado do WebSocket');
});

// Tratamento de erros
socket.on('connect_error', (error) => {
  console.error('Erro de conexão:', error);
});
```

### **🛡️ Controle de Segurança WebSocket**

- **✅ Autenticação obrigatória** antes de qualquer operação
- **✅ Validação de permissões** em cada inscrição
- **✅ Isolamento de dados** por cliente
- **✅ Logs de acesso** detalhados
- **✅ Desconexão automática** em caso de token inválido
- **✅ Re-validação** de tokens em operações críticas

---

## 🛠️ Tecnologias
- Node.js
- Express
- whatsapp-web.js
- qrcode
- fs-extra
- cors
- dotenv
- socket.io

---

## 🚀 Executando em Produção

```bash
# Com variável de ambiente inline
ACCESS_TOKEN=meu_token_secreto npm start

# Ou usando PM2
pm2 start server.js --name whatsapp-server --env production
```

---

## 👨‍💻 Autor
Projeto inicial gerado para integração de **WhatsApp MultiCliente** em sistemas externos.  
Adapte conforme necessário para o seu caso de uso.

---

## 📝 Changelog

### 🆕 v2.0.0 - Sistema de Tokens por Cliente (Atual)
- 🔐 **Sistema revolucionário de tokens específicos por cliente**
- 👑 **Token Master** para administradores
- 🎯 **Tokens específicos** com acesso restrito
- ⏰ **Controle de expiração** automático
- 🗑️ **Revogação instantânea** de tokens
- 🛡️ **Isolamento total** entre clientes
- 📊 **API completa** de gerenciamento de tokens
- 🌐 **WebSocket seguro** com controle de permissões
- 🧹 **Limpeza automática** de tokens expirados
- 📖 **Documentação completa** e exemplos práticos
- 🔄 **Retrocompatibilidade** total

### v1.3.0 - WebSocket em Tempo Real
- ✅ **Sistema WebSocket completo** para comunicação em tempo real
- ✅ Autenticação por token via WebSocket
- ✅ Inscrições em múltiplos clientes WhatsApp
- ✅ Eventos instantâneos de novas mensagens
- ✅ Informações detalhadas do contato (nome, número, foto)
- ✅ Suporte a grupos com informações completas
- ✅ Eventos de mudança de status e QR Code
- ✅ Exemplos funcionais (HTML e Node.js)
- ✅ Estrutura de dados rica com localização e citações
- ✅ Eliminação da necessidade de polling

### v1.2.0 - Sistema de Mensagens
- ✅ **Sistema completo de mensagens recebidas**
- ✅ Armazenamento automático de mensagens (texto e mídia)
- ✅ API para buscar, filtrar e gerenciar mensagens
- ✅ Filtros por remetente, data, tipo e grupos/contatos
- ✅ Busca textual em mensagens
- ✅ Estatísticas detalhadas por cliente
- ✅ Download automático de mídia em Base64
- ✅ Limpeza de mensagens para gerenciar memória
- ✅ 5 novos endpoints para mensagens

### v1.1.0 - Segurança Básica
- ✅ Adicionada autenticação por token
- ✅ Configuração via variáveis de ambiente
- ✅ Middleware de segurança
- ✅ Documentação de segurança atualizada

### v1.0.0 - Versão Inicial
- ✅ Múltiplos clientes WhatsApp
- ✅ API REST básica
- ✅ Persistência de sessão

---

## 📚 **Exemplos e Documentação**

### **🔐 Exemplo Completo de Tokens**
Execute o exemplo interativo que demonstra todo o sistema:

```bash
cd examples
npm install
ACCESS_TOKEN=seu_token_master npm run tokens
```

### **🌐 Cliente WebSocket**
```bash
cd examples
npm run client
```

### **📖 Documentação Adicional**
- **[TOKENS.md](./TOKENS.md)** - Guia completo do sistema de tokens
- **[IMPLEMENTACAO_TOKENS.md](./IMPLEMENTACAO_TOKENS.md)** - Detalhes técnicos da implementação

---

## 🎯 **Casos de Uso Reais**

### **🏢 Para Empresas de Software**
- Ofereça WhatsApp como serviço para seus clientes
- Cada cliente recebe um token específico
- Isolamento total entre clientes
- Faturamento por cliente

### **🔧 Para Integradores**
- Integre WhatsApp em sistemas existentes
- Controle granular de acesso
- Tokens com expiração para projetos temporários
- Revogação instantânea quando necessário

### **🏪 Para SaaS Providers**
- Multi-tenancy nativo
- Segurança por design
- Escalabilidade horizontal
- Monitoramento por cliente

---

## ⭐ **Se este projeto foi útil, considere dar uma estrela!**

**WhatsApp MultiCliente Server v2.0** - O futuro da integração WhatsApp com segurança empresarial. 🚀