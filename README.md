# 📱 WhatsApp Web.js MultiCliente Server

Servidor Node.js que utiliza **whatsapp-web.js** para controlar múltiplas sessões do WhatsApp Web, oferecendo uma **API REST** simples e **segura** para integração com sistemas externos.

---

## 🚀 Funcionalidades
- Suporte a **múltiplos clientes** (sessões independentes).
- **Sistema de tokens específicos por cliente** para controle granular de acesso.
- **Persistência de sessão** (não precisa reescanear o QR a cada execução).
- **API REST** para criar cliente, verificar status, obter QR Code, enviar mensagens e remover clientes.
- **Sistema completo de mensagens recebidas** com armazenamento, busca e filtros.
- **Autenticação por token** com suporte a tokens master e específicos por cliente.
- **WebSocket em tempo real** com controle de permissões por token.
- Suporte a QR Code em **Base64** (pronto para exibir em frontend).
- **Armazenamento automático** de mensagens recebidas (texto e mídia).
- **Filtros avançados** por remetente, data, tipo e grupos/contatos.
- **Busca de mensagens** por conteúdo e remetente.
- **Estatísticas detalhadas** de mensagens por cliente.
- **Gerenciamento completo de tokens** (geração, validação, revogação).
- Encerramento **graceful** (encerra todos os clientes ao parar o servidor).

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

## 🔑 Endpoints da API

> **Nota:** Todos os endpoints requerem autenticação por token.

### 1. Criar cliente
**POST** `/client/create?token=SEU_TOKEN`
```json
{ "clientId": "cliente1" }
```

### 2. Obter QR Code
**GET** `/client/:clientId/qr?token=SEU_TOKEN`

Resposta:
```json
{
  "clientId": "cliente1",
  "qrCode": "data:image/png;base64,..."
}
```

### 3. Status do cliente
**GET** `/client/:clientId/status?token=SEU_TOKEN`

Resposta:
```json
{
  "clientId": "cliente1",
  "status": "ready",
  "isReady": true
}
```

### 4. Enviar mensagem
**POST** `/client/:clientId/send?token=SEU_TOKEN`
```json
{ "number": "5511999999999", "message": "Olá, mundo!" }
```

Resposta:
```json
{
  "success": true,
  "to": "5511999999999@c.us",
  "message": "Olá, mundo!",
  "timestamp": "2025-09-05T17:25:00.000Z"
}
```

### 5. Remover cliente
**DELETE** `/client/:clientId?token=SEU_TOKEN`

### 6. Listar todos os clientes
**GET** `/clients?token=SEU_TOKEN`

---

## 📨 Endpoints de Mensagens Recebidas

### 7. Listar mensagens recebidas
**GET** `/client/:clientId/messages?token=SEU_TOKEN`

Parâmetros opcionais:
- `from` - Filtrar por remetente (número ou nome)
- `lastHours` - Mensagens das últimas X horas
- `type` - Tipo de mensagem (chat, image, video, audio, etc.)
- `limit` - Limite de mensagens (padrão: 50)
- `onlyGroups` - true/false para filtrar apenas grupos ou contatos

Exemplo:
```
GET /client/cliente1/messages?token=SEU_TOKEN&limit=10&lastHours=24&onlyGroups=false
```

