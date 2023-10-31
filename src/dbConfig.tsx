import Dexie from 'dexie';

interface Home {
  uuid: string;
  url: string;
  image: string;
  title: string;
  location: string;
  m2: number;
  price: number;
  comment: string;
  city: string;
  province: string;
  source: string;
  created_at: string;
  updated_at: string;
}

class Database extends Dexie {
  homes!: Dexie.Table<Home>;
  
  constructor() {  
    super("Hoomes");
    
    this.version(1).stores({
      homes: 'uuid, url, image, title, location, m2, price, comment, city, province, source, created_at, updated_at',
    });
  }
}

const db = new Database();

export type { Home }
export { db }