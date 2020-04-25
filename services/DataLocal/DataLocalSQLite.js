import * as SQLite from 'expo-sqlite';  // https://docs.expo.io/versions/latest/sdk/sqlite/

class DataLocalSQLite {

	constructor() {		
		this.DATABASE_NAME = 'savelinksforlater';  // 'savelinksforlater - [user@email.com] - [unique guid]';
		// this.DATABASE_VERSION = 2;
		this._db = undefined;
		this.ERROR = {
			SQLITEDB_NOT_SUPPORTED: "SQLite is not supported by client",
			SQLITEDB_NOT_INITIALIZED: "SQLite database was not intialized and cannot be used"
		};
	}

	async getHyperlinks() {
		this.throwErrorIfSQLiteDBNotInitialized();
		const hyperlinksArray = await this.getHyperlinksSQLite();
		return hyperlinksArray && this.convertArrayToObjectAndConvertBool(hyperlinksArray, 'id');
	}

	async addOrUpdateHyperlink(hyperlink) {
		this.throwErrorIfSQLiteDBNotInitialized();
		await this.addOrUpdateHyperlinkSQLite(hyperlink);
	}

	async deleteHyperlink(id) {
		this.throwErrorIfSQLiteDBNotInitialized();
		await this.deleteHyperlinkSQLite(id);
	}

	async deleteDb() {
		this.throwErrorIfSQLiteDBNotInitialized();
		await this.deleteHyperlinksTableSQLite();
	}

	async initDb() {
		if(this._db) {
			return;  // SQLite was already initialized once before
		}
		const isSQLiteSupported = true;
		if(!isSQLiteSupported) {
			throw new Error(this.ERROR.SQLITEDB_NOT_SUPPORTED);
		}
		
		// open SQLite database and create the local database if needed		
		const db = SQLite.openDatabase('db.'+this.DATABASE_NAME);
		
		this._db = db;
		
		// DATABASE TABLE UPDATES: For development it is ok to drop table then recreate. For production need to alter table: https://stackoverflow.com/a/53383988/285714
		// await this.deleteHyperlinksTableSQLite();
		
		await this.createHyperlinksTableIfNeededSQLite();
	}
	

	// PRIVATE METHODS

	getHyperlinksSQLite() {
		return new Promise((resolve, reject) => {
			this._db.transaction(tx => {
				tx.executeSql(
					`SELECT * FROM hyperlinks;`,
					[],
					(_, { rows: { _array } }) => {
						resolve(_array);
					},
					(_, {}) => {
						reject(new Error('Failed to execute Sql to select records from SQLite database'));
					}
				);
			});
		});
	}

	addOrUpdateHyperlinkSQLite(hyperlink) {
		return new Promise((resolve, reject) => {
			this._db.transaction(tx => {
				tx.executeSql(
					// INSERT or UPDATE using REPLACE: https://www.sqlite.org/lang_replace.html
					// NOTE: If using SQLite version 3.24.0+ then could use UPSERT instead: https://www.sqlite.org/draft/lang_UPSERT.html, https://stackoverflow.com/q/418898
					`REPLACE INTO hyperlinks (id, title, url, visited, createdOn, updatedOn, owner, dirty, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[hyperlink.id, hyperlink.title||'', hyperlink.url, (hyperlink.visited)?1:0, hyperlink.createdOn, hyperlink.updatedOn, hyperlink.owner||'', (hyperlink.dirty)?1:0, (hyperlink.deleted)?1:0],
					(_, {}) => {
						resolve();
					},
					(_, {}) => {
						reject(new Error('Failed to execute Sql to insert or update record in SQLite database'));
					}
				);
			});
		});
	}

	deleteHyperlinkSQLite(hyperlink) {
		return new Promise((resolve, reject) => {
			this._db.transaction(tx => {
				tx.executeSql(
					`DELETE FROM hyperlinks WHERE id = ?`,
					[hyperlink.id],
					(_, {}) => {
						resolve();
					},
					(_, {}) => {
						reject(new Error('Failed to execute Sql to delete record in SQLite database '));
					}
				);
			});
		});
	}

	deleteHyperlinksTableSQLite() {
		return new Promise((resolve, reject) => {
			this._db.transaction(tx => {
				tx.executeSql(
					'DROP TABLE IF EXISTS hyperlinks;',
					[],
					(_, {}) => {
						resolve();
					},
					(_, {}) => {
						reject(new Error('Failed to execute Sql to drop "hyperlinks" table in SQLite database '));
					}
				);
			});
		});
	}

	throwErrorIfSQLiteDBNotInitialized() {
		if(!this._db) {
			throw new Error(this.ERROR.SQLITEDB_NOT_INITIALIZED);
		}
	}

	createHyperlinksTableIfNeededSQLite() {
		return new Promise((resolve, reject) => {
			this._db.transaction(tx => {
				tx.executeSql(
					'CREATE TABLE IF NOT EXISTS hyperlinks (id text primary key not null, title text, url text, visited int, createdOn text, updatedOn text, owner text, dirty int, deleted int);',
					[],
					(_, {}) => {
						resolve();
					},
					(_, {}) => {
						reject(new Error('Failed to execute Sql to create "hyperlinks" table in SQLite database '));
					}
				);
			});
		});
	}

	// turn array of objects in to key-value object
	convertArrayToObjectAndConvertBool(array, keyName, boolNames = []) {
		let objects = {};
		for(var i = 0; i < array.length; i++) {
			const object = Object.assign({}, array[i]);  // make copy of object
			objects[object[keyName]] = object;
			this.convertBoolFromIntInObject(object, boolNames);
		}
		return objects;
	}

	// SQLite does not have a bool datatype so, this convert from int (0 or 1) to bool
	convertBoolFromIntInObject(object, boolNames) {
		var i;
		for(i = 0; i < boolNames; i++) {
			if(object.hasOwnProperty(boolNames[i]) && typeof object[boolNames[i]] === 'number')
				object[boolNames[i]] = (object[boolNames[i]])?true:false;
		}
	}
}

export default new DataLocalSQLite();