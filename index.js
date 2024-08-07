import { openDB } from 'idb';

const dbPromise = openDB('restful-queue', 1, {
	upgrade(db) {
		db.createObjectStore('requests', {
			keyPath: 'id',
			autoIncrement: true,
		});
	},
});

/**
 * Stores a request in the queue and then attempts to send it to the server.
 * If there are existing requests in the queue, those will be attempted first to ensure they are sent in the intended order.
 * Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
 * Existing PUT and DELETE requests in the queue for the same URL will be dropped if the method is PUT or DELETE.
 * 
 * @param {Request} request A Request object from the Fetch API.  Must not be in an "unusable" state.
 * 
 * @returns {Promise<Response>} A promise which resolves with a "202 Added to Queue" response once the request has been successfully added to the queue.
 */
export async function queueAndAttemptRequest(request) {
	const requestid = await queueRequest(request);

	// Asynchronously fire off a sync
	// Suppress any failures, knowing the request is stored safely in the queue
	syncRequests().catch(() => {});
	return new Response(new Blob(), {status: 202, statusText: "Added to Queue"});
}

/**
 * Stores a request object in indexDB 
 * 
 * @private
 * @param {Request} request A Request object from the Fetch API
 * 
 * @returns {Promise.<number>} A promise which resolves with a unique requestid when succesfully stored (or rejects on failure)
 */
async function queueRequest(request) {

	// Store a cloned version of the request, so the orginal can still be fetched later
	request = request.clone();
	const { url, method } = request;
	const headers = [...request.headers];
	const body = await request.blob();
	const rawData = { url, method, headers, body };

	const db = await dbPromise;
	if (method == "PUT" || method == "DELETE") await pruneQueueByUrl(url);
	const requestid = await db.add('requests', rawData);
	return requestid;
}

/**
 * Attempts to fetch a request from the queue.  If successful, the request is removed from the queue.
 * 
 * @private
 * @param {number} requestid The unique ID for this request stored in indexDB
 * @param {Request} request A Request object from the Fetch API
 * 
 * @returns {Promise.<Response>} A promise which resolves with the requests response following removal from the queue (or rejects on failure)
 */
async function attemptRequest(requestid, request) {
	const response = await fetch(request);
	if (response.status >= 500) throw new Error(`HTTP Error ${response.status} received`);
	await removeFromQueue(requestid);
	return response;
}

/**
 * Removes a request from the queue
 * 
 * @private
 * @param {number} requestid The unique ID for the request to remove from indexDB+
 * 
 * @returns {Promise} A promise which resolves when succesfully removed (or rejects on failure)
 */
async function removeFromQueue(requestid) {
	const db = await dbPromise;
	await db.delete('requests', requestid);
}

/**
 * Fetches all the outstanding requests, along with their IDs from indexDB
 * NB: getOutstandRequests is a simplified public wrapper for this function, which doesn't expose the internal requestids
 * 
 * @private
 * @returns {Promise.<Array.<{id: number, request: Request}>>} An array containing requests and their associated requestids
 */
async function getOutstandingRequestsAndIds() {
	const db = await dbPromise;
	return (await db.getAll('requests')).map(raw => {
		const { url, method, headers, body, id } = raw;
		const request = new Request(url, {method, headers, body});
		return {id, request};
	});
}

/**
 * Fetches all the outstanding requests from the queue
 * 
 * @returns {Promise.<Array.<Request>>} An array of outstanding requests in the order they are to be sent to the server
 */
export async function getOutstandingRequests() {
	return (await getOutstandingRequestsAndIds())
		.map(({request}) => request);
}

let currentSync = null;
let queueSync = false;

/**
 * Asynchronously attempts to send queued requests to the server in order.
 * Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
 * To avoid any race conditions, only one attempt to sync the queue will happen at a time.
 * If called when an existing attempt is being made, another attempt will be made after the current one completes.
 * 
 * @returns {Promise} A promise which resolves when all requests have been succesfully removed from the queue, or rejects after encountering the first failure
 */
export function syncRequests() {
	queueSync = false;

	// If there's no existing sync, then start one
	if (!currentSync) {
		currentSync = attemptOutstandingRequests()

		// Once complete, set currentSync back to null, regardless of outcome
		.finally(() => {
			currentSync = null;
			if (queueSync) return syncRequests();
		});
	} else {

		// Otherwise, queue another sync after the current one.
		queueSync = true;
	}
	return currentSync;
}

/**
 * Attempts to fetch an outstanding requests, and if successful remove them from the queue.
 * Stops after the first failure and doesn't attempt any subsequent requests in the queue.
 * NB: Calling this function whilst a previous invocation hasn't completed yet, may cause a race condition.  Use the `syncRequests` function to avoid this.
 * 
 * @private
 * @returns {Promise} A promise which resolves when all requests have been succesfully removed from the queue, or rejects after encountering the first failure
 */
async function attemptOutstandingRequests() {
	const requests = await getOutstandingRequestsAndIds();
	for (const {id, request} of requests) {
		await attemptRequest(id, request);
	}
}

/**
 * Removes all PUT or DELETE requests to the given URL from the queue
 * This is because a subsequest request will make these unneeded
 *
 * @private
 * @param {string} url The URL of requests to prune from the queue
 *
 * @returns {Promise} A promise which resolves when the pruning has completed
 */
async function pruneQueueByUrl(url) {
	const queue = await getOutstandingRequestsAndIds();
	for (const {id, request} of queue) {
		if (request.url != url) continue;
		if (request.method != 'PUT' && request.method != 'DELETE') continue;
		await removeFromQueue(id);
	}
}

// Code which only gets run when in the context of a service worker
if (typeof self === "object" && !!self.serviceWorker) {

	/**
	 * Attempts to sync any requests in the queue every 5 minutes
	 * If there are no requests in the queue, the impact of this should be negligible
	 * @private
	 */
	function regularSync() {
		setTimeout(regularSync, 5 * 60 * 1000);
		syncRequests();
	}
	regularSync();

	// Automatically try to sync any requests in the queue any time the device comes online
	self.addEventListener("online", syncRequests);
}
