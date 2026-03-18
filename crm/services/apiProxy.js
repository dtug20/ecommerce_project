const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:7001';

class ApiProxy {
  constructor(req) {
    this.token = req.kauth?.grant?.access_token?.token || null;
    this.client = axios.create({
      baseURL: BACKEND_URL,
      timeout: 10000,
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
  }

  async get(path, params = {}) {
    const res = await this.client.get(path, { params });
    return res.data;
  }

  async post(path, body = {}) {
    const res = await this.client.post(path, body);
    return res.data;
  }

  async patch(path, body = {}) {
    const res = await this.client.patch(path, body);
    return res.data;
  }

  async put(path, body = {}) {
    const res = await this.client.put(path, body);
    return res.data;
  }

  async delete(path) {
    const res = await this.client.delete(path);
    return res.data;
  }
}

module.exports = ApiProxy;
