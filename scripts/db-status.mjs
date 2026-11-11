import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || "educn_lms";
if (!uri) throw new Error("MONGODB_URI belum tersedia di .env.local");
const names=["users","guru","siswa","kelas","mapel","material","tasks","announcements","grades","attendance","schedules","reports","actions","auth_accounts"];
const client=new MongoClient(uri,{serverSelectionTimeoutMS:10000});
try{await client.connect();const db=client.db(dbName);const rows=[];for(const name of names)rows.push([name,await db.collection(name).countDocuments()]);console.table(Object.fromEntries(rows));}finally{await client.close();}
