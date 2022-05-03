## Functions

<dl>
<dt><a href="#queueAndAttemptRequest">queueAndAttemptRequest(request)</a> ⇒ <code>Promise</code></dt>
<dd><p>Stores a request in the queue and then attempts to send it to the server</p>
</dd>
<dt><a href="#queueRequest">queueRequest(request)</a> ⇒ <code>Promise.&lt;number&gt;</code></dt>
<dd><p>Stores a request object in indexDB</p>
</dd>
<dt><a href="#attemptRequest">attemptRequest(requestid, request)</a> ⇒ <code>Promise.&lt;Response&gt;</code></dt>
<dd><p>Attempts to fetch a request from the queue.  If successful, the request is removed from the queue.</p>
</dd>
<dt><a href="#removeFromQueue">removeFromQueue(requestid)</a> ⇒ <code>Promise</code></dt>
<dd><p>Removes a request from the queue</p>
</dd>
<dt><a href="#getOutstandingRequestsAndIds">getOutstandingRequestsAndIds()</a> ⇒ <code>Array.&lt;{id: number, request: Request}&gt;</code></dt>
<dd><p>Fetches all the outstanding requests, along with their IDs from indexDB
NB: getOutstandRequests is a simplified public wrapper for this function, which doesn&#39;t expose the internal requestids</p>
</dd>
<dt><a href="#getOutstandingRequests">getOutstandingRequests()</a> ⇒ <code>Array.&lt;Request&gt;</code></dt>
<dd><p>Fetches all the outstanding requests from indexDB</p>
</dd>
<dt><a href="#syncRequests">syncRequests()</a></dt>
<dd><p>Starts off an asynchronous function to sync up any outstanding requests with the server
Ensures there&#39;s only one running at a time to avoid race conditions</p>
</dd>
<dt><a href="#attemptOutstandingRequests">attemptOutstandingRequests()</a> ⇒ <code>Promise</code></dt>
<dd><p>Attempts to fetch an outstanding requests, and if successful remove them from the queue.
Stops after the first failure and doesn&#39;t attempt any subsequent requests in the queue.
NB: Calling this function whilst a previous invocation hasn&#39;t completed yet, may cause a race condition.  Use the <code>syncRequests</code> function to avoid this.</p>
</dd>
</dl>

<a name="queueAndAttemptRequest"></a>

## queueAndAttemptRequest(request) ⇒ <code>Promise</code>
Stores a request in the queue and then attempts to send it to the server

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | A Request object from the Fetch API, which isn't unusable |

<a name="queueRequest"></a>

## queueRequest(request) ⇒ <code>Promise.&lt;number&gt;</code>
Stores a request object in indexDB

**Kind**: global function  
**Returns**: <code>Promise.&lt;number&gt;</code> - A promise which resolves with a unique requestid when succesfully stored (or rejects on failure)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Request</code> | A Request object from the Fetch API |

<a name="attemptRequest"></a>

## attemptRequest(requestid, request) ⇒ <code>Promise.&lt;Response&gt;</code>
Attempts to fetch a request from the queue.  If successful, the request is removed from the queue.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Response&gt;</code> - A promise which resolves with the requests response following removal from the queue (or rejects on failure)  

| Param | Type | Description |
| --- | --- | --- |
| requestid | <code>number</code> | The unique ID for this request stored in indexDB |
| request | <code>Request</code> | A Request object from the Fetch API |

<a name="removeFromQueue"></a>

## removeFromQueue(requestid) ⇒ <code>Promise</code>
Removes a request from the queue

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise which resolves when succesfully removed (or rejects on failure)  

| Param | Type | Description |
| --- | --- | --- |
| requestid | <code>number</code> | The unique ID for the request to remove from indexDB+ |

<a name="getOutstandingRequestsAndIds"></a>

## getOutstandingRequestsAndIds() ⇒ <code>Array.&lt;{id: number, request: Request}&gt;</code>
Fetches all the outstanding requests, along with their IDs from indexDB
NB: getOutstandRequests is a simplified public wrapper for this function, which doesn't expose the internal requestids

**Kind**: global function  
**Returns**: <code>Array.&lt;{id: number, request: Request}&gt;</code> - An array containing requests and their associated requestids  
<a name="getOutstandingRequests"></a>

## getOutstandingRequests() ⇒ <code>Array.&lt;Request&gt;</code>
Fetches all the outstanding requests from indexDB

**Kind**: global function  
**Returns**: <code>Array.&lt;Request&gt;</code> - An array containing Fetch API Request objects  
<a name="syncRequests"></a>

## syncRequests()
Starts off an asynchronous function to sync up any outstanding requests with the server
Ensures there's only one running at a time to avoid race conditions

**Kind**: global function  
<a name="attemptOutstandingRequests"></a>

## attemptOutstandingRequests() ⇒ <code>Promise</code>
Attempts to fetch an outstanding requests, and if successful remove them from the queue.
Stops after the first failure and doesn't attempt any subsequent requests in the queue.
NB: Calling this function whilst a previous invocation hasn't completed yet, may cause a race condition.  Use the `syncRequests` function to avoid this.

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise which resolves when all requests have been succesfully removed from the queue, or rejects after encountering the first failure  
