import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

let handler = async (m, { conn, text, args, usedPrefix, command }) => {
    //Fixieada por ZzawX
    
    let tempVideoPath;
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

        tempVideoPath = path.join(tempDir, `brat_video_${Date.now()}.mp4`);
        tempStickerPath = path.join(tempDir, `brat_sticker_${Date.now()}.webp`);

        const mayApiUrl = `https://mayapi.ooguy.com/bratvideo`;
        
        const fallbackApiUrl = `https://api.siputzx.my.id/api/m/bratvideo?text=${encodeURIComponent(text)}`;

        let videoData;
        let apiUsed = "MayAPI";

        try {
            const apiResponse = await axios({
                method: 'GET',
                url: mayApiUrl,
                params: {
                    apikey: 'may-051b5d3d',
                    text: text
                },
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, */*'
                }
            });

            if (!apiResponse.data || typeof apiResponse.data !== 'object') {
                throw new Error('Respuesta de API no es JSON válido');
            }

            if (!apiResponse.data.status) {
                throw new Error(`Error en API: ${apiResponse.data.message || 'Estado falso'}`);
            }

            let videoUrl;
            if (typeof apiResponse.data.result === 'string') {
                videoUrl = apiResponse.data.result;
            } else if (apiResponse.data.result && apiResponse.data.result.url) {
                videoUrl = apiResponse.data.result.url;
            } else if (apiResponse.data.url) {
                videoUrl = apiResponse.data.url;
            } else {
                throw new Error('No se encontró URL de video en la respuesta');
            }

            const videoResponse = await axios({
                method: 'GET',
                url: videoUrl,
                responseType: 'arraybuffer',
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': '*/*'
                }
            });

            videoData = Buffer.from(videoResponse.data);

            if (!videoData || videoData.length < 100) {
                throw new Error('Video descargado es inválido o muy pequeño');
            }

        } catch (primaryError) {
            try {
                const fallbackResponse = await axios({
                    method: 'GET',
                    url: fallbackApiUrl,
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    maxRedirects: 5,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'video/*,*/*'
                    }
                });

                videoData = Buffer.from(fallbackResponse.data);
                apiUsed = "API Secundaria";

                if (!videoData || videoData.length < 100) {
                    throw new Error('Video de API secundaria inválido');
                }

            } catch (fallbackError) {
                throw new Error(`Ambas APIs fallaron`);
            }
        }

        fs.writeFileSync(tempVideoPath, videoData);

        const fileBuffer = fs.readFileSync(tempVideoPath);
        const isWebP = fileBuffer.slice(0, 4).toString() === 'RIFF' && fileBuffer.slice(8, 12).toString() === 'WEBP';
        
        if (isWebP) {
            fs.writeFileSync(tempStickerPath, fileBuffer);
        } else {
            try {
                const ffmpegCommand = `ffmpeg -i "${tempVideoPath}" -vcodec libwebp -filter:v fps=fps=20 -lossless 0 -compression_level 3 -qscale 50 -loop 0 -preset default -an -vsync 0 -s 512:512 "${tempStickerPath}" -y`;
                await execAsync(ffmpegCommand, { timeout: 30000 });
            } catch (conversionError) {
                await conn.sendMessage(m.chat, {
                    video: videoData
                }, { quoted: m });
                
                setTimeout(() => {
                    try {
                        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
                    } catch (e) {}
                }, 30000);
                
                return;
            }
        }

        if (!fs.existsSync(tempStickerPath)) {
            throw new Error('No se pudo crear el sticker');
        }

        await m.react('✅️');

        const stickerBuffer = fs.readFileSync(tempStickerPath);
        await conn.sendMessage(m.chat, {
            sticker: stickerBuffer
        }, { quoted: m });

        setTimeout(() => {
            try {
                if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
                if (fs.existsSync(tempStickerPath)) fs.unlinkSync(tempStickerPath);
            } catch (e) {}
        }, 30000);

    } catch (error) {
        console.error('Error en comando brat:', error);
        
        try {
            if (tempVideoPath && fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
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

handler.help = ['brat'];
handler.tags = ['sticker'];
handler.command = ['brat'];
handler.group = true;

export default handler;