import { upscaleWithIloveimg, VALID_SCALES } from '../lib/iloveimgUpscale.js'

function parseScale(args = []) {
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i]
    if (!token) continue
    const direct = token.match(/^([248])(?:x)?$/i)
    if (direct) return Number(direct[1])
    const flag = token.match(/^--?(?:scale|x)(?:=(\d+))?$/i)
    if (flag) {
      if (flag[1]) return Number(flag[1])
      const next = args[i + 1]
      if (next && /^\d+$/.test(next)) return Number(next)
    }
  }
  return 2
}

function pickFileName(mime, scale) {
  if (/png/i.test(mime)) return `iloveimg_x${scale}.png`
  return `iloveimg_x${scale}.jpg`
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  let q = m.quoted || m
  let mime = (q.msg || q).mimetype || q.mediaType || ''
  const fancyQuoted = await makeFkontak()
  const quotedContact = fancyQuoted || m

  if (!mime || !/image\/(jpe?g|png)/i.test(mime)) {
    const quotedContext = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedImage = quotedContext?.imageMessage
    if (quotedImage) {
      q = {
        message: { imageMessage: quotedImage },
        download: async () => conn.downloadMediaMessage({ key: {}, message: { imageMessage: quotedImage } })
      }
      mime = quotedImage.mimetype || 'image/jpeg'
    }
  }

  if (!mime || !/image\/(jpe?g|png)/i.test(mime)) {
    return conn.reply(m.chat, `> 🍃     *Envía o responde a una imagen JPG/PNG.
Uso: ${usedPrefix}${command} [2|4|8]*`, quotedContact)
  }

  let buffer
  try {
    buffer = await q.download?.()
  } catch (_) {
    buffer = null
  }
  if (!buffer) {
    try {
      buffer = await conn.downloadMediaMessage(q)
    } catch (err) {
      return conn.reply(m.chat, `> *No se pudo descargar la imagen: ${err.message || err}*`, quotedContact)
    }
  }

  if (!buffer) {
    return conn.reply(m.chat, '> *No se pudo obtener la imagen.*', quotedContact)
  }

  let scale = parseScale(args)
  if (!VALID_SCALES.has(scale)) {
    return conn.reply(m.chat, 'Escala inválida. Usa 2, 4 u 8.', quotedContact)
  }

  await m.react?.('🕑')
  try {
    const result = await upscaleWithIloveimg({
      buffer,
      fileName: pickFileName(mime, scale),
      mimeType: /png/i.test(mime) ? 'image/png' : 'image/jpeg',
      scale
    })

    await conn.sendMessage(
      m.chat,
      {
        image: result.buffer,
        mimetype: result.contentType || (/png/i.test(result.fileName) ? 'image/png' : 'image/jpeg'),
        caption: `> *Imagen mejorada x${scale}*`,
        fileName: result.fileName
      },
      { quoted: quotedContact }
    )
    await m.react?.('✅')
  } catch (err) {
    await m.react?.('❌')
    const errMsg = err?.response?.status
      ? `Error ${err.response.status}: ${err.response.statusText}`
      : (err?.message || 'Error desconocido')
    return conn.reply(m.chat, `Fallo al usar IloveIMG: ${errMsg}`, quotedContact)
  }
}

handler.help = ['hd']
handler.tags = ['tools']
handler.command = /^(hd|upscale|enhance|iloveimg)$/i

export default handler

async function makeFkontak() {
  try {
    const res = await fetch('https://i.postimg.cc/pLh4hJ7D/download-(1)-(1).png')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { locationMessage: { name: 'HD', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}
