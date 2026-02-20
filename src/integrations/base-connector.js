class BaseConnector {
  constructor(name) {
    this.name = name;
  }

  async getContact(contactId) {
    throw new Error(`${this.name}: getContact not implemented`);
  }

  async updateContact(contactId, data) {
    throw new Error(`${this.name}: updateContact not implemented`);
  }

  async sendMessage(contactId, message) {
    throw new Error(`${this.name}: sendMessage not implemented`);
  }

  async addNote(contactId, note) {
    throw new Error(`${this.name}: addNote not implemented`);
  }
}

module.exports = BaseConnector;
