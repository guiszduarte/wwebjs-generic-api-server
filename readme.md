# 📱 WhatsApp Web.js MultiCliente Server

Servidor Node.js que utiliza **whatsapp-web.js** para controlar múltiplas sessões do WhatsApp Web, oferecendo uma **API REST** simples para integração com sistemas externos.

---

## 🚀 Funcionalidades
- Suporte a **múltiplos clientes** (sessões independentes).
- **Persistência de sessão** (não precisa reescanear o QR a cada execução).
- **API REST** para criar cliente, verificar status, obter QR Code, enviar mensagens e remover clientes.
- Suporte a QR Code em **Base64** (pronto para exibir em frontend).
- **Eventos de recebimento de mensagens** logados no console.
- Encerramento **graceful** (encerra todos os clientes ao parar o servidor).

---

## 📂 Estrutura do Projeto
```
whatsapp-server/
├── package.json
├── server.js
├── controllers/
│   └── whatsappController.js
├── services/
│   └── whatsappService.js
└── sessions/ (criado automaticamente para salvar sessões)
```

---

## ⚙️ Instalação

1. Clone ou baixe este repositório:
```bash
git clone https://github.com/seu-repo/whatsapp-multicliente.git
cd whatsapp-multicliente
```

2. Instale dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

Servidor rodará em: **http://localhost:3000**

---

## 🔑 Endpoints da API

### 1. Criar cliente
**POST** `/client/create`
```json
{ "clientId": "cliente1" }
```

### 2. Obter QR Code
**GET** `/client/:clientId/qr`

Resposta:
```json
{
  "clientId": "cliente1",
  "qrCode": "data:image/png;base64,..."
}
```

### 3. Status do cliente
**GET** `/client/:clientId/status`

Resposta:
```json
{
  "clientId": "cliente1",
  "status": "ready",
  "isReady": true
}
```

### 4. Enviar mensagem
**POST** `/client/:clientId/send`
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
**DELETE** `/client/:clientId`

### 6. Listar todos os clientes
**GET** `/clients`

---

## 📌 Fluxo de Uso
1. Criar um cliente
2. Obter QR Code e exibir para o usuário
3. Escanear QR pelo WhatsApp
4. Verificar status (aguardar `ready`)
5. Enviar mensagens e gerenciar sessões

---

## 🔒 Segurança
- Adicione autenticação (Bearer Token ou API Key) antes de expor esta API publicamente.
- Utilize HTTPS e firewall para proteger os endpoints.

---

## 🛠️ Tecnologias
- Node.js
- Express
- whatsapp-web.js
- qrcode
- fs-extra
- cors

---

## 👨‍💻 Autor
Projeto inicial gerado para integração de **WhatsApp MultiCliente** em sistemas externos.  
Adapte conforme necessário para o seu caso de uso.

