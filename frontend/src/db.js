import Dexie from 'dexie';

const db = new Dexie('LeaveNameDB');
db.version(1).stores({
    encryptedCheckIn: '++id, time, clientVersion, shopPubKey',
    standaloneCheckIn: '++id, time, clientVersion',
    shop: '++id, name, &shopPubKey, serverPubKey',
});

export default db;

