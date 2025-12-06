// welcome.js
import { WAMessageStubType } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';

const formatMemberNumber = (num) => {
    if (num % 100 >= 11 && num % 100 <= 13) return `${num}th`;
    switch (num % 10) {
        case 1: return `${num}st`;
        case 2: return `${num}nd`;
        case 3: return `${num}rd`;
        default: return `${num}th`;
    }
};

export async function before(m, { conn, participants, groupMetadata }) {
    // Solo procesar si es un evento de grupo
    if (!m.messageStubType || !m.isGroup) return true;

    // Obtener la configuración del chat
    const chat = globalThis.db.data.chats[m.chat];
    // Si la bienvenida está desactivada, no hacer nada
    if (!chat.welcome) return true;

    const userJid = m.messageStubParameters[0];
    const name = globalThis.db.data.users[userJid]?.name || await conn.getName(userJid);
    const ppUrl = await conn.profilePictureUrl(userJid, 'image').catch(() => null);

    // Calcular el número de miembro
    let memberCount = participants.length;
    let memberNumberText = '';
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        memberCount += 1;
        memberNumberText = `Eres el ${formatMemberNumber(memberCount)} miembro`;
    } else if ([WAMessageStubType.GROUP_PARTICIPANT_REMOVE, WAMessageStubType.GROUP_PARTICIPANT_LEAVE].includes(m.messageStubType)) {
        memberNumberText = `Era el ${formatMemberNumber(memberCount + 1)} miembro`;
    }

    // Crear el mensaje de bienvenida o despedida
    let messageText = '';
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
        messageText = `╔═══💫 *BIENVENIDO/A* 💫═══╗
┊👤 *Usuario:* @${userJid.split('@')[0]}
┊🆔 *ID:* ${userJid}
┊🔢 *Número:* ${memberNumberText}
┊🏠 *Grupo:* ${groupMetadata.subject}
┊🆔 *ID del Grupo:* ${m.chat}
╚═══════════════════════╝`;
    } else if ([WAMessageStubType.GROUP_PARTICIPANT_LEAVE, WAMessageStubType.GROUP_PARTICIPANT_REMOVE].includes(m.messageStubType)) {
        messageText = `╔═══👋 *DESPEGADA* 👋═══╗
┊👤 *Usuario:* @${userJid.split('@')[0]}
┊🆔 *ID:* ${userJid}
┊🔢 *Número:* ${memberNumberText}
┊🏠 *Grupo:* ${groupMetadata.subject}
┊🆔 *ID del Grupo:* ${m.chat}
╚═══════════════════════╝`;
    }

    if (!messageText) return true; // Si no es ni bienvenida ni despedida, salir.

    // Enviar el mensaje con imagen de la API
    try {
        const params = new URLSearchParams({
            username: name,
            guildName: groupMetadata.subject,
            memberCount: memberCount,
            avatar: ppUrl || "https://files.catbox.moe/s41dnk.jpg",
            background: "https://i.ibb.co/4YBNyvP/images-76.jpg",
            key: "rmF1oUJI529jzux8"
        });
        const response = await fetch(`https://api-nv.ultraplus.click/api/generate/welcome2?${params.toString()}`);
        if (!response.ok) throw new Error();
        const imageBuffer = await response.buffer();

        await conn.sendMessage(m.chat, {
            image: imageBuffer,
            caption: messageText,
            mentions: [userJid]
        }, { quoted: m });

    } catch (error) {
        // Si la API falla, enviar solo el texto
        await conn.sendMessage(m.chat, {
            text: messageText,
            mentions: [userJid]
        }, { quoted: m });
    }

    return true;
}