import {jest} from '@jest/globals';

// Code under test
import { queueAndAttemptRequest, getOutstandingRequests, syncRequests } from '../index.js';

/**
 * Clear the request queue and any fetch mocks after each test
 */
afterEach(async () => {
	jest.spyOn(global, "fetch").mockResolvedValue(new Response({status: 204, statusText: "No Content"}));
	await syncRequests();
	jest.spyOn(global, "fetch").mockClear();
});

describe('Queuing with reliable network', () => {
	test('Add requests to queue', async () => {
		const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue(new Response(null, {status: 204, statusText: "No Content"}));
		const request1 = new Request("https://example.com/api/endpoint1", {method: 'PUT'});
		const request2 = new Request("https://example.com/api/endpoint2", {method: 'PATCH'});

		await queueAndAttemptRequest(request1);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(1);
		expect(queue[0].method).toEqual(request1.method);
		expect(queue[0].url).toEqual(request1.url);

		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(0);
		expect(mockFetch.mock.calls).toHaveLength(1);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request1.method);
		expect(mockFetch.mock.calls[0][0].url).toEqual(request1.url);

		await queueAndAttemptRequest(request2);
		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(1);
		expect(queue[0].method).toEqual(request2.method);
		expect(queue[0].url).toEqual(request2.url);

		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(0);
		expect(mockFetch.mock.calls).toHaveLength(2);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request2.method);
		expect(mockFetch.mock.calls[1][0].url).toEqual(request2.url);
	});
});
describe('Queuing when requests fail', () => {
	test('Completely Offline', async () => {
		const mockFetch = jest.spyOn(global, "fetch").mockRejectedValue(new TypeError('Failed to fetch'));
		const request1 = new Request("https://example.com/api/endpoint3", {method: 'PUT'});
		const request2 = new Request("https://example.com/api/endpoint4", {method: 'PATCH'});

		await queueAndAttemptRequest(request1);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(1);
		expect(queue[0].method).toEqual(request1.method);
		expect(queue[0].url).toEqual(request1.url);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request1.method);

		await queueAndAttemptRequest(request2);
		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(2);
		expect(queue[1].method).toEqual(request2.method);
		expect(queue[1].url).toEqual(request2.url);

		expect(mockFetch).toHaveBeenCalledTimes(2);

		// As the first request wasn't successful, it should have been retried, rather than moving on to request2
		expect(mockFetch.mock.calls[1][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request1.method);

	});
	test('Server Errors', async () => {
		const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue(new Response("<html>Error Page</html>",{status: 503, statusText: "Service Unavailable"}));
		const request1 = new Request("https://example.com/api/endpoint5", {method: 'PUT'});
		const request2 = new Request("https://example.com/api/endpoint6", {method: 'PATCH'});

		await queueAndAttemptRequest(request1);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(1);
		expect(queue[0].method).toEqual(request1.method);
		expect(queue[0].url).toEqual(request1.url);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request1.method);

		await queueAndAttemptRequest(request2);
		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(2);
		expect(queue[1].method).toEqual(request2.method);
		expect(queue[1].url).toEqual(request2.url);

		expect(mockFetch).toHaveBeenCalledTimes(2);

		// As the first request wasn't successful, it should have been retried, rather than moving on to request2
		expect(mockFetch.mock.calls[1][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request1.method);

	});
	let rejectFetch;
	test('Unresponsive network', async () => {
		// Use a promise which is unresolved until after the test, to simulate an unresponsive network
		const mockFetch = jest.spyOn(global, "fetch").mockReturnValue(new Promise((resolve, reject) => {rejectFetch = reject}));
		const request1 = new Request("https://example.com/api/endpoint7", {method: 'PUT'});
		const request2 = new Request("https://example.com/api/endpoint8", {method: 'PATCH'});

		await queueAndAttemptRequest(request1);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(1);
		expect(queue[0].method).toEqual(request1.method);
		expect(queue[0].url).toEqual(request1.url);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request1.method);

		await queueAndAttemptRequest(request2);
		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(2);
		expect(queue[1].method).toEqual(request2.method);
		expect(queue[1].url).toEqual(request2.url);

		// Second fetch should never be called as first one hasn't finished
		expect(mockFetch).toHaveBeenCalledTimes(1);

	});
	afterEach(async () => {
		if (rejectFetch) rejectFetch(new TypeError('Cancelling Fetch due to end of test'));
		rejectFetch = null;
	});
});
describe('Sync can be triggered on demand', () => {
	test('Call syncRequests on a queue of failed requests', async () => {

		// Created queue of failed requests
		jest.spyOn(global, "fetch").mockRejectedValue(new TypeError('Failed to fetch'));
		const request1 = new Request("https://example.com/api/endpoint9", {method: 'PUT'});
		const request2 = new Request("https://example.com/api/endpoint10", {method: 'PATCH'});
		await queueAndAttemptRequest(request1);
		await queueAndAttemptRequest(request2);
		expect(await getOutstandingRequests()).toHaveLength(2);

		// Mock an online state again
		const mockFetch = jest.spyOn(global, "fetch")
			.mockReset()
			.mockResolvedValue(new Response(null, {status: 204, statusText: "No Content"}));

		// Trigger the function under test
		await syncRequests();

		// Check the queue has been emptied
		expect(await getOutstandingRequests()).toHaveLength(0);

		// Check it made a fetch call for each request
		expect(mockFetch).toHaveBeenCalledTimes(2);

		// Check the requests have been sent in the correct order
		expect(mockFetch.mock.calls[0][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request1.method);
		expect(mockFetch.mock.calls[1][0].url).toEqual(request2.url);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request2.method);
	});
});

