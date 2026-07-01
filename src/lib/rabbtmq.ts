import amqp from 'amqplib';

declare global {
  // eslint-disable-next-line no-var
  var rabbitmqChannel: amqp.Channel | undefined;
}

export async function getRabbitMQChannel(): Promise<amqp.Channel> {
  if (global.rabbitmqChannel) {
    return global.rabbitmqChannel;
  }

  const url = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
  
  const connection = await amqp.connect(url);
  connection.on('error', (err: Error) => console.error('RabbitMQ error:', err.message));
  connection.on('close', () => console.log('RabbitMQ connection closed'));

  const channel = await connection.createChannel();
  
  // Создаём очереди
  await channel.assertQueue('email_queue', { durable: true });
  await channel.assertQueue('image_processing_queue', { durable: true });
  await channel.assertQueue('notification_queue', { durable: true });

  console.log('RabbitMQ connected');

  global.rabbitmqChannel = channel;

  return channel;
}

export async function closeRabbitMQ() {
  if (global.rabbitmqChannel) {
    await global.rabbitmqChannel.close();
    global.rabbitmqChannel = undefined;
  }
}

export default getRabbitMQChannel;