## Functions

<dl>
<dt><a href="#queueAndAttemptRequest">queueAndAttemptRequest(request)</a> ⇒ <code>Promise.&lt;Response&gt;</code></dt>
<dd><p>Stores a request in the queue and then attempts to send it to the server.
If there are existing requests in the queue, those will be attempted first to ensure they are sent in the intended order.
Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
Existing PUT and DELETE requests in the queue for the same URL will be dropped if the method is PUT or DELETE.</p>
</dd>
<dt><a href="#queueRequest">queueRequest(request)</a> ⇒ <code>Promise.&lt;number&gt;</code> ℗</dt>
<dd><p>Stores a request object in indexDB</p>
</dd>
<dt><a href="#attemptRequest">attemptRequest(requestid, request)</a> ⇒ <code>Promise.&lt;Response&gt;</code> ℗</dt>
<dd><p>Attempts to fetch a request from the queue.  If successful, the request is removed from the queue.</p>
</dd>
<dt><a href="#removeFromQueue">removeFromQueue(requestid)</a> ⇒ <code>Promise</code> ℗</dt>
<dd><p>Removes a request from the queue</p>
</dd>
<dt><a href="#getOutstandingRequestsAndIds">getOutstandingRequestsAndIds()</a> ⇒ <code>Promise.&lt;Array.&lt;{id: number, request: Request}&gt;&gt;</code> ℗</dt>
<dd><p>Fetches all the outstanding requests, along with their IDs from indexDB
NB: getOutstandRequests is a simplified public wrapper for this function, which doesn&#39;t expose the internal requestids</p>
</dd>
<dt><a href="#getOutstandingRequests">getOutstandingRequests()</a> ⇒ <code>Promise.&lt;Array.&lt;Request&gt;&gt;</code></dt>
<dd><p>Fetches all the outstanding requests from the queue</p>
</dd>
<dt><a href="#syncRequests">syncRequests()</a> ⇒ <code>Promise</code></dt>
<dd><p>Asynchronously attempts to send queued requests to the server in order.
Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
To avoid any race conditions, only one attempt to sync the queue will happen at a time.
If called when an existing attempt is being made, another attempt will be made after the current one completes.</p>
</dd>
<dt><a href="#attemptOutstandingRequests">attemptOutstandingRequests()</a> ⇒ <code>Promise</code> ℗</dt>
<dd><p>Attempts to fetch an outstanding requests, and if successful remove them from the queue.
Stops after the first failure and doesn&#39;t attempt any subsequent requests in the queue.
NB: Calling this function whilst a previous invocation hasn&#39;t completed yet, may cause a race condition.  Use the <code>syncRequests</code> function to avoid this.</p>
</dd>
<dt><a href="#pruneQueueByUrl">pruneQueueByUrl(url)</a> ⇒ <code>Promise</code> ℗</dt>
<dd><p>Removes all PUT or DELETE requests to the given URL from the queue
This is because a subsequest request will make these unneeded</p>
</dd>
<dt><a href="#regularSync">regularSync()</a> ℗</dt>
<dd><p>Attempts to sync any requests in the queue every 5 minutes
If there are no requests in the queue, the impact of this should be negligible</p>
</dd>
</dl>

<a name="queueAndAttemptRequest"></a>

## queueAndAttemptRequest(request) ⇒ <code>Promise.&lt;Response&gt;</code>
Stores a request in the queue and then attempts to send it to the server.
If there are existing requests in the queue, those will be attempted first to ensure they are sent in the intended order.
Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
Existing PUT and DELETE requests in the queue for the same URL will be dropped if the method is PUT or DELETE.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Response&gt;</code> - A promise which resolves with a "202 Added to Queue" response once the request has been successfully added to the queue.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | A Request object from the Fetch API.  Must not be in an "unusable" state. |

<a name="queueRequest"></a>

## queueRequest(request) ⇒ <code>Promise.&lt;number&gt;</code> ℗
Stores a request object in indexDB

**Kind**: global function  
**Returns**: <code>Promise.&lt;number&gt;</code> - A promise which resolves with a unique requestid when succesfully stored (or rejects on failure)  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | A Request object from the Fetch API |

<a name="attemptRequest"></a>

## attemptRequest(requestid, request) ⇒ <code>Promise.&lt;Response&gt;</code> ℗
Attempts to fetch a request from the queue.  If successful, the request is removed from the queue.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Response&gt;</code> - A promise which resolves with the requests response following removal from the queue (or rejects on failure)  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| requestid | <code>number</code> | The unique ID for this request stored in indexDB |
| request | <code>Request</code> | A Request object from the Fetch API |

<a name="removeFromQueue"></a>

## removeFromQueue(requestid) ⇒ <code>Promise</code> ℗
Removes a request from the queue

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise which resolves when succesfully removed (or rejects on failure)  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| requestid | <code>number</code> | The unique ID for the request to remove from indexDB+ |

<a name="getOutstandingRequestsAndIds"></a>

## getOutstandingRequestsAndIds() ⇒ <code>Promise.&lt;Array.&lt;{id: number, request: Request}&gt;&gt;</code> ℗
Fetches all the outstanding requests, along with their IDs from indexDB
NB: getOutstandRequests is a simplified public wrapper for this function, which doesn't expose the internal requestids

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;{id: number, request: Request}&gt;&gt;</code> - An array containing requests and their associated requestids  
**Access**: private  
<a name="getOutstandingRequests"></a>

## getOutstandingRequests() ⇒ <code>Promise.&lt;Array.&lt;Request&gt;&gt;</code>
Fetches all the outstanding requests from the queue

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;Request&gt;&gt;</code> - An array of outstanding requests in the order they are to be sent to the server  
<a name="syncRequests"></a>

## syncRequests() ⇒ <code>Promise</code>
Asynchronously attempts to send queued requests to the server in order.
Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
To avoid any race conditions, only one attempt to sync the queue will happen at a time.
If called when an existing attempt is being made, another attempt will be made after the current one completes.

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise which resolves when all requests have been succesfully removed from the queue, or rejects after encountering the first failure  
<a name="attemptOutstandingRequests"></a>

## attemptOutstandingRequests() ⇒ <code>Promise</code> ℗
Attempts to fetch an outstanding requests, and if successful remove them from the queue.
Stops after the first failure and doesn't attempt any subsequent requests in the queue.
NB: Calling this function whilst a previous invocation hasn't completed yet, may cause a race condition.  Use the `syncRequests` function to avoid this.

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise which resolves when all requests have been succesfully removed from the queue, or rejects after encountering the first failure  
**Access**: private  
<a name="pruneQueueByUrl"></a>

## pruneQueueByUrl(url) ⇒ <code>Promise</code> ℗
Removes all PUT or DELETE requests to the given URL from the queue
This is because a subsequest request will make these unneeded

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise which resolves when the pruning has completed  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The URL of requests to prune from the queue |

<a name="regularSync"></a>

## regularSync() ℗
Attempts to sync any requests in the queue every 5 minutes
If there are no requests in the queue, the impact of this should be negligible

**Kind**: global function  
**Access**: private  
