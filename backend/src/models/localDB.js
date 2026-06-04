import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

class LocalModel {
  constructor(modelName) {
    this.modelName = modelName;
    this.filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  _read() {
    try {
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // Mimics Mongoose query methods
  find(query = {}) {
    let items = this._read();
    
    // Simple filter matching
    if (Object.keys(query).length > 0) {
      items = items.filter(item => {
        return Object.entries(query).every(([key, val]) => {
          if (val === null) return item[key] === null || item[key] === undefined;
          if (typeof val === 'object' && val !== null && '$or' in val) {
             // Handle simple $or query (e.g. $or: [{email}, {username}])
             return val.$or.some(q => {
               return Object.entries(q).every(([qk, qv]) => item[qk] === qv);
             });
          }
          if (typeof val === 'object' && val !== null && '$or' === key) {
            return val.some(q => {
               return Object.entries(q).every(([qk, qv]) => item[qk] === qv);
            });
          }
          if (item[key] && typeof item[key] === 'object' && val && typeof val === 'object') {
            return item[key].toString() === val.toString();
          }
          return String(item[key]) === String(val);
        });
      });
    }

    return new QueryChain(items, this.modelName);
  }

  async findOne(query = {}) {
    const items = this.find(query).data;
    return items.length > 0 ? await this.findById(items[0]._id) : null;
  }

  async findById(id) {
    const items = this._read();
    const item = items.find(i => String(i._id) === String(id));
    if (item) {
      // Add fake Mongoose helper functions on retrieved item
      item.save = async function() {
        const model = new LocalModel(this._modelName);
        const data = model._read();
        const index = data.findIndex(d => String(d._id) === String(this._id));
        if (index !== -1) {
          data[index] = { ...this };
          delete data[index].save;
          delete data[index]._modelName;
          model._write(data);
        }
        return this;
      };
      item.matchPassword = async function(enteredPassword) {
        // Simple plain check for mock or bcrypt if matchPassword is used
        return await bcrypt.compare(enteredPassword, this.password);
      };
      item._modelName = this.modelName;
    }
    return item;
  }

  async create(data) {
    const items = this._read();
    
    // Hash password if this is User model
    if (this.modelName === 'User' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    const newItem = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      ...data
    };

    items.push(newItem);
    this._write(items);

    // Return item with save method
    return await this.findById(newItem._id);
  }

  async insertMany(itemsArray) {
    const items = this._read();
    const inserted = [];
    
    for (const data of itemsArray) {
      const newItem = {
        _id: generateId(),
        createdAt: new Date().toISOString(),
        ...data
      };
      items.push(newItem);
      inserted.push(newItem);
    }
    
    this._write(items);
    return inserted;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this._read();
    const index = items.findIndex(i => String(i._id) === String(id));
    if (index === -1) return null;

    // Apply update
    items[index] = {
      ...items[index],
      ...update
    };

    this._write(items);
    return items[index];
  }

  async deleteOne(query = {}) {
    const items = this._read();
    const index = items.findIndex(item => {
      return Object.entries(query).every(([key, val]) => String(item[key]) === String(val));
    });

    if (index !== -1) {
      items.splice(index, 1);
      this._write(items);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query = {}) {
    let items = this._read();
    const initialCount = items.length;

    items = items.filter(item => {
      return !Object.entries(query).every(([key, val]) => String(item[key]) === String(val));
    });

    this._write(items);
    return { deletedCount: initialCount - items.length };
  }

  async updateMany(query = {}, update = {}) {
    const items = this._read();
    let updatedCount = 0;

    const newItems = items.map(item => {
      const matches = Object.entries(query).every(([key, val]) => String(item[key]) === String(val));
      if (matches) {
        updatedCount++;
        return { ...item, ...update };
      }
      return item;
    });

    this._write(newItems);
    return { matchedCount: updatedCount, modifiedCount: updatedCount };
  }
}

class QueryChain {
  constructor(data, modelName) {
    this.data = data;
    this.modelName = modelName;
  }

  populate(path, select) {
    if (path === 'userId') {
      const userModel = new LocalModel('User');
      const users = userModel._read();

      this.data = this.data.map(item => {
        const userIdStr = item.userId ? item.userId.toString() : '';
        const user = users.find(u => String(u._id) === userIdStr);
        if (user) {
          const userCopy = { ...user };
          delete userCopy.password;
          return {
            ...item,
            userId: userCopy
          };
        }
        return item;
      });
    }
    return this;
  }

  sort(criteria = {}) {
    // Sort descending by default for createdAt
    if (criteria.createdAt === -1) {
      this.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return this;
  }

  select(fields) {
    if (fields === '+password') {
      // In local mode, password is saved inside JSON file, already present.
    } else if (fields === '-password') {
      this.data = this.data.map(item => {
        const copy = { ...item };
        delete copy.password;
        return copy;
      });
    }
    return this;
  }

  // Make the chain thenable so that "await Model.find()" resolves properly
  then(resolve, reject) {
    return Promise.resolve(this.data).then(resolve, reject);
  }
}

export {
  LocalModel
};