describe('Simplifying the queue using restful principles', () => {
	test('Overwritten PUT requests get skipped', async () => {
		// Created queue of failed requests
		jest.spyOn(global, "fetch").mockRejectedValue(new TypeError('Failed to fetch'));
		const request1 = new Request("https://example.com/api/endpoint11", {method: 'PUT', body: new Blob(["first"], {type: "text/plain"})});
		const request2 = new Request("https://example.com/api/endpoint11", {method: 'PUT', body: new Blob(["second"], {type: "text/plain"})});
		const request3 = new Request("https://example.com/api/endpoint12", {method: 'PUT', body: new Blob(["first"], {type: "text/plain"})});
		const request4 = new Request("https://example.com/api/endpoint11", {method: 'PUT', body: new Blob(["third"], {type: "text/plain"})});
		await queueAndAttemptRequest(request1);
		await queueAndAttemptRequest(request2);
		await queueAndAttemptRequest(request3);
		await queueAndAttemptRequest(request4);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(2);
		expect(queue[0].method).toEqual(request3.method);
		expect(queue[0].url).toEqual(request3.url);
		expect(await queue[0].text()).toEqual("first");
		expect(queue[1].method).toEqual(request4.method);
		expect(queue[1].url).toEqual(request4.url);
		expect(await queue[1].text()).toEqual("third");

		// Mock an online state again
		const mockFetch = jest.spyOn(global, "fetch")
			.mockReset()
			.mockResolvedValue(new Response(null, {status: 204, statusText: "No Content"}));

		// Trigger the function under test
		await syncRequests();

		// Check the queue has been emptied
		expect(await getOutstandingRequests()).toHaveLength(0);

		// Check it made a fetch call for each request
		expect(mockFetch).toHaveBeenCalledTimes(2);

		// Check the requests have been sent in the correct order
		expect(mockFetch.mock.calls[0][0].url).toEqual(request3.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request3.method);
		expect(await mockFetch.mock.calls[0][0].text()).toEqual("first");
		expect(mockFetch.mock.calls[1][0].url).toEqual(request4.url);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request4.method);
		expect(await mockFetch.mock.calls[1][0].text()).toEqual("third");
	});
	test('Deleted PUT requests get skipped', async () => {
		// Created queue of failed requests
		jest.spyOn(global, "fetch").mockRejectedValue(new TypeError('Failed to fetch'));
		const request1 = new Request("https://example.com/api/endpoint13", {method: 'PUT', body: new Blob(["first"], {type: "text/plain"})});
		const request2 = new Request("https://example.com/api/endpoint13", {method: 'PUT', body: new Blob(["second"], {type: "text/plain"})});
		const request3 = new Request("https://example.com/api/endpoint14", {method: 'PUT', body: new Blob(["first"], {type: "text/plain"})});
		const request4 = new Request("https://example.com/api/endpoint13", {method: 'DELETE'});
		await queueAndAttemptRequest(request1);
		await queueAndAttemptRequest(request2);
		await queueAndAttemptRequest(request3);
		await queueAndAttemptRequest(request4);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(2);
		expect(queue[0].method).toEqual(request3.method);
		expect(queue[0].url).toEqual(request3.url);
		expect(await queue[0].text()).toEqual("first");
		expect(queue[1].method).toEqual(request4.method);
		expect(queue[1].url).toEqual(request4.url);

		// Mock an online state again
		const mockFetch = jest.spyOn(global, "fetch")
			.mockReset()
			.mockResolvedValue(new Response(null, {status: 204, statusText: "No Content"}));

		// Trigger the function under test
		await syncRequests();

		// Check the queue has been emptied
		expect(await getOutstandingRequests()).toHaveLength(0);

		// Check it made a fetch call for each request
		expect(mockFetch).toHaveBeenCalledTimes(2);

		// Check the requests have been sent in the correct order
		expect(mockFetch.mock.calls[0][0].url).toEqual(request3.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request3.method);
		expect(await mockFetch.mock.calls[0][0].text()).toEqual("first");
		expect(mockFetch.mock.calls[1][0].url).toEqual(request4.url);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request4.method);
	});
	test("POST requests don't get skipped", async () => {
		// Created queue of failed requests
		jest.spyOn(global, "fetch").mockRejectedValue(new TypeError('Failed to fetch'));
		const request1 = new Request("https://example.com/api/endpoint15", {method: 'POST', body: new Blob(["first"], {type: "text/plain"})});
		const request2 = new Request("https://example.com/api/endpoint15", {method: 'POST', body: new Blob(["second"], {type: "text/plain"})});
		const request3 = new Request("https://example.com/api/endpoint16", {method: 'POST', body: new Blob(["first"], {type: "text/plain"})});
		const request4 = new Request("https://example.com/api/endpoint15", {method: 'POST', body: new Blob(["third"], {type: "text/plain"})});
		await queueAndAttemptRequest(request1);
		await queueAndAttemptRequest(request2);
		await queueAndAttemptRequest(request3);
		await queueAndAttemptRequest(request4);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(4);
		expect(queue[0].method).toEqual(request1.method);
		expect(queue[0].url).toEqual(request1.url);
		expect(await queue[0].text()).toEqual("first");
		expect(queue[1].method).toEqual(request2.method);
		expect(queue[1].url).toEqual(request2.url);
		expect(await queue[1].text()).toEqual("second");
		expect(queue[2].method).toEqual(request3.method);
		expect(queue[2].url).toEqual(request3.url);
		expect(await queue[2].text()).toEqual("first");
		expect(queue[3].method).toEqual(request4.method);
		expect(queue[3].url).toEqual(request4.url);
		expect(await queue[3].text()).toEqual("third");

		// Mock an online state again
		const mockFetch = jest.spyOn(global, "fetch")
			.mockReset()
			.mockResolvedValue(new Response(null, {status: 204, statusText: "No Content"}));

		// Trigger the function under test
		await syncRequests();

		// Check the queue has been emptied
		expect(await getOutstandingRequests()).toHaveLength(0);

		// Check it made a fetch call for each request
		expect(mockFetch).toHaveBeenCalledTimes(4);

		// Check the requests have been sent in the correct order
		expect(mockFetch.mock.calls[0][0].url).toEqual(request1.url);
		expect(mockFetch.mock.calls[0][0].method).toEqual(request1.method);
		expect(await mockFetch.mock.calls[0][0].text()).toEqual("first");
		expect(mockFetch.mock.calls[1][0].url).toEqual(request2.url);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request2.method);
		expect(await mockFetch.mock.calls[1][0].text()).toEqual("second");
		expect(mockFetch.mock.calls[2][0].url).toEqual(request3.url);
		expect(mockFetch.mock.calls[2][0].method).toEqual(request3.method);
		expect(await mockFetch.mock.calls[2][0].text()).toEqual("first");
		expect(mockFetch.mock.calls[3][0].url).toEqual(request4.url);
		expect(mockFetch.mock.calls[3][0].method).toEqual(request4.method);
		expect(await mockFetch.mock.calls[3][0].text()).toEqual("third");
	});
});