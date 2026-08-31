import crypto from 'crypto';

const HASH_ALGORITHM = 'scrypt';
const SCRYPT_KEY_LENGTH = 64;

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function generarHashPassword(password) {
  const passwordTexto = String(password || '');
  if (!passwordTexto) {
    throw new Error('La password no puede estar vacia.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scryptAsync(passwordTexto, salt);

  return `${HASH_ALGORITHM}$${salt}$${hash.toString('hex')}`;
}

export async function verificarPassword(password, passwordHash) {
  const passwordTexto = String(password || '');
  const hashTexto = String(passwordHash || '');

  if (!passwordTexto || !hashTexto) {
    return false;
  }

  const [algorithm, salt, hash] = hashTexto.split('$');
  if (algorithm !== HASH_ALGORITHM || !salt || !hash) {
    return false;
  }

  const hashCalculado = await scryptAsync(passwordTexto, salt);
  const hashOriginal = Buffer.from(hash, 'hex');

  if (hashOriginal.length !== hashCalculado.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashOriginal, hashCalculado);
}
