const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const puppeteer = require('puppeteer-core');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/app/.apt/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});



client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('¡El bot está autenticado!');
});

client.on('message', async message => {
    const comando = message.body.split(' ')[0].toLowerCase(); // Comando en minúsculas
    const chat = await message.getChat();
    const args = message.body.split(' ').slice(1);
    const author = message.author || message.from;
    let isAdmin = false;
    const participants = chat.participants || [];

    // Verificar si el autor es un administrador
    if (participants.length > 0) {
        isAdmin = participants.some(p => p.id._serialized === author && p.isAdmin);
    }
    
    if(!isAdmin){
        if (message.body.includes('http')) {
            await message.delete(true);
            return chat.sendMessage(`🚫 @${author.replace('@c.us', '')}, no se permiten enlaces en este grupo.`, { mentions: [author] });
        }
    }

    // Comando .open para abrir el grupo
    if (comando === '.open') {
        if (chat.isGroup) {
            try {
                await chat.setMessagesAdminsOnly(false); // Hacer que todos puedan enviar mensajes
                message.reply('El grupo ha sido abierto.');
            } catch (error) {
                console.error('Error al abrir el grupo:', error);
                message.reply('Hubo un error al abrir el grupo.');
            }
        } else {
            message.reply('Este comando solo funciona en grupos.');
        }
    } 
    
    // Comando .close para cerrar el grupo
    else if (comando === '.close') {
        if (chat.isGroup) {
            try {
                await chat.setMessagesAdminsOnly(true); // Restringir los mensajes solo a administradores
                message.reply('El grupo ha sido cerrado.');
            } catch (error) {
                console.error('Error al cerrar el grupo:', error);
                message.reply('Hubo un error al cerrar el grupo.');
            }
        } else {
            message.reply('Este comando solo funciona en grupos.');
        }
    } 
    
    // Comando .quick para dar de baja a un usuario
    else if (comando === '.quick') {
        const usuario = args[0];
        if (!usuario) {
            message.reply('Debes especificar un usuario.');
            return;
        }
    
        try {
            const participants = chat.participants;  // Obtener los participantes del grupo
            
            const user = usuario.slice(1)
            
            const participant = participants.find(p => p.id.user === user);  // Buscar al usuario por su ID
            console.log(user);
            
            if (participant) {
                console.log(participant.id);
                
                await chat.removeParticipants([participant.id._serialized]);  // Eliminar al usuario
                message.reply(`Usuario ${usuario} dado de baja.`);
            } else {
                message.reply(`No se encontró al usuario ${user}.`);
            }
        } catch (error) {
            console.error('Error al dar de baja al usuario:', error);
            message.reply('Hubo un error al dar de baja al usuario.');
        }
    }
    
    else if (comando === '.notify') {
        const mensaje = args.join(' ');
        if (!mensaje) {
            message.reply('Debes especificar un mensaje.');
            return;
        }
    
        try {
    
            if (chat.isGroup) {
                // Obtener los participantes del grupo
                const participants = chat.participants;
    
                // Construir el mensaje con las menciones
                let mentionedMessage = mensaje + '\n\n';
                let mentions = []; // Para almacenar los objetos de menciones
    
                participants.forEach(participant => {
                    const participantId = participant.id._serialized; // ID serializado del participante
                    mentionedMessage += `@${participant.id.user} `; // Añadir la mención al mensaje
                    mentions.push(participant.id); // Añadir el objeto de mención
                });
    
                console.log('Mensaje:', mentionedMessage);
                console.log('Menciones:', mentions);
    
                // Enviar el mensaje con las menciones usando el ID serializado del chat
                await client.sendMessage(chat.id._serialized, mentionedMessage, {
                    mentions: mentions.map(p => p._serialized) // Usar los _serialized para las menciones
                });
    
                // message.reply('Mensaje notificado a todos los usuarios.');
            } else {
                message.reply('Este comando solo se puede usar en grupos.');
            }
        } catch (error) {
            console.error('Error al notificar a los usuarios:', error);
            message.reply('Hubo un error al notificar a los usuarios.');
        }
    }
    
    
    
    
    
    
    // Comando .ping
    else if (comando === '.ping') {
        message.reply('Pong!');
    }
});

client.initialize();
