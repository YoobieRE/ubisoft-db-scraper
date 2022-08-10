import pino, { PrettyOptions } from 'pino';
import debug from 'debug';
import { config, configDir } from './config';

const fileTransport = pino.transport({
  target: 'pino/file',
  options: {
    destination: `${configDir}/logs/log.json`,
    mkdir: true,
  },
});

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
      stream: fileTransport,
    },
  ])
);

if (config.connectionLog) {
  debug.log = fileTransport.write.bind(fileTransport);
  debug.enable('ubisoft-demux:connection*');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (debug as any).inspectOpts.colors = false;
}

export default logger;
