import fs from 'fs-extra';
import path from 'path';

const cacheLocation = './cache';

export async function writeRememberMeTicket(token: string, email: string) {
  await fs.outputFile(path.resolve(cacheLocation, `${email}.txt`), token, 'utf-8');
}

export async function readRememberMeTicket(email: string): Promise<string | undefined> {
  try {
    return await fs.readFile(path.resolve(cacheLocation, `${email}.txt`), 'utf-8');
  } catch (err) {
    // TODO: catch only file not found
    return undefined;
  }
}
