const manifestUri = 'https://storage.googleapis.com/shaka-demo-assets/angel-one-widevine/dash.mpd';


function initApp() {
	// Install built-in polyfills to patch browser incompatibilities.
	shaka.polyfill.installAll();
	// Check to see if the browser supports the basic APIs Shaka needs.
	if (shaka.Player.isBrowserSupported()) {
		// Everything looks good!
		initPlayer();
	} else {
		// This browser does not have the minimum set of APIs we need.
		console.error('Browser not supported!');
	}
}

async function initPlayer() {
	// Create a Player instance.
	const video = document.getElementById('video');
	const player = new shaka.Player(video);

	// Attach player to the window to make it easy to access in the JS console.
	window.player = player;

	// Listen for error events.

	video.addEventListener('play', () => {
		console.log('player.getImageTracks', player.getImageTracks());
		console.log('player.getTextTracks', player.getTextTracks());
		console.log('player.getAudioLanguages', player.getAudioLanguages());
		console.log('player.getVariantTracks', player.getVariantTracks());
	});

	player.addEventListener('error', onErrorEvent);

	player.addEventListener('metadata', (event) => {
		console.log('metadata event', event);
		let evt = {
			...event.payload,
			metadataType: event.metadataType,
			startTime: event.startTime,
			endTime: event.endTime,
		};

		emsgDebug.insertAdjacentText('beforeend', JSON.stringify(evt) + '\n\n');
	});

	player.addEventListener('emsg', (event) => {
		let parsedMessage = String.fromCharCode(...Array.from(event.detail?.messageData));
		let evt = Object.assign({}, event.detail);
		evt.messageData = evt.messageData.slice(0, 4).join(' ') + '...';
		evt.parsedMessage = parsedMessage;
		emsgDebug.insertAdjacentText('beforeend', JSON.stringify(evt) + '\n\n');
	});

	const licenseServer = 'https://proxy.uat.widevine.com/proxy';

	player.configure({
		drm: {
			servers: { 'com.widevine.alpha': licenseServer },
		},
	});

	// Try to load a manifest.
	// This is an asynchronous process.
	try {
		await player.load(manifestUri);
		// This runs if the asynchronous load is successful.
		console.log('The video has now been loaded!');
	} catch (e) {
		// onError is executed if the asynchronous load fails.
		onError(e);
	}
}

function onErrorEvent(event) {
	// Extract the shaka.util.Error object from the event.
	onError(event.detail);
}

function onError(error) {
	// Log the error.
	console.error('Error code', error.code, 'object', error);
}

document.addEventListener('DOMContentLoaded', initApp);