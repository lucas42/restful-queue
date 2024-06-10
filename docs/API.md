## Functions

<dl>
<dt><a href="#queueAndAttemptRequest">queueAndAttemptRequest(request)</a> ⇒ <code>Promise.&lt;Response&gt;</code></dt>
<dd><p>Stores a request in the queue and then attempts to send it to the server.
If there are existing requests in the queue, those will be attempted first to ensure they are sent in the intended order.
Succesful requests are removed from the queue.  The first unsuccessful request blocks subsequent requests.
Existing PUT and DELETE requests in the queue for the same URL will be dropped if the method is PUT or DELETE.</p>
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
