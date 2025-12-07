import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    //Fixieada por ZzawX
    
    let tempStickerPath;
    
    try {
        await m.react('🕒');

        if (!text) {
            await m.react('❔');
            return conn.reply(m.chat, 
                '> `❌ TEXTO FALTANTE`\n\n' +
                '> `📝 Debes escribir texto después del comando`\n\n' +
                '> `💡 Ejemplo:` *' + usedPrefix + command + ' texto aquí*', 
                m
            );
        }

        const tempDir = './temp';
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        tempStickerPath = path.join(tempDir, `brat2_sticker_${Date.now()}.webp`);

        const primaryApiUrl = `https://apizell.web.id/tools/bratanimate?q=${encodeURIComponent(text)}`;
        
        const fallbackApiUrl = `https://api.siputzx.my.id/api/m/bratvideo?text=${encodeURIComponent(text)}`;

        let videoData;
        let apiUsed = "ZellAPI";

        try {
            const apiResponse = await axios({
                method: 'GET',
                url: primaryApiUrl,
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'video/*,image/*,*/*'
                }
            });

            videoData = Buffer.from(apiResponse.data);

            if (!videoData || videoData.length < 100) {
                throw new Error('Video descargado es inválido o muy pequeño');
            }

            const isWebP = videoData.slice(0, 4).toString() === 'RIFF' && videoData.slice(8, 12).toString() === 'WEBP';
            
            if (isWebP) {
                fs.writeFileSync(tempStickerPath, videoData);
            } else {
                const ffmpegCommand = `ffmpeg -i pipe:0 -vcodec libwebp -filter:v fps=fps=15 -lossless 0 -compression_level 3 -qscale 70 -loop 0 -preset ultrafast -an -vsync 0 -s 512:512 "${tempStickerPath}" -y`;
                await execAsync(`echo "${videoData.toString('base64')}" | base64 -d | ${ffmpegCommand}`, { 
                    timeout: 15000,
                    shell: '/bin/bash'
                });
            }

        } catch (primaryError) {
            try {
                const fallbackResponse = await axios({
                    method: 'GET',
                    url: fallbackApiUrl,
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    maxRedirects: 5,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'video/*,image/*,*/*'
                    }
                });

                const fallbackBuffer = Buffer.from(fallbackResponse.data);
                
                if (!fallbackBuffer || fallbackBuffer.length < 100) {
                    throw new Error('Video de API secundaria inválido');
                }

                const isFallbackWebP = fallbackBuffer.slice(0, 4).toString() === 'RIFF' && fallbackBuffer.slice(8, 12).toString() === 'WEBP';
                
                if (isFallbackWebP) {
                    fs.writeFileSync(tempStickerPath, fallbackBuffer);
                } else {
                    const ffmpegCommand = `ffmpeg -i pipe:0 -vcodec libwebp -filter:v fps=fps=15 -lossless 0 -compression_level 3 -qscale 70 -loop 0 -preset ultrafast -an -vsync 0 -s 512:512 "${tempStickerPath}" -y`;
                    await execAsync(`echo "${fallbackBuffer.toString('base64')}" | base64 -d | ${ffmpegCommand}`, { 
                        timeout: 15000,
                        shell: '/bin/bash'
                    });
                }

                apiUsed = "API Secundaria";

            } catch (fallbackError) {
                throw new Error(`Ambas APIs fallaron`);
            }
        }

        if (!fs.existsSync(tempStickerPath)) {
            throw new Error('No se pudo crear el sticker animado');
        }

        await m.react('✅️');

        const username = m.pushName || m.sender.split('@')[0] || "Usuario";
        
        const stickerBuffer = fs.readFileSync(tempStickerPath);
        
        const stickerMetadata = {
            pack: `𝐈𝐭𝐬𝐮𝐤𝐢𝐁𝐨𝐭-𝐌𝐃`,
            author: `𝗦𝗼𝗹𝗶𝗰𝗶𝘁𝗮𝗱𝗼 𝗽𝗼𝗿: ${username}\n𝗖𝗿𝗲𝗮𝗱𝗼𝗿: 𝗟𝗲𝗼𝗗𝗲𝘃`,
            categories: ['🤣', '🎉'],
            type: StickerTypes.FULL,
            quality: 70
        };

        const sticker = new Sticker(stickerBuffer, stickerMetadata);
        const stickerWebp = await sticker.toMessage();

        await conn.sendMessage(m.chat, stickerWebp, { quoted: m });

        setTimeout(() => {
            try {
                if (tempStickerPath && fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath);
            } catch (e) {}
        }, 10000);

    } catch (error) {
        console.error('Error en comando brat2:', error);
        
        try {
            if (tempStickerPath && fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath);
        } catch (cleanError) {}
        
        await m.react('❌');
        
        let errorMessage = '> `❌ ERROR ENCONTRADO`\n\n';
        
        if (error.message.includes('Ambas APIs fallaron')) {
            errorMessage += '> `📝 Todos los servicios están temporalmente no disponibles. Intenta más tarde.`';
        } else if (error.message.includes('insuficientes') || error.message.includes('vacío')) {
            errorMessage += '> `📝 El servicio devolvió un archivo vacío o corrupto.`';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage += '> `⏰ Tiempo de espera agotado. Intenta de nuevo.`';
        } else if (error.response) {
            errorMessage += '> `📝 Error en la API: ' + error.response.status + '`';
        } else if (error.request) {
            errorMessage += '> `📝 No se pudo conectar con el servicio.`';
        } else if (error.message.includes('ffmpeg')) {
            errorMessage += '> `📝 Error al procesar el video.`';
        } else {
            errorMessage += '> `📝 ' + error.message + '`';
        }

        await conn.reply(m.chat, errorMessage, m);
    }
};

handler.help = ['brat2'];
handler.tags = ['sticker'];
handler.command = ['brat2'];
handler.group = true;

export default handler;