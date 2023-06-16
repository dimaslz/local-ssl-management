import os from 'os';

const n = os.networkInterfaces();

export default function () {
  for (const k in n) {
    const inter: any = n[k]
    for (const j in inter)
      if (inter[j].family === 'IPv4' && !inter[j].internal)
        return inter[j].address
  }
}