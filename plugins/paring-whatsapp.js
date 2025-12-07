import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg
import pino from "pino";
import { protoType, serialize, makeWASocket } from '../lib/simple.js'
import path from 'path'
import fs from 'fs'

// --- CAMBIO CLAVE ---
// Inicializamos global.conns en lugar de global.subbots
if (!global.conns) global.conns = []

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let userName = args[0] ? args[0] : m.sender.split("@")[0]
  const folder = path.join('Sessions/SubBot', userName)

  // --- CAMBIO CLAVE ---
  // Usamos global.conns para verificar el límite
  if (global.conns.length >= 10) {
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    return conn.reply(m.chat, '> [🌱] 𝙔𝙖 𝙉𝙤 𝙃𝙖𝙮 𝙈𝙖́𝙨 𝙀𝙨𝙥𝙖𝙘𝙞𝙤 𝙋𝙖𝙧𝙖 𝙃𝙖𝙘𝙚𝙧𝙩𝙚 𝙎𝙪𝙗-𝘽𝙤𝙩 𝙄𝙣𝙩𝙚𝙣𝙩𝙖𝙡𝙤 𝙉𝙪𝙚𝙫𝙖𝙢𝙚𝙣𝙩𝙚 𝙈𝙖́𝙨 𝙏𝙖𝙧𝙙𝙚...', m)
  }

  // --- CAMBIO CLAVE ---
  // Usamos global.conns para buscar una conexión existente
  const existing = global.conns.find(c => c.id === userName && c.connection === 'open')
  if (existing) {
    await conn.sendMessage(m.chat, { react: { text: '🤖', key: m.key } })
    return conn.reply(m.chat, '*𝘠𝘢 𝘌𝘳𝘦𝘴 𝘚𝘶𝘣-𝘣𝘰𝘵 𝘋𝘦 𝘐𝘵𝘴𝘶𝘬𝘪 🟢*', m)
  }

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  await conn.sendPresenceUpdate('composing', m.chat)

  const start = async () => {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(folder)
      const { version } = await fetchLatestBaileysVersion()

      const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        browser: Browsers.macOS('Safari'),
        printQRInTerminal: false
      })

      sock.id = userName
      sock.saveCreds = saveCreds
      let pairingCodeSent = false

      try {
        protoType()
        serialize()
      } catch (e) {
          console.log(e)
      }

      let handlerr
      try {
        ({ handler: handlerr } = await import('../handler.js'))
      } catch (e) {
        console.error('[Handler] Error importando handler:', e)
      }

      sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
          if (!handlerr) return
          await handlerr.call(sock, chatUpdate)
        } catch (e) {
          console.error("Error en handler subbot:", e)
        }
      })

      sock.ev.on('creds.update', saveCreds)

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'open') {
          sock.__sessionOpenAt = Date.now()
          sock.connection = 'open'
          sock.uptime = new Date()

          // --- CAMBIO CLAVE ---
          // Filtramos y añadimos a global.conns
          global.conns = global.conns.filter(c => c.id !== userName)
          global.conns.push(sock)

          await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          await conn.reply(m.chat, '> [🌱] 𝙎𝙪𝙗-𝙗𝙤𝙩 𝘾𝙤𝙣𝙚𝙘𝙩𝙖𝙙𝙤 𝙀𝙭𝙞𝙩𝙤𝙨𝙖𝙢𝙚𝙣𝙩𝙚', m)
        }

        if (connection === 'close') {
          // --- CAMBIO CLAVE ---
          // Filtramos en global.conns al desconectar
          global.conns = global.conns.filter(c => c.id !== userName)

          const reason = lastDisconnect?.error?.output?.statusCode || 0

          await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })
          await conn.reply(m.chat, `> [🔴] 𝐂𝐎𝐍𝐄𝐗𝐈𝐎𝐍 𝐂𝐄𝐑𝐑𝐀𝐃𝐀....`, m)

          if (reason !== DisconnectReason.loggedOut) {
            setTimeout(() => {
              start()
            }, 5000)
          } else {
            fs.rmSync(folder, { recursive: true, force: true })
          }
        }
      })

      sock.ev.on('group-participants.update', async (update) => {
        try {
          const { id, participants, action } = update || {}
          if (!id || !participants || !participants.length) return
        } catch (e) {}
      })

      if (!state.creds?.registered && !pairingCodeSent) {
        pairingCodeSent = true

        // Emoji de espera
        await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

        setTimeout(async () => {
          try {
            const rawCode = await sock.requestPairingCode(userName)

            // Emoji cuando se genera el código
            await conn.sendMessage(m.chat, { react: { text: '✅️', key: m.key } })

            // Imagen URL
            const imageUrl = 'https://cdn.russellxz.click/73109d7e.jpg'
            const media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer })

            const header = proto.Message.InteractiveMessage.Header.fromObject({
              hasMediaAttachment: true,
              imageMessage: media.imageMessage
            })

            // Crear mensaje interactivo con botones
            const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
              header,
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `> *❀ OPCIÓN-CODIGO ❀*

𓂃 ࣪ ִֶָ☾.  
> 1. 📲 *WhatsApp → Ajustes*  
> 2. ⛓️‍💥 *Dispositivos vinculados*  
> 3. 🔐 *Toca vincular*  
> 4. ✨ Copia este código:

> ˗ˏˋ ꕤ  ${rawCode.match(/.{1,4}/g)?.join(' ⸰ ')}  ꕤ ˎˊ˗

> ⌛ ⋮ *10 segundos de magia*  
> 🍒 ࣪𓂃 *¡Consejito dale rapidito!* ˚₊‧꒰ა ♡ ໒꒱ ‧₊˚`
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: "ᴄᴏᴘɪᴀ ᴇʟ ᴄᴏᴅɪɢᴏ ᴀǫᴜɪ ᴀʙᴀᴊᴏ 🌺"
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "𝗖𝗼𝗽𝗶𝗮 𝗘𝗹 𝗖𝗼𝗱𝗶𝗴𝗼 📋",
                      copy_code: rawCode
                    })
                  },
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                      display_text: "𝗖𝗮𝗻𝗮𝗹 𝗢𝗳𝗶𝗰𝗮𝗹 🌷",
                      url: "https://whatsapp.com/channel/0029VbBvZH5LNSa4ovSSbQ2N"
                    })
                  }
                ]
              })
            })

            const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })

            console.log(`Código de vinculación enviado: ${rawCode}`)

          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            await conn.reply(m.chat, `*⚙️ Error: ${err.message}*`, m)
          }
        }, 3000)
      }

    } catch (error) {
      console.error('Error al crear socket:', error)
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      await conn.reply(m.chat, `Error critico: ${error.message}`, m)
    }
  }

  start()
}

handler.help = ['code']
handler.tags = ['serbot']
handler.command = ['code']
export default handler