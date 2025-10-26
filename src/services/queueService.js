import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:senha_forte_aqui@localhost:5672';
const NARRATIVE_QUEUE = 'narrative_analysis_queue';
const NARRATIVE_DLQ = 'narrative_analysis_dlq'; // Dead Letter Queue
const MAX_RETRIES = 3;

let connection = null;
let channel = null;

/**
 * Conecta ao RabbitMQ e configura filas
 */
export const connectRabbitMQ = async () => {
  try {
    if (connection) {
      console.log('[RabbitMQ] Already connected');
      return { connection, channel };
    }

    console.log('[RabbitMQ] Connecting to:', RABBITMQ_URL.replace(/\/\/.*@/, '//*****@'));
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Configurar Dead Letter Queue (para mensagens que falham após retries)
    await channel.assertQueue(NARRATIVE_DLQ, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000 // 24 horas
      }
    });

    // Configurar fila principal com DLQ
    await channel.assertQueue(NARRATIVE_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': NARRATIVE_DLQ
      }
    });

    // Prefetch: processa 1 mensagem por vez (controle fino)
    await channel.prefetch(1);

    console.log('[RabbitMQ] ✅ Connected and queues configured');
    console.log(`[RabbitMQ] Main Queue: ${NARRATIVE_QUEUE}`);
    console.log(`[RabbitMQ] Dead Letter Queue: ${NARRATIVE_DLQ}`);

    // Handlers para reconexão automática
    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.warn('[RabbitMQ] Connection closed, reconnecting in 5s...');
      connection = null;
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    return { connection, channel };
  } catch (error) {
    console.error('[RabbitMQ] Connection failed:', error.message);
    connection = null;
    channel = null;
    
    // Retry connection após 10 segundos
    setTimeout(connectRabbitMQ, 10000);
    throw error;
  }
};

/**
 * Adiciona token na fila para análise
 * @param {Object} tokenData - Dados do token
 * @returns {Promise<boolean>}
 */
export const enqueueTokenAnalysis = async (tokenData) => {
  try {
    if (!channel) {
      console.warn('[RabbitMQ] Channel not ready, connecting...');
      await connectRabbitMQ();
    }

    const message = {
      tokenSymbol: tokenData.tokenSymbol,
      tokenAddress: tokenData.tokenAddress,
      narrativeId: tokenData.narrativeId,
      callContext: tokenData.callContext,
      enqueuedAt: new Date().toISOString(),
      retries: 0
    };

    const sent = channel.sendToQueue(
      NARRATIVE_QUEUE,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true, // Mensagem sobrevive a restart do RabbitMQ
        priority: tokenData.priority || 5 // Prioridade 0-10
      }
    );

    if (sent) {
      console.log(`[Queue] ✅ Enqueued: ${tokenData.tokenSymbol} (${tokenData.tokenAddress})`);
      return true;
    } else {
      console.warn(`[Queue] ⚠️ Queue full, message buffered`);
      return false;
    }
  } catch (error) {
    console.error('[Queue] Error enqueueing token:', error.message);
    throw error;
  }
};

/**
 * Obtém estatísticas da fila
 * @returns {Promise<Object>}
 */
export const getQueueStats = async () => {
  try {
    if (!channel) {
      return { error: 'RabbitMQ not connected' };
    }

    const mainQueue = await channel.checkQueue(NARRATIVE_QUEUE);
    const dlq = await channel.checkQueue(NARRATIVE_DLQ);

    return {
      mainQueue: {
        name: NARRATIVE_QUEUE,
        messageCount: mainQueue.messageCount,
        consumerCount: mainQueue.consumerCount
      },
      deadLetterQueue: {
        name: NARRATIVE_DLQ,
        messageCount: dlq.messageCount
      },
      status: 'connected'
    };
  } catch (error) {
    console.error('[Queue] Error getting stats:', error.message);
    return { error: error.message };
  }
};

/**
 * Reprocessa mensagens da DLQ
 * @param {number} limit - Número de mensagens para reprocessar
 * @returns {Promise<number>}
 */
export const reprocessDLQ = async (limit = 10) => {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    let reprocessed = 0;

    for (let i = 0; i < limit; i++) {
      const msg = await channel.get(NARRATIVE_DLQ, { noAck: false });
      
      if (!msg) {
        break; // Fila vazia
      }

      const content = JSON.parse(msg.content.toString());
      
      // Reseta contador de retries
      content.retries = 0;
      content.reprocessedAt = new Date().toISOString();

      // Reenvia para fila principal
      channel.sendToQueue(
        NARRATIVE_QUEUE,
        Buffer.from(JSON.stringify(content)),
        { persistent: true }
      );

      // Acknowledges mensagem da DLQ
      channel.ack(msg);
      reprocessed++;
    }

    console.log(`[Queue] ♻️ Reprocessed ${reprocessed} messages from DLQ`);
    return reprocessed;
  } catch (error) {
    console.error('[Queue] Error reprocessing DLQ:', error.message);
    throw error;
  }
};

/**
 * Limpa fila (use com cuidado!)
 * @param {string} queueName - Nome da fila
 * @returns {Promise<number>}
 */
export const purgeQueue = async (queueName = NARRATIVE_QUEUE) => {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    const result = await channel.purgeQueue(queueName);
    console.log(`[Queue] 🗑️ Purged ${result.messageCount} messages from ${queueName}`);
    return result.messageCount;
  } catch (error) {
    console.error('[Queue] Error purging queue:', error.message);
    throw error;
  }
};

/**
 * Fecha conexão com RabbitMQ
 */
export const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('[RabbitMQ] Connection closed gracefully');
  } catch (error) {
    console.error('[RabbitMQ] Error closing connection:', error.message);
  }
};

// Getter para channel (usado pelo consumer)
export const getChannel = () => channel;

// Exports nomeados
export { NARRATIVE_QUEUE, NARRATIVE_DLQ, MAX_RETRIES };

export default {
  connectRabbitMQ,
  enqueueTokenAnalysis,
  getQueueStats,
  reprocessDLQ,
  purgeQueue,
  closeRabbitMQ,
  getChannel
};
