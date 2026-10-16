const { randomBytes } = require("crypto");

const users = new Map();
const questions = new Map();

function createId() {
  return randomBytes(12).toString("hex");
}

function matches(document, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (key === "_id" && value && Array.isArray(value.$in)) {
      return value.$in.some((id) => String(id) === document._id);
    }
    return document[key] === value;
  });
}

function duplicateKeyError(field) {
  const error = new Error(`Duplicate value for ${field}`);
  error.code = 11000;
  error.keyPattern = { [field]: 1 };
  return error;
}

class User {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = data._id || createId();
    this.bookmark = data.bookmark || [];
    this.following = data.following || [];
    this.handles = data.handles || {};
    this.progress = data.progress instanceof Map
      ? data.progress
      : new Map(Object.entries(data.progress || {}));
  }

  async save() {
    for (const [id, user] of users) {
      if (id !== this._id && user.email === this.email) {
        throw duplicateKeyError("email");
      }
      if (id !== this._id && user.userhandle === this.userhandle) {
        throw duplicateKeyError("userhandle");
      }
    }
    users.set(this._id, this);
    return this;
  }

  toObject() {
    return {
      ...this,
      bookmark: [...this.bookmark],
      following: [...this.following],
      handles: { ...this.handles },
      progress: Object.fromEntries(this.progress),
    };
  }

  toJSON() {
    return this.toObject();
  }

  static async findById(id) {
    return users.get(String(id)) || null;
  }

  static async findOne(query = {}) {
    return [...users.values()].find((user) => matches(user, query)) || null;
  }

  static async find(query = {}) {
    return [...users.values()].filter((user) => matches(user, query));
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const user = await this.findOne(query);
    if (!user) {
      return null;
    }

    for (const [path, value] of Object.entries(update.$set || {})) {
      const [field, ...nestedPath] = path.split(".");
      let target = user[field];
      for (const segment of nestedPath.slice(0, -1)) {
        target[segment] ||= {};
        target = target[segment];
      }
      if (nestedPath.length) {
        target[nestedPath[nestedPath.length - 1]] = value;
      } else {
        user[field] = value;
      }
    }

    await user.save();
    return options.new ? user : null;
  }

  static clear() {
    users.clear();
  }
}

class Question {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = data._id || createId();
    this.topics = data.topics || [];
    this.difficulty = data.difficulty || "Medium";
  }

  async save() {
    for (const [id, question] of questions) {
      if (id !== this._id && question.link === this.link) {
        throw duplicateKeyError("link");
      }
    }
    questions.set(this._id, this);
    return this;
  }

  toObject() {
    return { ...this, topics: [...this.topics] };
  }

  toJSON() {
    return this.toObject();
  }

  static async findById(id) {
    return questions.get(String(id)) || null;
  }

  static async find(query = {}) {
    return [...questions.values()].filter((question) => matches(question, query));
  }

  static clear() {
    questions.clear();
  }
}

module.exports = { User, Question };
