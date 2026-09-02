// Shim for mongoose - provides types without runtime dependency
export namespace Types {
  export class ObjectId {
    private _id: string;

    constructor(id?: string) {
      this._id = id ?? ObjectId.generate();
    }

    static generate(): string {
      return Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    }

    toString() {
      return this._id;
    }

    toJSON() {
      return this.toString();
    }
  }
}

export const mongo = {
  MongoClient: class MongoClient {
    constructor() {
      throw new Error("MongoClient is not available in this environment");
    }
  },
};

export const connection = {
  readyState: 0,
  setClient: () => {},
  close: async () => {},
};

export default { Types, mongo, connection };
