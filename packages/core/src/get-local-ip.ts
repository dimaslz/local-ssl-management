import os from 'os';

const n = os.networkInterfaces();

const getLocalIP = () => {
  for (const k in n) {
    const inter: any = n[k];
    for (const j in inter) {
      if (inter[j].family === 'IPv4' && !inter[j].internal) {
        return inter[j].address;
      }
    }
  }
}

export default getLocalIP;
