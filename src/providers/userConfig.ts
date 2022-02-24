import fs from 'fs';
import fsP from 'fs/promises';
import { WorkMode } from '../types/definitions';

type UserConfig = {
  owner: number
  qqUin: number;
  qqPassword: string;
  qqPlatform: number
  isSetup: boolean;
  workMode?: WorkMode
}

const CONFIG_PATH = './data/config.json';

const defaultConfig: UserConfig = {
  owner: 0,
  qqUin: 0,
  qqPassword: '',
  qqPlatform: 0,
  isSetup: false,
  workMode: undefined,
};

export const config: UserConfig = fs.existsSync(CONFIG_PATH) ?
  JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) :
  defaultConfig;

export const saveConfig = async () => {
  await fsP.writeFile(CONFIG_PATH, JSON.stringify(config, null, 0), 'utf8');
};