Resposta:
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
      "timestamp": "2025-01-15T10:30:00.000Z",
      "isGroup": false,
      "hasMedia": false,
      "receivedAt": "2025-01-15T10:30:01.000Z"
    }
  ]
}
```

### 8. Últimas mensagens
**GET** `/client/:clientId/messages/latest?token=SEU_TOKEN`

Parâmetros:
- `limit` - Quantidade de mensagens (padrão: 10)

Resposta:
```json
{
  "clientId": "cliente1",
  "limit": 10,
  "messages": [...]
}
```

### 9. Buscar mensagens
**GET** `/client/:clientId/messages/search?token=SEU_TOKEN&query=texto`

Parâmetros:
- `query` - Texto a buscar (obrigatório)
- `type` - Tipo de mensagem
- `onlyGroups` - true/false
- `limit` - Limite de resultados (padrão: 50)

Exemplo:
```
GET /client/cliente1/messages/search?token=SEU_TOKEN&query=pedido&limit=20
```

Resposta:
```json
{
  "clientId": "cliente1",
  "query": "pedido",
  "total": 5,
  "messages": [...]
}
```

### 10. Estatísticas de mensagens
**GET** `/client/:clientId/messages/stats?token=SEU_TOKEN`

Resposta:
```json
{
  "clientId": "cliente1",
  "total": 1250,
  "last24Hours": 45,
  "lastHour": 3,
  "groups": 800,
  "individual": 450,
  "withMedia": 200,
  "oldestMessage": "2025-01-10T08:00:00.000Z",
  "newestMessage": "2025-01-15T14:30:00.000Z"
}
```

### 11. Limpar mensagens
**DELETE** `/client/:clientId/messages?token=SEU_TOKEN`

Resposta:
```json
{
  "success": true,
  "message": "1250 mensagens removidas do cliente cliente1"
}
```

---

## 📌 Fluxo de Uso
1. **Configurar token** no arquivo `.env`
2. Criar um cliente (com token)
3. Obter QR Code e exibir para o usuário
4. Escanear QR pelo WhatsApp
5. Verificar status (aguardar `ready`)
6. Enviar mensagens e gerenciar sessões
7. **Monitorar mensagens recebidas** automaticamente
8. **Buscar e filtrar mensagens** conforme necessário
9. **Visualizar estatísticas** de mensagens por cliente

---

## 🔒 Segurança Implementada
- ✅ **Autenticação por token** em todas as rotas da API
- ✅ **Variáveis de ambiente** para configurações sensíveis
- ✅ **Arquivo .gitignore** protegendo dados sensíveis
- ✅ **Validação de token** via query parameter ou header
- ✅ **Mensagens de erro** informativas para problemas de autenticação

### Recomendações adicionais:
- Utilize **HTTPS** em produção
- Configure **firewall** para restringir acesso
- Considere implementar **rate limiting**
- Monitore **logs de acesso** para detectar tentativas não autorizadas


---

## 📨 Sistema de Mensagens Recebidas

### Armazenamento Automático
- **Todas as mensagens recebidas** são automaticamente armazenadas na memória
- Suporte a **mensagens de texto, mídia e documentos**
- **Metadados completos**: remetente, timestamp, tipo, grupo/individual
- **Download automático de mídia** em Base64
- **Limite inteligente**: mantém apenas as últimas 1000 mensagens por cliente

### Funcionalidades Avançadas
- **Filtros múltiplos**: por remetente, data, tipo, grupos/contatos
- **Busca textual** no conteúdo e nome do remetente
- **Estatísticas detalhadas** por cliente
- **Limpeza de mensagens** para gerenciar memória
- **API RESTful** completa para integração

### Tipos de Mensagem Suportados
- `chat` - Mensagens de texto
- `image` - Imagens (JPG, PNG, etc.)
- `video` - Vídeos
- `audio` - Áudios e notas de voz
- `document` - Documentos (PDF, DOC, etc.)
- `sticker` - Figurinhas
- `location` - Localização


---

## 🔌 WebSocket em Tempo Real

### Conexão WebSocket
O servidor oferece comunicação em tempo real via WebSocket para receber mensagens instantaneamente, eliminando a necessidade de polling.

**URL de Conexão:** `ws://localhost:3000`

### Autenticação WebSocket
```javascript
// Conectar ao WebSocket
const socket = io('ws://localhost:3000');

// Autenticar
socket.emit('authenticate', { token: 'seu_token_aqui' });

// Confirmar autenticação
socket.on('authenticated', (data) => {
  console.log('Autenticado:', data.message);
});
```

### Eventos Disponíveis

