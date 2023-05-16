function getSessionStorageKey({ tabId }) {
	return `${tabId}`;
}

async function startTimer(details) {
	const { frameType, timeStamp } = details;

	if (frameType !== "outermost_frame") {
		return;
	}

	await chrome.storage.session.set({
		[getSessionStorageKey(details)]: timeStamp,
	});
}

async function stopTimer(details) {
	const { frameType, timeStamp, url } = details;

	if (frameType !== "outermost_frame") {
		return;
	}

	const sessionStorageKey = getSessionStorageKey(details);
	const result = await chrome.storage.session.get([sessionStorageKey]);
	const startTimeStamp = result[sessionStorageKey];

	if (!startTimeStamp) {
		return;
	}

	const durationSeconds = Math.floor((timeStamp - startTimeStamp) / 1000);
	const duration = {
		minutes: Math.floor(durationSeconds / 60),
		seconds: durationSeconds % 60,
	};

	await chrome.notifications.create({
		type: "basic",
		iconUrl: "images/clock.png",
		title: "Results are in!",
		message: `You were on ${url} for ${duration.minutes} minutes and ${duration.seconds} seconds.`,
	});
}

chrome.runtime.onInstalled.addListener(() => {
	const filters = {
		url: [
			{
				// TODO: Let the user configure this.
				urlPrefix: "https://developer.mozilla.org/en-US/docs/",
			},
		],
	};

	chrome.webNavigation.onBeforeNavigate.addListener(stopTimer, filters);
	chrome.webNavigation.onCompleted.addListener(startTimer, filters);
});
