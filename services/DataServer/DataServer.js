// Simulate calls to server
class DataServer {

	async getHyperlinks() {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});
	}

	async addOrUpdateHyperlink(hyperlink) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				let syncedHyperlink = this.alterSyncedHyperlink(hyperlink);
				resolve(syncedHyperlink);
			}, 500);
		});
	}

	// For testing -- alters hyperlink the same as a server would
	alterSyncedHyperlink(hyperlink) {
		let syncedHyperlink = Object.assign({}, hyperlink);  // make copy
		syncedHyperlink.updatedOn = this.getISOTimestamp();
		delete syncedHyperlink.dirty;
		return syncedHyperlink;
	}
	
	getISOTimestamp() {
		return (new Date()).toISOString();
	}

}

export default new DataServer();