import { createClient, RedisClientType } from 'redis';
import { Service } from 'typedi'; // Or use tsyringe
import { LoggerService } from '../libs/services/logger.service';

@Service()
export class RedisService {
  public client: RedisClientType;

  constructor(private logger: LoggerService) {
    const REDIS_URL = process.env.REDIS_URL;
    this.client = createClient({ url: REDIS_URL }) as RedisClientType;
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      this.logger.info('Redis connected succesfully');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
      this.logger.info('Redis disconected succesfully');
    }
  }
}
