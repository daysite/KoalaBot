// plugins/grupo-info.js
let handler = async (m, { conn, usedPrefix }) => {
    let chat = global.db.data.chats[m.chat]
    
    let info = `╭─「 📊 *CONFIGURACIÓN DEL GRUPO* 📊 」
│ 
│ 🛡️ *Seguridad:*
│ ├ AntiLink: ${chat.antiLink ? '🟢' : '🔴'}
│ ├ AntiArabe: ${chat.antiArabe ? '🟢' : '🔴'}
│ 
│ 🎉 *Bienvenidas:*
│ ├ Welcome: ${chat.welcome ? '🟢' : '🔴'}
│ 
│ ⚙️ *Otras configs:*
│ ├ NSFW: ${chat.nsfw ? '🟢' : '🔴'}
│ ├ Economy: ${chat.economy ? '🟢' : '🔴'}
│ ├ Gacha: ${chat.gacha ? '🟢' : '🔴'}
│ 
│ ${chat.rootowner ? '⚠️ *NOTA:* Bot solo responde al creador' : ''}
╰─◉`.trim()

    await m.reply(info)
}

handler.help = ['config', 'settings', 'configuracion']
handler.tags = ['group']
handler.command = /^(config|settings|configuracion)$/i
handler.group = true
export default handler