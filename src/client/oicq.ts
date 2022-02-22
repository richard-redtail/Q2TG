import { Client, createClient, Platform } from 'oicq';
import * as Buffer from 'buffer';
import { execSync } from 'child_process';
import random from '../utils/random';
import fs from 'fs';
import fsP from 'fs/promises';

interface CreateOicqParams {
  uin: number;
  password: string;
  platform: Platform;
  // 当需要验证手机时调用此方法，应该返回收到当手机验证码
  onVerifyDevice: (phone: string) => Promise<string>;
  // 当滑块时调用此方法，返回 ticker，也可以返回假值改用扫码登录
  onVerifySlider: (url: string) => Promise<string>;
  // 扫码后返回
  onQrCode: (image: Buffer) => Promise<void>;
}

export default function createOicq(params: CreateOicqParams) {
  return new Promise<Client>(async (resolve, reject) => {
    async function loginDeviceHandler({ phone }: { url: string, phone: string }) {
      client.sendSmsCode();
      const code = await params.onVerifyDevice(phone);
      client.submitSmsCode(code);
    }

    async function loginSliderHandler({ url }: { url: string }) {
      const res = await params.onVerifySlider(url);
      if (res) {
        client.submitSlider(res);
      }
      else {
        client.login();
      }
    }

    async function loginQrCodeHandler({ image }: { image: Buffer }) {
      await params.onQrCode(image);
      client.qrcodeLogin();
    }

    function loginErrorHandler({ message }: { code: number; message: string }) {
      reject(message);
    }

    function successLoginHandler() {
      client.off('system.login.device', loginDeviceHandler)
        .off('system.login.slider', loginSliderHandler)
        .off('system.login.qrcode', loginQrCodeHandler)
        .off('system.login.error', loginErrorHandler)
        .off('system.online', successLoginHandler);
      resolve(client);
    }

    if (!fs.existsSync(`./data/${params.uin}/device-${params.uin}.json`)) {
      !fs.existsSync('./data') && await fsP.mkdir('./data');
      !fs.existsSync(`./data/${params.uin}`) && await fsP.mkdir(`./data/${params.uin}`);

      const device = {
        product: 'Q2TG',
        device: 'ANGELKAWAII2',
        board: 'raincandy',
        brand: random.pick('GOOGLE', 'XIAOMI', 'HUAWEI', 'SAMSUNG', 'SONY'),
        model: 'raincandy',
        wifi_ssid: random.pick('OpenWrt', `Redmi-${random.hex(4)}`,
          `MiWifi-${random.hex(4)}`, `TP-LINK-${random.hex(6)}`),
        bootloader: random.pick('U-Boot', 'GRUB', 'gummiboot'),
        android_id: random.hex(16),
        proc_version: `${execSync('uname -s').toString().replace('\n', '')} version ${execSync('uname -r').toString().replace('\n', '')}`,
        mac_address: `8c:85:90:${random.hex(2)}:${random.hex(2)}:${random.hex(2)}`.toUpperCase(),
        ip_address: `192.168.${random.int(1, 200)}.${random.int(10, 250)}`,
        incremental: random.int(0, 4294967295),
        imei: random.imei(),
      };

      await fsP.writeFile(`./data/${params.uin}/device-${params.uin}.json`, JSON.stringify(device, null, 0), 'utf-8');
    }

    const client = createClient(params.uin, {
      platform: params.platform,
      data_dir: './data',
    })
      .on('system.login.device', loginDeviceHandler)
      .on('system.login.slider', loginSliderHandler)
      .on('system.login.qrcode', loginQrCodeHandler)
      .on('system.login.error', loginErrorHandler)
      .on('system.online', successLoginHandler);
    client.login(params.password);
  });
}