import { openDB, deleteDB } from 'idb';  // https://github.com/jakearchibald/idb

class DataLocal {

	constructor() {		
		this.DATABASE_NAME = 'savelinksforlater';  // 'savelinksforlater - [user@email.com] - [unique guid]';
		this.DATABASE_VERSION = 2;
		this._db = undefined;
		this.ERROR = {
			INDEXEDDB_NOT_SUPPORTED: "IndexedDB is not supported by client",
			INDEXEDDB_NOT_INITIALIZED: "IndexedDB store was not intialized and cannot be used"
		};
	}

	async getHyperlinks() {
		this.throwErrorIfIndexedDBNotInitialized();
		const hyperlinksArray = await this._db.getAllFromIndex('hyperlinks', 'createdOn');
		return hyperlinksArray && this.convertArrayToObject(hyperlinksArray, 'id');
	}

	async addOrUpdateHyperlink(hyperlink) {
		this.throwErrorIfIndexedDBNotInitialized();
		await this._db.put('hyperlinks', hyperlink);
	}

	async deleteHyperlink(id) {
		this.throwErrorIfIndexedDBNotInitialized();
		await this._db.delete('hyperlinks', id);
	}

	async deleteIndexedDb() {
		this.throwErrorIfIndexedDBNotInitialized();		
		await deleteDB(this.DATABASE_NAME, {
			blocked() {
				// ...
			},
		});
	}

	throwErrorIfIndexedDBNotInitialized() {
		if(!this._db) {
			throw new Error(this.ERROR.INDEXEDDB_NOT_INITIALIZED);
		}
	}

	async initDb() {
		if(this._db) {
			return;  // IndexedDB was already initialized once before
		}
		const isIDBSupported = ('indexedDB' in window);
		if(!isIDBSupported) {
			throw new Error(this.ERROR.INDEXEDDB_NOT_SUPPORTED);
		}
		
		// open IndexedDB store and create/upgrade the local database store if needed
		const db = await openDB(this.DATABASE_NAME, this.DATABASE_VERSION, {
			upgrade(upgradeDb, oldVersion, newVersion, transaction) {
				if(oldVersion <= 1) {
					// init version 1 of hyperlinks store
					const store = upgradeDb.createObjectStore('hyperlinks', {
						keyPath: 'id',
						autoIncrement: false,  // false to use value of 'id' parameter
					});
					store.createIndex('createdOn', 'createdOn');
				}
				if(oldVersion <= 2) {
					// example of how to add next version upgrade when old version is 2 (ie: DATABASE_VERSION = 3)
				}
			},
			blocked() {
				// ...
			},
			blocking() {
				// ...
			},
			terminated() {
				// ...
			},
		});

		this._db = db;
	}

	// turn array of objects in to key-value object
	convertArrayToObject(array, keyName) {
		let objects = {};
		for(var i = 0; i < array.length; i++) {
			const object = Object.assign({}, array[i]);  // make copy of object
			objects[object[keyName]] = object;
		}
		return objects;
	}
}

export default new DataLocal();