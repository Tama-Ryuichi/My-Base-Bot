console.clear();
require('../Control/Ctrl')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, getAggregateVotesInPollMessage } = require("@whiskeysockets/baileys");
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const FileType = require('file-type')
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber')
const path = require('path')
const NodeCache = require("node-cache")
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('../System/Data1.js')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('../System/Data2.js')
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const usePairingCode = global.connect // true pairing // false qr
const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});
return new Promise((resolve) => {
rl.question(text, resolve)
})
};
//===================
async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState("./session")
const { version, isLatest } = await fetchLatestBaileysVersion();
const resolveMsgBuffer = new NodeCache()
const TamaRYC = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: !usePairingCode,
        markOnlineOnConnect: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });
if(usePairingCode && !TamaRYC.authState.creds.registered) {
        console.log(`Please Input Your Number Bot:`);
		const phoneNumber = await question(``);		
		const code = await TamaRYC.requestPairingCode(phoneNumber.trim())
		console.log(`This Your Pairing Code :`);
		console.log(`${code}`)
}
store.bind(TamaRYC.ev)
//===================
TamaRYC.ev.on('call', async (caller) => {
console.log("Invite to Call")
})
TamaRYC.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

TamaRYC.ev.on('messages.upsert', async chatUpdate => {
try {
mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!TamaRYC.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
m = smsg(TamaRYC, mek, store)
require("../Console/TamaC")(TamaRYC, m, chatUpdate, store)
} catch (err) {
console.log(err)
}
})
    
TamaRYC.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
size: await getSizeMedia(data),
...type,
data
}}
TamaRYC.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
return buffer} 
TamaRYC.sendText = (jid, text, quoted = '', options) => TamaRYC.sendMessage(jid, { text: text, ...options }, { quoted })
TamaRYC.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)}
await TamaRYC.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer}
TamaRYC.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)}
await TamaRYC.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer}
TamaRYC.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
// save to file
await fs.writeFileSync(trueFileName, buffer)
return trueFileName}
// Self Public
TamaRYC.public = global.publicX
// Connect
TamaRYC.serializeM = (m) => smsg(TamaRYC, m, store)
TamaRYC.ev.on('connection.update', (update) => {
const {connection,lastDisconnect} = update
if (connection === 'close') {lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut ? connectToWhatsApp() : ''}
else if(connection === 'open') { console.log('Success Reconected')}
console.log(update)})
TamaRYC.ev.on('creds.update', saveCreds)
}
connectToWhatsApp()