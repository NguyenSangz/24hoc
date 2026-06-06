import CryptoJS from 'crypto-js';

const SECRET_KEY = '24hoc-secret-key-for-local-storage';

export const CryptoService = {
  encrypt: (data: any): string => {
    const json = JSON.stringify(data);
    const XOR_KEY = 42;
    const deforsed = json.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY)).join('');
    return CryptoJS.AES.encrypt(deforsed, SECRET_KEY).toString();
  },

  decrypt: (ciphertext: string): any => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const deforsed = bytes.toString(CryptoJS.enc.Utf8);
      if (!deforsed) return null;
      const XOR_KEY = 42;
      const json = deforsed.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY)).join('');
      return JSON.parse(json);
    } catch (e) {
      console.error("Decryption failed", e);
      return null;
    }
  },

  // Simple obfuscation for non-sensitive but "hidden" data
  obfuscate: (str: string): string => {
    return btoa(str.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ (SECRET_KEY.charCodeAt(i % SECRET_KEY.length)))
    ).join(''));
  },

  deobfuscate: (encoded: string): string => {
    try {
      const str = atob(encoded);
      return str.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ (SECRET_KEY.charCodeAt(i % SECRET_KEY.length)))
      ).join('');
    } catch (e) {
      return '';
    }
  }
};
