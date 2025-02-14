const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer-core');
const PCR = require('puppeteer-chromium-resolver'); // Importa correctamente el módulo

async function iniciarBot() {
    // Resolver la ruta del ejecutable de Chromium
    const stats = await PCR(); // Llamar a la función principal
    const browserPath = stats.executablePath; // Obtener la ruta

    if (!browserPath) {
        console.error('No se pudo encontrar un ejecutable de Chromium.');
        return;
    }

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: '/opt/homebrew/bin/chromium', // Cambia esto según la ruta que encontraste
        }
    });

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', () => {
        console.log('¡El bot está autenticado!');
    });

    client.on('message', async message => {
        const comando = message.body.split(' ')[0].toLowerCase();
        const chat = await message.getChat();
        const args = message.body.split(' ').slice(1);
        const author = message.author || message.from;
        let isAdmin = false;
        const participants = chat.participants || [];

        if (participants.length > 0) {
            isAdmin = participants.some(p => p.id._serialized === author && p.isAdmin);
        }

        if (!isAdmin) {
            if (message.body.includes('http')) {
                await message.delete(true);
                return chat.sendMessage(`🚫 @${author.replace('@c.us', '')}, no se permiten enlaces en este grupo.`, { mentions: [author] });
            }
        }

        if (comando === '.open') {
            if (chat.isGroup) {
                try {
                    await chat.setMessagesAdminsOnly(false);
                    message.reply('El grupo ha sido abierto.');
                } catch (error) {
                    console.error('Error al abrir el grupo:', error);
                    message.reply('Hubo un error al abrir el grupo.');
                }
            } else {
                message.reply('Este comando solo funciona en grupos.');
            }
        } 
        
        else if (comando === '.close') {
            if (chat.isGroup) {
                try {
                    await chat.setMessagesAdminsOnly(true);
                    message.reply('El grupo ha sido cerrado.');
                } catch (error) {
                    console.error('Error al cerrar el grupo:', error);
                    message.reply('Hubo un error al cerrar el grupo.');
                }
            } else {
                message.reply('Este comando solo funciona en grupos.');
            }
        } 
        
        else if (comando === '.ping') {
            message.reply('Pong!');
        }
    });

    client.initialize();
}

// Llamar a la función asíncrona para iniciar el bot
iniciarBot().catch(console.error);
