export const IOS_CLIENT_ID = 'q6KqjlQINmjOC86rqt9JdU_i41nhD_Z4DwygpBxGiIs';
export const IOS_USER_AGENT = 'Basic-Fit/2436 CFNetwork/1568.300.101 Darwin/24.2.0';
export const GRAPHQL_ACCESS_TOKEN = 'wRd4zwNule_XU0IrbE-DSfF0IcFxSnDCilyboUhYLps';

export const BASE_ANDROID_URL = 'https://bfa.basic-fit.com/api';
export const BASE_URL = 'https://my.basic-fit.com';
export const BASE_LOGIN_URL = 'https://login.basic-fit.com';
export const BASE_AUTH_URL = 'https://auth.basic-fit.com';
export const BASE_GRAPHQL_URL = 'https://graphql.contentful.com/content/v1/spaces/ztnn01luatek/environments/master';

export function generateOfflineGUID(size = 3) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

export function hash(cardNbr, guid, time, deviceId) {
  const input = `${cardNbr}${guid}${time}${deviceId}`;
  const data = new TextEncoder().encode(input);
  const digest = crypto.subtle.digest('SHA-256', data);
  return digest.then(buffer => {
    const hex = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(-8).toUpperCase();
  });
}

export async function generateQrcodeData(cardNumber, deviceId) {
  const guid = generateOfflineGUID();
  const time = Math.floor(Date.now() / 1000);
  const hashValue = await hash(cardNumber, guid, time, deviceId);
  return `GM2:${cardNumber}:${guid}:${time}:${hashValue}`;
}

export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  return crypto.subtle.digest('SHA-256', data).then(buffer => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return base64;
  });
}

export function buildOauthURL(state, codeChallenge) {
  return `${BASE_LOGIN_URL}/?state=${state}` +
    `&response_type=code` +
    `&code_challenge_method=S256` +
    `&app=true` +
    `&code_challenge=${codeChallenge}` +
    `&redirect_uri=com.basicfit.bfa:/oauthredirect` +
    `&client_id=${IOS_CLIENT_ID}` +
    `&auto_login=true`;
}

export async function code2token(code, codeVerifier) {
  const payload = `code=${code}&code_verifier=${codeVerifier}&redirect_uri=com.basicfit.bfa:/oauthredirect&client_id=${IOS_CLIENT_ID}&grant_type=authorization_code`;
  const res = await fetch(`${BASE_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: payload
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function refresh2token(accessToken, refreshToken) {
  const payload = `access_token=${accessToken}&refresh_token=${refreshToken}&redirect_uri=com.basicfit.bfa:/oauthredirect&client_id=${IOS_CLIENT_ID}&grant_type=refresh_token`;
  const res = await fetch(`${BASE_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: payload
  });
  if (!res.ok) return null;
  return await res.json();
}

export class BasicFit {
  constructor(bearerToken) {
    this.bearerToken = bearerToken;
  }
  async loadMember() {
    const res = await fetch(`${BASE_ANDROID_URL}/member/info`, {
      headers: {
        'User-Agent': IOS_USER_AGENT,
        'Authorization': `Bearer ${this.bearerToken}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.member;
  }
}
