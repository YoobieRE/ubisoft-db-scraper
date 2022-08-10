import pino, { PrettyOptions } from 'pino';
import { config, configDir } from './config';

const logger = pino(
  {
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    level: 'trace', // Must be lowest level
    base: undefined,
  },
  pino.multistream([
    {
      level: config.logLevel || 'info',
      stream: pino.transport<PrettyOptions>({
        target: 'pino-pretty',
        options: {
          translateTime: 'SYS:standard',
        },
      }),
    },

    {
      level: config.fileLogLevel || 'debug',
      stream: pino.transport({
        target: 'pino/file',
        options: {
          destination: `${configDir}/logs/log.json`,
          mkdir: true,
        },
      }),
    },
  ])
);

export default logger;