#### Eventos do Cliente para Servidor:
- `authenticate` - Autenticar com token
- `subscribe` - Inscrever-se em um cliente WhatsApp
- `unsubscribe` - Cancelar inscrição
- `list_clients` - Listar clientes disponíveis

#### Eventos do Servidor para Cliente:
- `authenticated` - Confirmação de autenticação
- `new_message` - Nova mensagem recebida
- `client_status_change` - Mudança de status do cliente
- `qr_code` - Novo QR Code disponível
- `clients_list` - Lista de clientes disponíveis

### Exemplo de Uso WebSocket

#### JavaScript (Browser):
```javascript
const socket = io('ws://localhost:3000');

// Autenticar
socket.emit('authenticate', { token: 'seu_token' });

// Inscrever-se em um cliente
socket.emit('subscribe', { clientId: 'cliente1' });

// Escutar novas mensagens
socket.on('new_message', (data) => {
  console.log('Nova mensagem:', data.message);
  console.log('Contato:', data.message.contact.name);
  console.log('Número:', data.message.contact.number);
  console.log('Mensagem:', data.message.body);
});
```

#### Node.js:
```javascript
const io = require('socket.io-client');
const socket = io('ws://localhost:3000');

socket.on('connect', () => {
  socket.emit('authenticate', { token: process.env.ACCESS_TOKEN });
});

socket.on('authenticated', () => {
  socket.emit('subscribe', { clientId: 'cliente1' });
});

socket.on('new_message', (data) => {
  const msg = data.message;
  console.log(`Nova mensagem de ${msg.contact.name}: ${msg.body}`);
});
```

### Estrutura da Mensagem WebSocket
```json
{
  "clientId": "cliente1",
  "message": {
    "id": "msg_id_123",
    "from": "5511999999999@c.us",
    "to": "5511888888888@c.us",
    "body": "Olá! Como você está?",
    "type": "chat",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "isGroup": false,
    "hasMedia": false,
    "contact": {
      "id": "5511999999999@c.us",
      "name": "João Silva",
      "number": "5511999999999",
      "isMyContact": true,
      "profilePicUrl": "https://..."
    },
    "chat": null,
    "location": null,
    "quotedMsg": null,
    "media": null
  },
  "timestamp": "2025-01-15T10:30:01.000Z"
}
```

### Exemplos Prontos
O projeto inclui exemplos funcionais:

1. **Cliente HTML** (`examples/websocket-client.html`)
   - Interface web completa
   - Visualização em tempo real
   - Filtros e busca

2. **Cliente Node.js** (`examples/websocket-client-node.js`)
   - Cliente de linha de comando
   - Logs detalhados
   - Tratamento de eventos

#### Executar Exemplos:
```bash
# Cliente HTML - abrir no navegador
open examples/websocket-client.html

# Cliente Node.js
cd examples
npm install
ACCESS_TOKEN=seu_token npm start
```

### Vantagens do WebSocket
- ✅ **Tempo real** - Mensagens instantâneas
- ✅ **Eficiência** - Sem polling desnecessário
- ✅ **Baixa latência** - Comunicação direta
- ✅ **Autenticação segura** - Token obrigatório
- ✅ **Múltiplas inscrições** - Um cliente pode monitorar vários WhatsApps
- ✅ **Informações completas** - Dados detalhados do contato

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

### v1.2.0
- ✅ **Sistema completo de mensagens recebidas**
- ✅ Armazenamento automático de mensagens (texto e mídia)
- ✅ API para buscar, filtrar e gerenciar mensagens
- ✅ Filtros por remetente, data, tipo e grupos/contatos
- ✅ Busca textual em mensagens
- ✅ Estatísticas detalhadas por cliente
- ✅ Download automático de mídia em Base64
- ✅ Limpeza de mensagens para gerenciar memória
- ✅ 5 novos endpoints para mensagens

### v1.1.0
- ✅ Adicionada autenticação por token
- ✅ Configuração via variáveis de ambiente
- ✅ Middleware de segurança
- ✅ Documentação de segurança atualizada