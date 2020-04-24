import React from 'react';
import { StyleSheet, Button, Text, TextInput, View, ScrollView, Linking, Alert, Platform, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Data from './services/Data/Data';

export default class App extends React.Component {
	state = {
		title: '',
		url: 'https://',
		hyperlinks: [],
		owner: ''
	};
	resetInputState = () => {
		this.setState({
			title: '',
			url: 'https://'
		});
	};
	onChangeText = (key, val) => {
		this.setState({ [key]: val });
	};
	componentDidMount = async () => {
		this.fetchHyperlinks();
	};
	fetchHyperlinks = async () => {
		// Get a list of hyperlinks
		const hyperlinks = await Data.fetchHyperlinks();
		this.setState({ hyperlinks: hyperlinks });
		
		await this.syncHyperlinks();
	};
	syncHyperlinks = async () => {
		try {
			this.setState({ isSyncing: true });
			const hyperlinks = await Data.syncHyperlinks();
			this.setState({ hyperlinks: hyperlinks });
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to sync links');
			console.log('error: ', error);
		}
		finally {
			this.setState({ isSyncing: false });
		}
	};
	createHyperlink = async (newHyperlink) => {
		try {
			const hyperlinks = await Data.createHyperlink(newHyperlink);
			this.state.hyperlinks = hyperlinks;
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to save this link for good');
			console.log('error: ', error);
		}
		
		await this.syncHyperlinks();
	};
	updateHyperlink = async (updatedHyperlink) => {
		try {
			const hyperlinks = await Data.updateHyperlink(updatedHyperlink);
			this.state.hyperlinks = hyperlinks;
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to update this link for good');
			console.log('error: ', error);
		}
		
		await this.syncHyperlinks();
	};
	deleteHyperlink = async (deletedHyperlink) => {
		try {
			const hyperlinks = await Data.deleteHyperlink(deletedHyperlink);
			this.state.hyperlinks = hyperlinks;
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to delete this link for good');
			console.log('error: ', error);
		}
		
		await this.syncHyperlinks();
	};
	onPressDeleteHyperlink = async (index) => {
		let hyperlinks = this.state.hyperlinks;
		const hyperlinkId = hyperlinks[index].id;

		// Update hyperlinks in state to reflect the change
		hyperlinks.splice(index, 1);
		this.setState({
			hyperlinks: hyperlinks
		})

		const deletedHyperlink = {
			id: hyperlinkId, 
			// owner: this.state.owner
		}
		await this.deleteHyperlink(deletedHyperlink);
	};
	onPressSaveForLaterButton = () => {
		const isUrlEmpty = this.state.url.trim() === '';
		if(isUrlEmpty) {
			this.showAlertMessage('Whoops','You must enter a hyperlink to be saved for later');
			return;
		}
		const isUrlValid = this.isUrlValid(this.state.url);
		if(!isUrlValid) {
			this.showAlertMessage('Whoops','The hyperlink you entered is not valid');
			return;
		}
		this.saveHyperlink();
		this.resetInputState();
	};
	showAlertMessage = (title, msg) => {
		if(Platform.OS === 'ios' || Platform.OS === 'android')
			Alert.alert(title, msg);
		else
			alert(title + ': ' + msg);
	};
	setFocusToHyperlinkInput = () => {
		this.hyperlinkInput.focus();
	};
	openHyperlink = async (hyperlinkObj, index) => {
		await this.flagHyperlinkAsVisited(index);

		const url = hyperlinkObj.url;
		Linking.canOpenURL(url)
			.then(supported => {
				const isValidUrl = supported && this.isUrlValid(url);
				if(isValidUrl)
					Linking.openURL(url);
				else
					throw new Error();
			})
			.catch(error => {
				this.showAlertMessage('Whoops','Cannot go to this saved link');
			});
	};
	flagHyperlinkAsVisited = async (index) => {
		let hyperlinks = this.state.hyperlinks;
		hyperlinks[index].visited = true;
		this.setState({
			hyperlinks: hyperlinks
		})

		try {
			const updatedHyperlink = {
				id: hyperlinks[index].id, 
				visited: hyperlinks[index].visited, 
				owner: this.state.owner
			}
			await this.updateHyperlink(updatedHyperlink);
			console.log('Updated hyperlink in database');
		}
		catch(error) {
			this.showAlertMessage('Whoops','Failed to flag this link as visited for good');
			console.log('error: ', error);
		}
	};
	isUrlValid = (url) => {
		var isValid = url.length > 9 && (url.substr(0, 7) === 'http://' || url.substr(0, 8) === 'https://');
		return isValid;
	};
	saveHyperlink = async () => {
		let newHyperlink = this.createHyperlinkFromState();
		let hyperlinks = this.state.hyperlinks;
		hyperlinks.unshift(newHyperlink);
		this.setState({
			hyperlinks: hyperlinks
		});

		await this.createHyperlink(newHyperlink);
	};
	createHyperlinkFromState = () => {		
		let hyperlink = {
			url: this.state.url.trim(),
		}
		if(this.state.title)
			hyperlink.title = this.state.title.trim();
		return hyperlink;
	};
	render() {
		return (
			<View style={styles.wrapper}>
				<View style={styles.header}>
					<Text style={styles.title}>Save For Later</Text>
					<Text style={styles.subtitle}>What do you want to read, watch or listen to?</Text>
					<TextInput
						ref={(input) => { this.titleInput = input; }}
						style={styles.input}
						value={this.state.title}
						onChangeText={val => this.onChangeText('title', val)}
						onSubmitEditing={this.setFocusToHyperlinkInput}
						placeholder="Title (optional)"
						returnKeyType="next"
					/>
					<TextInput
						ref={(input) => { this.hyperlinkInput = input; }}
						style={styles.input}
						value={this.state.url}
						onChangeText={val => this.onChangeText('url', val)}
						onSubmitEditing={this.onPressSaveForLaterButton}
						placeholder="https://"
						autoCapitalize="none"
						keyboardType="url"
						returnKeyType="done"
						selectTextOnFocus
					/>
					<Button
						ref={(button) => { this.saveForLaterButton = button; }}
						onPress={this.onPressSaveForLaterButton}
						title="Save Link"
						accessibilityLabel="Save Your Hyperlink For Later"
						color="#ff9900"
						padding={44}
					/>
				</View>
				<ScrollView style={styles.list}>
					<Text style={styles.title}>Your Saved Links</Text>
					{this.state.hyperlinks.map((hyperlink, index) => (
						<View key={index} style={styles.hyperlinkRow}>
							<Text
								style={[styles.hyperlink, hyperlink.visited ? styles.hyperlinkVisited : undefined]}
								onPress={() => this.openHyperlink(hyperlink, index)}
							>
								{ hyperlink.title || hyperlink.url }
							</Text>
							<TouchableOpacity style={styles.hyperlinkDelete} onPressOut={() => this.onPressDeleteHyperlink(index)}>
								<MaterialIcons
									name="delete-forever"
									size={24}
									color="#2d2d2d"
								/>
							</TouchableOpacity>
						</View>
					))}
				</ScrollView>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		borderTopWidth: 1,
		borderTopColor: '#999'
	},
	list: {
		backgroundColor: '#ccc',
		paddingHorizontal: 10,
		paddingVertical: 20
	},
	hyperlinkRow: {
		flexDirection: 'row'
	},
	hyperlink: {
		flex: 1,
		fontSize: 20,
		color: 'blue',
		marginVertical: 10,
		borderLeftColor: 'grey',
		borderLeftWidth: 4,
		paddingHorizontal: 10
	},
	hyperlinkVisited: {
		color: 'purple',
		textDecorationLine: 'line-through'
	},
	hyperlinkDelete: {
		marginTop: 10
	},
	header: {
		borderBottomColor: '#999',
		borderBottomWidth: 1,
		backgroundColor: '#fff',
		paddingHorizontal: 10,
		paddingVertical: 20,
		paddingTop: 20
	},
	title: {
		fontSize: 20,
		marginBottom: 20
	},
	subtitle: {
		fontSize: 12,
		marginBottom: 20
	},
	input: {
		height: 50,
		borderBottomWidth: 2,
		borderBottomColor: 'blue',
		marginBottom: 20
	}
});