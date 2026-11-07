import axios from 'axios';
import { config } from '../config.js';

const client = axios.create({
  baseURL: config.wasender.apiUrl,
  timeout: 12000,
  headers: {
    'Authorization': `Bearer ${config.wasender.apiKey}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Normalizes a recipient WhatsApp identifier for WASenderAPI
 */
export function normalizeRecipient(to) {
  if (!to) return '';
  return to.replace(/@s\.whatsapp\.net$/, '').replace(/[^0-9+]/g, '').trim();
}

/**
 * Send presence update (e.g. typing..., recording...)
 */
export async function sendPresence(to, status = 'composing', apiKey = null) {
  try {
    if (!to) return;
    const cleanTo = normalizeRecipient(to);
    const cleanJid = `${cleanTo.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined;
    await client.post('/send-presence-update', {
      jid: cleanJid,
      type: status
    }, { headers });
  } catch (error) {
    console.warn('[WASender presence note]:', error.response?.data?.message || error.message);
  }
}

/**
 * Send plain text message via WASenderAPI
 */
export async function sendTextMessage(to, text, apiKey = null) {
  try {
    if (!to || !text) throw new Error('Recipient and text are required');
    const cleanTo = normalizeRecipient(to);
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined;
    
    const response = await client.post('/send-message', {
      to: cleanTo,
      text: text.trim()
    }, { headers });

    console.log(`[WASender] Message successfully sent to ${cleanTo}:`, response.data?.message || 'Success');
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Failed to send text to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send image message with caption
 */
export async function sendImageMessage(to, imageUrl, caption = '', apiKey = null) {
  try {
    const cleanTo = normalizeRecipient(to);
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined;
    const response = await client.post('/send-message', {
      to: cleanTo,
      image: imageUrl,
      text: caption
    }, { headers });
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Failed to send image to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send document message (PDF catalog, brochure)
 */
export async function sendDocumentMessage(to, documentUrl, fileName, caption = '', apiKey = null) {
  try {
    const cleanTo = normalizeRecipient(to);
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined;
    const response = await client.post('/send-message', {
      to: cleanTo,
      document: documentUrl,
      fileName,
      text: caption
    }, { headers });
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Failed to send document to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Check if phone number is registered on WhatsApp
 */
export async function checkOnWhatsApp(phone, apiKey = null) {
  try {
    const cleanTo = normalizeRecipient(phone);
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined;
    const response = await client.get(`/on-whatsapp/${cleanTo}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Check number failed for ${phone}:`, error.response?.data || error.message);
    return null;
  }
}
