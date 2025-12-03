import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return conn.reply(m.chat, 
`> ⓘ USO INCORRECTO

> ❌ Debes proporcionar el nombre de la canción

> 📝 Ejemplos:
> • ${usedPrefix}play nombre de la canción
> • ${usedPrefix}play artista canción`, m)
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

    const search = await yts(text)
    if (!search.videos.length) throw new Error('No encontré resultados')

    const video = search.videos[0]
    const { title, url, thumbnail } = video

    let thumbBuffer = null
    if (thumbnail) {
      try {
        const resp = await fetch(thumbnail)
        thumbBuffer = Buffer.from(await resp.arrayBuffer())
      } catch (err) {
        console.log('No se pudo obtener la miniatura:', err.message)
      }
    }

    const fuentes = [
      { api: 'Adonix', endpoint: `https://api-adonix.ultraplus.click/download/ytaudio?apikey=${global.apikey}&url=${encodeURIComponent(url)}`, extractor: res => res?.data?.url },
      { api: 'MayAPI', endpoint: `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=mp3&apikey=${global.APIKeys['https://mayapi.ooguy.com']}`, extractor: res => res.result.url }
    ]

    let audioUrl, exito = false

    for (let fuente of fuentes) {
      try {
        const response = await fetch(fuente.endpoint)
        if (!response.ok) continue
        const data = await response.json()
        const link = fuente.extractor(data)
        if (link) {
          audioUrl = link
          exito = true
          break
        }
      } catch (err) {
        console.log(`Error con ${fuente.api}:`, err.message)
      }
    }

    if (!exito) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
      return conn.reply(m.chat, 
`> ⓘ ERROR

> ❌ No se pudo obtener el audio

> 💡 Las APIs están temporalmente fuera de servicio`, m)
    }

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        ptt: false,
        jpegThumbnail: thumbBuffer,
        fileName: `audio.mp3`
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error('Error en play:', e)
    await conn.reply(m.chat, 
`> ⓘ ERROR

> ❌ ${e.message}

> 💡 Verifica el nombre o intenta más tarde`, m)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }
}

handler.help = ['play']
handler.tags = ['downloader']
handler.command = ['play']
handler.group = true

export default handler