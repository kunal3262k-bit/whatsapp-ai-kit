const { decideIncoming } = require('./dist/whatsapp.js');

const opts = { allowedCodes: ['91'], ignoreGroups: true };
const msg = (text) => ({ conversation: text });

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : `\n   got  ${JSON.stringify(got)}\n   want ${JSON.stringify(want)}`}`);
  if (!ok) failures++;
}

// 1. LID customer WITH senderPn → accepted, phone resolved from PN, replies to LID
check(
  'lid + senderPn accepted, PN resolved, reply to lid',
  decideIncoming(
    { type: 'notify', fromMe: false, remoteJid: '108057115779148@lid', senderPn: '919812345678@s.whatsapp.net', message: msg('hi') },
    opts
  ),
  { chatJid: '108057115779148@lid', phone: '919812345678', text: 'hi' }
);

// 2. LID customer WITHOUT senderPn → accepted (fallback), phone unknown
check(
  'lid without senderPn accepted, phone empty',
  decideIncoming(
    { type: 'notify', fromMe: false, remoteJid: '257796838801513@lid', message: msg('hello') },
    opts
  ),
  { chatJid: '257796838801513@lid', phone: '', text: 'hello' }
);

// 3. classic PN jid still works
check(
  'pn jid accepted',
  decideIncoming(
    { type: 'notify', fromMe: false, remoteJid: '919812345678@s.whatsapp.net', message: msg('hi') },
    opts
  ),
  { chatJid: '919812345678@s.whatsapp.net', phone: '919812345678', text: 'hi' }
);

// 4. country not allowed (US number via PN)
check(
  'non-allowed country skipped',
  decideIncoming(
    { type: 'notify', fromMe: false, remoteJid: '14155550100@s.whatsapp.net', message: msg('hi') },
    opts
  ),
  { chatJid: '14155550100@s.whatsapp.net', phone: '14155550100', text: 'hi', skip: 'country-not-allowed' }
);

// 5. fromMe skipped
check(
  'fromMe skipped',
  decideIncoming(
    { type: 'notify', fromMe: true, remoteJid: '108057115779148@lid', senderPn: '919812345678@s.whatsapp.net', message: msg('hi') },
    opts
  ),
  { chatJid: '108057115779148@lid', phone: '', text: 'hi', skip: 'from-me' }
);

// 6. group skipped
check(
  'group skipped',
  decideIncoming(
    { type: 'notify', fromMe: false, remoteJid: '120363314269286231@g.us', participantPn: '919812345678@s.whatsapp.net', message: msg('hi') },
    opts
  ),
  { chatJid: '120363314269286231@g.us', phone: '', text: 'hi', skip: 'group' }
);

// 7. non-notify (history sync) skipped
check(
  'append/history skipped',
  decideIncoming(
    { type: 'append', fromMe: false, remoteJid: '108057115779148@lid', message: msg('hi') },
    opts
  ),
  { chatJid: '108057115779148@lid', phone: '', text: 'hi', skip: 'not-live' }
);

// 8. empty text skipped
check(
  'empty text skipped',
  decideIncoming(
    { type: 'notify', fromMe: false, remoteJid: '108057115779148@lid', senderPn: '919812345678@s.whatsapp.net', message: { imageMessage: {} } },
    opts
  ),
  { chatJid: '108057115779148@lid', phone: '919812345678', text: '', skip: 'empty-text' }
);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
