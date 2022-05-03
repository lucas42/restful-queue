# restful-queue
A queue for service workers which send requests to a restful API

## Basic usage

Add the following to your service worker to use the queue for all non-GET requests:

```
import { queueAndAttemptRequest } from 'restful-queue';

self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET') {
		event.respondWith(queueAndAttemptRequest(event.request));
	} else {
		... // Handle GET requests here, eg return them from cache
	}
});
```

## See also

* [API documentation](https://github.com/lucas42/restful-queue/tree/main/docs/API.md)