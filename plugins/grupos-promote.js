const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin, usedPrefix, command }) => {
  if (!m.isGroup) {
    return conn.reply(m.chat, '> ⓘ \`Este comando solo funciona en grupos\`', m)
  }

  if (!isBotAdmin) {
    return conn.reply(m.chat, '> ⓘ \`Necesito ser administradora para promover usuarios\`', m)
  }

  if (!isAdmin) {
    return conn.reply(m.chat, '> ⓘ \`Solo los administradores pueden usar este comando\`', m)
  }

  await m.react('🕒')

  try {
    let targetUser = null
    
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetUser = m.mentionedJid[0]
    } else if (m.quoted) {
      targetUser = m.quoted.sender
    } else if (text) {
      const num = text.replace(/[^0-9]/g, '')
      if (num.length >= 8) {
        targetUser = num + '@s.whatsapp.net'
      }
    }

    if (!targetUser) {
      await m.react('❌')
      return conn.reply(m.chat, 
        `> ⓘ \`Debes mencionar o responder a un usuario\`\n> ⓘ \`Ejemplo:\` *${usedPrefix}${command} @usuario*`, 
        m
      )
    }

    const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!groupMetadata) {
      await m.react('❌')
      return conn.reply(m.chat, '> ⓘ \`Error al obtener información del grupo\`', m)
    }

    const userInGroup = groupMetadata.participants.find(p => 
      p.id === targetUser || 
      p.jid === targetUser
    )

    if (!userInGroup) {
      await m.react('❌')
      return conn.reply(m.chat, '> ⓘ \`El usuario no está en este grupo\`', m)
    }

    if (userInGroup.admin === 'admin' || userInGroup.admin === 'superadmin') {
      await m.react('ℹ️')
      return conn.reply(m.chat, '> ⓘ \`Este usuario ya es administrador\`', m)
    }

    await conn.groupParticipantsUpdate(m.chat, [targetUser], 'promote')
    
    await m.react('✅')
    await conn.reply(m.chat, `> ⓘ \`Usuario promovido:\` *@${targetUser.split('@')[0]}*`, m, { mentions: [targetUser] })

  } catch (error) {
    await m.react('❌')
    
    if (error.message?.includes('not authorized')) {
      return conn.reply(m.chat, '> ⓘ \`No tengo permisos suficientes para promover usuarios\`', m)
    } else if (error.message?.includes('not in group')) {
      return conn.reply(m.chat, '> ⓘ \`El usuario no está en el grupo\`', m)
    } else {
      return conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
    }
  }
}

handler.help = ['promote']
handler.tags = ['group']
handler.command = /^(promote)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler