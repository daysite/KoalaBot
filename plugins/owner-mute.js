let handler = async (m, { conn, usedPrefix, command }) => {
  let user = m.mentionedJid?.[0] || m.quoted?.sender;
  
  if (!user) {
    return conn.reply(m.chat, 
      `Etiqueta o responde al usuario para ${command === 'mute' ? 'mutear' : 'desmutear'}.`, 
      m
    );
  }

  if (!global.mutedUsers) global.mutedUsers = new Set();

  if (command === "mute") {
    if (global.mutedUsers.has(user)) {
      return conn.reply(m.chat, '✅ Usuario ya está muteado.', m, { mentions: [user] });
    }
    
    global.mutedUsers.add(user);
    await conn.reply(m.chat, '🔇 Usuario muteado - Sus mensajes se eliminarán.', m, { mentions: [user] });

  } else if (command === "unmute") {
    if (!global.mutedUsers.has(user)) {
      return conn.reply(m.chat, '🔊 Usuario no está muteado.', m, { mentions: [user] });
    }
    
    global.mutedUsers.delete(user);
    await conn.reply(m.chat, '🔊 Usuario desmuteado.', m, { mentions: [user] });
  }
};

handler.before = async (m, { conn }) => {
  if (!global.mutedUsers || !m.sender) return;
  
  if (global.mutedUsers.has(m.sender)) {
    try {
      // MÉTODO 1: Forma moderna
      await conn.sendMessage(m.chat, { 
        delete: { 
          id: m.key.id, 
          remoteJid: m.chat, 
          fromMe: false,
          participant: m.sender
        } 
      });
      
      // Si no funciona, intentar MÉTODO 2
      // await conn.modifyMessage(m.chat, m.key, "delete");
      
      // Si no funciona, intentar MÉTODO 3  
      // await conn.sendMessage(m.chat, { delete: m.key });
      
      console.log('Mensaje eliminado de usuario muteado:', m.sender);
      
    } catch (e) {
      console.error('Error eliminando mensaje:', e);
      
      // Si falla, intentar eliminar de otra forma
      try {
        // MÉTODO 4: Usando messageUpdate
        await conn.relayMessage(m.chat, {
          protocolMessage: {
            key: m.key,
            type: 14
          }
        }, {});
      } catch (e2) {
        console.error('Error método alternativo:', e2);
      }
    }
    return true;
  }
};

handler.help = ['mute', 'unmute'];
handler.tags = ['group'];
handler.command = /^(mute|unmute)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
