import BaseConnector from './base-connector.js';

class LeadPerfectionConnector extends BaseConnector {
  constructor() {
    super('LeadPerfection');
  }

  // Future implementation:
  // - Lead ingestion
  // - Status updates
  // - Notes or tagging
  //
  // Extend the methods from BaseConnector when ready:
  //   async getContact(contactId) { ... }
  //   async updateContact(contactId, data) { ... }
  //   async sendMessage(contactId, message) { ... }
  //   async addNote(contactId, note) { ... }
}

export default new LeadPerfectionConnector();
