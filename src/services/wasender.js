import axios from 'axios';
import { config } from '../config.js';

const client = axios.create({
  baseURL: config.wasender.apiUrl,
  headers: {
    'Authorization': `Bearer ${config.wasender.apiKey}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Send presence update (e.g. typing..., recording...)
 */
export async function sendPresence(to, status = 'composing') {
  try {
    await client.post('/send-presence-update', {
      to,
      status
    });
  } catch (error) {
    console.error('Error sending presence update:', error.response?.data || error.message);
  }
}

/**
 * Send plain text message via WASenderAPI
 */
export async function sendTextMessage(to, text) {
  try {
    const response = await client.post('/send-message', {
      to,
      text
    });
    console.log(`[WASender] Message sent to ${to}:`, response.data?.message || 'Success');
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Failed to send text to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send image message with caption
 */
export async function sendImageMessage(to, imageUrl, caption = '') {
  try {
    const response = await client.post('/send-message', {
      to,
      image: imageUrl,
      text: caption
    });
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Failed to send image to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send document message (PDF catalog, brochure)
 */
export async function sendDocumentMessage(to, documentUrl, fileName, caption = '') {
  try {
    const response = await client.post('/send-message', {
      to,
      document: documentUrl,
      fileName,
      text: caption
    });
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Failed to send document to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Check if phone number is registered on WhatsApp
 */
export async function checkOnWhatsApp(phone) {
  try {
    const response = await client.get(`/on-whatsapp/${phone}`);
    return response.data;
  } catch (error) {
    console.error(`[WASender Error] Check number failed for ${phone}:`, error.response?.data || error.message);
    return null;
  }
}
