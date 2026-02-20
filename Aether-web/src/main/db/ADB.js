const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const os = require("os");
const NODE_ENV = process.env.NODE_ENV

const userDir = os.homedir();
console.log(userDir);
const dbFolder = userDir + (NODE_ENV === 'development' ? '/.aether-dev/' : '/.aether/');
console.log(dbFolder);
if(!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

const db = sqlite3.Database(dbFolder + 'aether.db');

const createTable = ()=>{
    
}