const BaseConnector = require('./base-connector');

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

module.exports = new LeadPerfectionConnector();
