import pino from 'pino';
import { config } from './config';

const logger = pino({
  // transport: {
  //   target: 'pino-pretty',
  //   options: {
  //     translateTime: `SYS:standard`,
  //   },
  // },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  level: config.logLevel || 'info',
  base: undefined,
});

export default logger;
