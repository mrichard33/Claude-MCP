const BaseConnector = require('./base-connector');
const config = require('../config');
const logger = require('../config/logger');

class HighLevelConnector extends BaseConnector {
  constructor() {
    super('HighLevel');
    this.baseUrl = config.ghl.baseUrl;
    this.headers = {
      Authorization: `Bearer ${config.ghl.apiKey}`,
      'Content-Type': 'application/json',
      Version: config.ghl.apiVersion,
    };
  }

  async _request(method, path, body = null) {
    const url = `${this.baseUrl}${path}`;
    const options = { method, headers: this.headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    logger.debug(`HighLevel API ${method} ${path}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      logger.error(`HighLevel API error ${response.status}: ${text}`);
      const err = new Error(`HighLevel API error: ${response.status}`);
      err.statusCode = response.status;
      throw err;
    }

    return response.json();
  }

  async getContact(contactId) {
    return this._request('GET', `/contacts/${contactId}`);
  }

  async updateContact(contactId, data) {
    return this._request('PUT', `/contacts/${contactId}`, data);
  }

  async sendMessage(contactId, message) {
    return this._request('POST', '/conversations/messages', {
      type: 'Custom',
      contactId,
      message,
    });
  }

  async addNote(contactId, note) {
    return this._request('POST', `/contacts/${contactId}/notes`, {
      body: note,
    });
  }

  async getConversations(contactId) {
    return this._request('GET', `/conversations/search?contactId=${contactId}&locationId=${config.ghl.locationId}`);
  }
}

module.exports = new HighLevelConnector();
