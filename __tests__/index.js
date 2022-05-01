import {jest} from '@jest/globals'

// Code under test
import { queueAndAttemptRequest, getOutstandingRequests, syncRequests } from '../index.js';

/**
 * FakeIndexDB doesn't support blobs
 * See https://github.com/dumbmatter/fakeIndexedDB/issues/56
 * Therefore, extend the Request class to fake the blob function to return something which fakeIndexDB can handle
 */
class BloblessRequest extends Request {
	clone() {
		const clone = super.clone();
		clone.blob = this.blob;
		return clone;
	}
	async blob() {
		return this.body;
	}
}

describe('Queuing with reliable network', () => {
	test('Add requests to queue', async () => {
		const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue(new Response({status: 204, statusText: "No Content"}));
		const request1 = new BloblessRequest("https://example.com/api/endpoint1", {method: 'PUT'});
		const request2 = new BloblessRequest("https://example.com/api/endpoint2", {method: 'PATCH'});

		await queueAndAttemptRequest(request1);

		let queue = await getOutstandingRequests();
		expect(queue).toHaveLength(1);
		expect(queue[0].method).toEqual(request1.method);
		expect(queue[0].url).toEqual(request1.url);

		await new Promise(process.nextTick);
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

		await new Promise(process.nextTick);
		queue = await getOutstandingRequests();
		expect(queue).toHaveLength(0);
		expect(mockFetch.mock.calls).toHaveLength(2);
		expect(mockFetch.mock.calls[1][0].method).toEqual(request2.method);
		expect(mockFetch.mock.calls[1][0].url).toEqual(request2.url);
	});
});