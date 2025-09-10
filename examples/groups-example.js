/**
 * Exemplo de uso das funcionalidades de grupos do WhatsApp Web.js MultiCliente Server
 * 
 * Este exemplo demonstra como interagir com grupos do WhatsApp usando a API REST
 */

const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000';
const CLIENT_ID = 'meu-cliente-1';
const TOKEN = 'seu-token-aqui'; // Substitua pelo seu token

// Headers padrão para as requisições
const headers = {
  'Content-Type': 'application/json'
};

class WhatsAppGroupsExample {
  
  /**
   * Lista todos os grupos disponíveis para um cliente
   */
  async listGroups() {
    try {
      console.log('📋 Listando grupos disponíveis...');
      
      const response = await axios.get(
        `${BASE_URL}/client/${CLIENT_ID}/groups?token=${TOKEN}`,
        { headers }
      );
      
      console.log('✅ Grupos encontrados:', response.data.total);
      response.data.groups.forEach(group => {
        console.log(`  📱 ${group.name} (${group.participantsCount} participantes)`);
      });
      
      return response.data.groups;
    } catch (error) {
      console.error('❌ Erro ao listar grupos:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Busca um grupo específico pelo nome
   */
  async findGroup(groupName) {
    try {
      console.log(`🔍 Buscando grupo: ${groupName}...`);
      
      const response = await axios.get(
        `${BASE_URL}/client/${CLIENT_ID}/groups/${encodeURIComponent(groupName)}?token=${TOKEN}`,
        { headers }
      );
      
      console.log('✅ Grupo encontrado:', response.data.group.name);
      return response.data.group;
    } catch (error) {
      console.error('❌ Erro ao buscar grupo:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Obtém informações detalhadas de um grupo
   */
  async getGroupInfo(groupName) {
    try {
      console.log(`ℹ️  Obtendo informações do grupo: ${groupName}...`);
      
      const response = await axios.get(
        `${BASE_URL}/client/${CLIENT_ID}/groups/${encodeURIComponent(groupName)}/info?token=${TOKEN}`,
        { headers }
      );
      
      const group = response.data.group;
      console.log('✅ Informações do grupo:');
      console.log(`  📱 Nome: ${group.name}`);
      console.log(`  👥 Participantes: ${group.participantsCount}`);
      console.log(`  📝 Descrição: ${group.description || 'Sem descrição'}`);
      console.log(`  🔇 Silenciado: ${group.isMuted ? 'Sim' : 'Não'}`);
      console.log(`  📅 Criado em: ${group.createdAt ? new Date(group.createdAt).toLocaleString() : 'Desconhecido'}`);
      
      if (group.participants && group.participants.length > 0) {
        console.log('  👥 Participantes:');
        group.participants.slice(0, 5).forEach(participant => {
          const role = participant.isSuperAdmin ? '👑' : participant.isAdmin ? '⭐' : '👤';
          console.log(`    ${role} ${participant.name} (${participant.number})`);
        });
        if (group.participants.length > 5) {
          console.log(`    ... e mais ${group.participants.length - 5} participantes`);
        }
      }
      
      return group;
    } catch (error) {
      console.error('❌ Erro ao obter informações do grupo:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Envia uma mensagem para um grupo
   */
  async sendMessageToGroup(groupName, message) {
    try {
      console.log(`📤 Enviando mensagem para o grupo: ${groupName}...`);
      
      const response = await axios.post(
        `${BASE_URL}/client/${CLIENT_ID}/groups/send?token=${TOKEN}`,
        {
          groupName: groupName,
          message: message
        },
        { headers }
      );
      
      console.log('✅ Mensagem enviada com sucesso!');
      console.log(`  📱 Grupo: ${response.data.groupName}`);
      console.log(`  💬 Mensagem: ${response.data.message}`);
      console.log(`  ⏰ Enviado em: ${new Date(response.data.timestamp).toLocaleString()}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Obtém mensagens de um grupo específico
   */
  async getGroupMessages(groupName, options = {}) {
    try {
      console.log(`📨 Obtendo mensagens do grupo: ${groupName}...`);
      
      const params = new URLSearchParams({ token: TOKEN });
      if (options.limit) params.append('limit', options.limit);
      if (options.lastHours) params.append('lastHours', options.lastHours);
      if (options.from) params.append('from', options.from);
      if (options.type) params.append('type', options.type);
      
      const response = await axios.get(
        `${BASE_URL}/client/${CLIENT_ID}/groups/${encodeURIComponent(groupName)}/messages?${params}`,
        { headers }
      );
      
      console.log('✅ Mensagens obtidas:');
      console.log(`  📱 Grupo: ${response.data.groupName}`);
      console.log(`  📊 Total: ${response.data.total} mensagens`);
      
      response.data.messages.slice(0, 5).forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        const sender = msg.contact?.name || 'Desconhecido';
        console.log(`  💬 [${time}] ${sender}: ${msg.body.substring(0, 50)}${msg.body.length > 50 ? '...' : ''}`);
      });
      
      if (response.data.messages.length > 5) {
        console.log(`  ... e mais ${response.data.messages.length - 5} mensagens`);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter mensagens do grupo:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Exemplo completo de uso das funcionalidades
   */
  async runExample() {
    console.log('🚀 Iniciando exemplo de funcionalidades de grupos...\n');
    
    // 1. Listar todos os grupos
    const groups = await this.listGroups();
    if (groups.length === 0) {
      console.log('❌ Nenhum grupo encontrado. Certifique-se de que o cliente está conectado e possui grupos.');
      return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Usar o primeiro grupo como exemplo
    const firstGroup = groups[0];
    console.log(`📱 Usando o grupo "${firstGroup.name}" como exemplo...\n`);
    
    // 3. Obter informações detalhadas do grupo
    await this.getGroupInfo(firstGroup.name);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. Obter mensagens recentes do grupo
    await this.getGroupMessages(firstGroup.name, { limit: 10, lastHours: 24 });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. Enviar uma mensagem de teste (descomente se quiser testar)
    // await this.sendMessageToGroup(firstGroup.name, '🤖 Mensagem de teste do bot!');
    
    console.log('✅ Exemplo concluído!');
  }
}

// Executar o exemplo se este arquivo for executado diretamente
if (require.main === module) {
  const example = new WhatsAppGroupsExample();
  example.runExample().catch(console.error);
}

module.exports = WhatsAppGroupsExample;