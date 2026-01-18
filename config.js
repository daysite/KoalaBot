import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import { dirname } from 'path' 

global.__dirname = (url) => dirname(fileURLToPath(url));


//aquí los retirados👑🥀
global.retirado = [
['51994143761','Daniel',true]
];

/*habrán comandos especiales para los retirados algo q los identifique | nota ustedes pondrán los coamndos y q solo funcione para los retirados*/

// Configuraciones principales
global.roowner = ['51994143761', '51994143761']
global.owner = [
   ['51994143761', 'YO SOY YO', true],
   ['51994143761', 'daniel', true],
   ['51994143761', 'Pedro Kabro', true],
   ['51994143761', 'Soporte Bot', true],
   ['51994143761', 'Bot', true],
   ['51994143761', 'Danizffx', true],
   ['51994143761', 'Pedro', true],
   ];

global.mods = ['51994143761', '51994143761', '51994143761']
global.suittag = ['51994143761', '51994143761', '51994143761']
global.prems = ['51994143761', '51994143761', '51994143761', '51994143761']

// Información del bot 
global.libreria = 'Baileys'
global.baileys = 'V 6.7.9'
global.languaje = 'Español'
global.vs = '7.5.2'
global.vsJB = '5.0'
global.nameqr = 'sexqr'
global.namebot = 'Sex legal-IA'
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.ItsukiJadibts = true
global.Choso = true
global.prefix = ['.', '!', '/' , '#', '%']
global.apikey = 'ItsukiNakanoIA'
global.botNumber = '18482389332'
// Números y settings globales para varios códigos
global.packname = 'El mejor Bot de WhatsApp'
global.botname = 'TOP KOALA BOT'
global.wm = '© DANIEL'
global.wm3 = '⫹⫺ MULTI DEVICE'
global.author = '👑 MADE BY DANIEL 🧃'
global.dev = '© POWERED BY DANIEL'
global.textbot = 'KOALA BOT|DANIZFFX'
global.etiqueta = '@DANIEL'
global.gt = '© CREADO POR DANIEL'
global.me = '🌨️ TOP KOALA BOT ☃️'
global.listo = '*Aqui tiene*'
global.moneda = 'Yenes'
global.multiplier = 69
global.maxwarn = 3
global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

// Enlaces oficiales del bot
global.gp1 = 'https://chat.whatsapp.com/B5qa7Gkt00F46fejTWifSB?mode=hqrc'
global.comunidad1 = 'https://chat.whatsapp.com/B5qa7Gkt00F46fejTWifSB?mode=hqrc'
global.channel = 'https://chat.whatsapp.com/B5qa7Gkt00F46fejTWifSB?mode=hqrc'
global.channel2 = 'https://chat.whatsapp.com/B5qa7Gkt00F46fejTWifSB?mode=hqrc'
global.md = 'https://chat.whatsapp.com/B5qa7Gkt00F46fejTWifSB?mode=hqrc'
global.correo = 'https://chat.whatsapp.com/B5qa7Gkt00F46fejTWifSB?mode=hqrc'

// Apis para las descargas y más
global.APIs = {
  ryzen: 'https://api.ryzendesu.vip',
  xteam: 'https://api.xteam.xyz',
  lol: 'https://api.lolhuman.xyz',
  delirius: 'https://delirius-apiofc.vercel.app',
  siputzx: 'https://api.siputzx.my.id', // usado como fallback para sugerencias IA
  mayapi: 'https://mayapi.ooguy.com'
}

global.APIKeys = {
  'https://api.xteam.xyz': 'YOUR_XTEAM_KEY',
  'https://api.lolhuman.xyz': 'API_KEY',
  'https://api.betabotz.eu.org': 'API_KEY',
  'https://mayapi.ooguy.com': 'may-f53d1d49'
}

// Endpoints de IA
global.SIPUTZX_AI = {
  base: global.APIs?.siputzx || 'https://api.siputzx.my.id',
  bardPath: '/api/ai/bard',
  queryParam: 'query',
  headers: { accept: '*/*' }
}


global.chatDefaults = {
  isBanned: false,
  sAutoresponder: '',
  welcome: true,
  autolevelup: false,
  autoAceptar: false,
  autosticker: false,
  autoRechazar: false,
  autoresponder: false,
  detect: true,
  antiBot: false,
  antiBot2: false,
  modoadmin: false,
  antiLink: true,
  antiImg: false,
  reaction: false,
  nsfw: false,
  antifake: false,
  delete: false,
  expired: 0,
  antiLag: false,
  per: [],
  antitoxic: false
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  try { import(pathToFileURL(file).href + `?update=${Date.now()}`) } catch {}
})

// Configuraciones finales
export default {
  prefix: global.prefix,
  owner: global.owner,
  sessionDirName: global.sessions,
  sessionName: global.sessions,
  botNumber: global.botNumber,
  chatDefaults: global.chatDefaults
}
