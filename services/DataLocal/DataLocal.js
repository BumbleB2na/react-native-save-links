import DataLocalIndexedDb from './DataLocalIndexedDb';
import DataLocalSQLite from './DataLocalSQLite';
import { Platform } from 'react-native';

class DataLocal {

	constructor() {
		this.isMobileApp = (Platform.OS === 'ios' || Platform.OS === 'android');
	}

	async getHyperlinks() {
		return (this.isMobileApp) 
			? await DataLocalSQLite.getHyperlinks() 
			: await DataLocalIndexedDb.getHyperlinks();
	}

	async addOrUpdateHyperlink(hyperlink) {
		(this.isMobileApp) 
			? await DataLocalSQLite.addOrUpdateHyperlink(hyperlink) 
			: await DataLocalIndexedDb.addOrUpdateHyperlink(hyperlink);
	}

	async deleteHyperlink(id) {
		(this.isMobileApp) 
			? await DataLocalSQLite.deleteHyperlink(id) 
			: await DataLocalIndexedDb.deleteHyperlink(id);
	}

	async deleteDb() {
		(this.isMobileApp) 
			? await DataLocalSQLite.deleteDb() 
			: await DataLocalIndexedDb.deleteDb();
	}

	async initDb() {
		(this.isMobileApp) 
			? await DataLocalSQLite.initDb() 
			: await DataLocalIndexedDb.initDb();
	}
}

export default new DataLocal();