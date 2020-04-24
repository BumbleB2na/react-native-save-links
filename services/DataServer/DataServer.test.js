import DataServer from './DataServer';


describe('alterSyncedHyperlink()', () => {
	it('alters a hyperlink the same as a server would', async () => {
		const localHyperlink = {
			id: "c5yl1u4cfi64tvbgu66wbl",
			title: "Test",
			url: "https://example.com",
			visited: true,
			createdOn: "2020-03-31T03:33:33.333Z",
			updatedOn: "2020-03-31T03:33:33.333Z",
			dirty: true
		};
		const syncedHyperlink = DataServer.alterSyncedHyperlink(localHyperlink);
		expect(syncedHyperlink.dirty).not.toBe(localHyperlink.dirty);
		expect(syncedHyperlink.updatedOn).not.toBe(localHyperlink.updatedOn);
	});

});

