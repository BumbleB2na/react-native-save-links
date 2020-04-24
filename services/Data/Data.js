import DataLocal from "../../services/DataLocal/DataLocal";
import DataServer from "../../services/DataServer/DataServer"

class Data {

	constructor() {
		this.hyperlinks = {};
		this.ERROR = {
			CREATE: "Cannot create hyperlink because object already has an id property",
			UPDATE: "Cannot update hyperlink because object has no id property",
			DELETE: "Cannot delete hyperlink because object has no id property",
		};
	}

	async getHyperlinks() {
		const sortedHyperlinks = this.getHyperlinksArraySorted().filter(hyperlink => !hyperlink.deleted);
		return sortedHyperlinks;
	}
	
	async createHyperlink(hyperlink) {
		if(hyperlink.id) {
			throw new Error(this.ERROR.CREATE);
		}

		// update in-memory data
		const id = this.generateUid();
		const timestamp = this.getISOTimestamp();
		const newHyperlink = {
			id,
			...hyperlink,
			createdOn: timestamp,
			updatedOn: timestamp,
			dirty: true
		};
		const updatedHyperlinks = {
			...this.hyperlinks,
			[id] : newHyperlink
		};
		this.hyperlinks = updatedHyperlinks;
		return this.getHyperlinks();
	}
	
	async updateHyperlink(hyperlink) {
		if(!hyperlink.id) {
			throw new Error(this.ERROR.UPDATE);
		}

		// update in-memory data
		let updatedHyperlinks = {
			...this.hyperlinks
		};
		const timestamp = this.getISOTimestamp();
		const updatedHyperlink = {
			...updatedHyperlinks[hyperlink.id],
			...hyperlink,
			dirty: true,
			updatedOn: timestamp
		}
		if(!updatedHyperlink.createdOn)
			updatedHyperlink.createdOn = timestamp;
		updatedHyperlinks[updatedHyperlink.id] = updatedHyperlink;
		this.hyperlinks = updatedHyperlinks;
		return this.getHyperlinks();
	}
	
	async deleteHyperlink(hyperlink) {
		if(!hyperlink.id) {
			throw new Error(this.ERROR.DELETE);
		}

		// update in-memory data (piggyback on update)
		const deletedHyperlink = {
			...hyperlink,
			deleted: true
		}
		return await this.updateHyperlink(deletedHyperlink);
	}

	getHyperlinksArraySorted() {
		return Object.entries(this.hyperlinks).map(e => e[1]).sort(this.sortDescByISOTimestamp);
	}

	// generate simple unique identifier
	generateUid() {
		var uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		return uid;
	}

	getISOTimestamp() {
		return (new Date()).toISOString();
	}

	sortDescByISOTimestamp(a, b) {
		return (a.createdOn > b.createdOn) ? -1 : ((a.createdOn < b.createdOn) ? 1 : 0);
	}

	
	// FETCH AND SYNC

	async syncHyperlinks() {
		const unsyncedHyperlinks = this.getHyperlinksArraySorted().filter(hyperlink => hyperlink.dirty);
		for(var i = 0; i < unsyncedHyperlinks.length; i++) {
			const hyperlink = unsyncedHyperlinks[i];
			const syncedHyperlink = DataServer && await DataServer.addOrUpdateHyperlink(hyperlink);
			if(syncedHyperlink) {
				this.updateSyncedHyperlink(syncedHyperlink);
				DataLocal && await DataLocal.addOrUpdateHyperlink(syncedHyperlink);
			}
		}
		return this.getHyperlinks();
	}

	async updateSyncedHyperlink(hyperlink) {
		// update in-memory data
		let updatedHyperlinks = {
			...this.hyperlinks
		};
		updatedHyperlinks[hyperlink.id] = hyperlink;
		this.hyperlinks = updatedHyperlinks;
	}

	async fetchHyperlinks() {
		await this.loadLocalHyperlinks();
		await this.loadServerHyperlinks();
		return this.getHyperlinks();
	}

	async loadLocalHyperlinks() {
		DataLocal && await DataLocal.initDb();
		const hyperlinks = DataLocal && await DataLocal.getHyperlinks();
		if(!hyperlinks)
			return;
		this.hyperlinks = hyperlinks;
	}

	async loadServerHyperlinks() {
		const hyperlinks = DataServer && await DataServer.getHyperlinks();
		if(!hyperlinks)
			return;
		this.hyperlinks = hyperlinks;
	}

	// For testing -- unit, implementation or end-to-end
	async initMockHyperlinks(mockHyperlinks) {
		this.hyperlinks = mockHyperlinks;
		DataLocal && await this.loadLocalHyperlinks();
	}

	// For testing -- unit, implementation or end-to-end
	async resetMockHyperlinks() {
		DataLocal && await DataLocal.deleteDb();
		this.hyperlinks = {};
	}

}

export default new Data();
