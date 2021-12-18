---
title: Learning about NodeJS Streams by building an HTTP server from scratch
description: In this article, we'll learn to use NodeJS Readable, Writable, and Duplex Streams to create a rudimentary HTTP server.
cover: /blog-images/learn-nodejs-streams-http/http-banner.jpg
date: "2018-03-05"
---

## Introduction
Articles exploring new technologies abound.  In this post, I want to go back to the basics and build a simple web server from scratch with NodeJS. In doing so, we will review the structure of HTTP requests and responses and get an introduction to [Node's `Stream` API](https://nodejs.org/api/stream.html).

First, we will quickly review [Node's built-in `http` module](https://nodejs.org/api/http.html). Following that, we will study the general structure of an HTTP request and response. Then, using Node's built-in `net` module, we will create a low-level TCP server and try to make a usable web server out of it.

It goes without saying that all of the code in this article has no business in any production app. It is only provided for educational value.

With that out of the way, let's get started!

## A quick look at Node's built-in `http` module
NodeJS comes with a simple HTTP server built in. This server allows us to listen on an arbitrary port and provide a callback function that will be invoked on every incoming request. 

The callback will receive two arguments: a [Request object](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_incomingmessage) and a [Response object](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_serverresponse). The Request object will be filled with useful properties about the request, and the Response object will be used to send a response to the client.

The "hello world" example using Node's `http` server:

```js
const http = require('http');
const server = http.createServer();
server.on('request', (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  res.setHeader('Content-Type','text/plain');
  res.end('Hello World!');
});
server.listen(3000);
```

This will start a web server listening on port 3000. When a request comes in, a message will be logged in the console with the current date followed by the request's method and URL. 

This data comes from the parameter `req`, which is the Request object created by Node. This Request object also has a property called `.socket`, which is the lower-level TCP socket. 

Later on, we will be creating a TCP server and getting direct access to this socket for each new connection, then using it to make our web server.

In the code above, the fact that we have access to a nice object with `req.method` and `req.url` means that someone other than us went through the trouble of parsing the text of the request and making it into a nice object. 

In the next section, we'll look at the structure of an HTTP request to get hints on how to parse it.

## Dissecting HTTP
Here is a sample HTTP request:

```
POST /posts/42/comments HTTP/1.1\r\n
Host: www.my-api.com\r\n
Accept: application/json\r\n
Authorization: Bearer N2E5NTU2MzQ5MGQ4N2UzNjIxOTY2ZDU1M2YwNjA3OGFjYjgyMjU4NQ\r\n
Accept-Encoding: gzip, deflate, br\r\n
Content-Type: application/json\r\n
Content-Length: 28\r\n
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:58.0)\r\n
\r\n
{"text":"this is a comment"}
```

A few observations:
* Each line is delimited by `\r\n`.
* The first line is called the "request line." It's composed of three space-separated tokens:
  * The request method, `POST`. The standard methods are defined in [section 9 of the HTTP/1.1 specification](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html).
  * The request URI, `/posts/42/comments`
  * The protocol version, `HTTP/1.1`
* Each following line is called a request header. It's composed of a field and its value, separated by a `:`. The standard headers are defined in [section 14 of the HTTP/1.1 specification](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html).
* There's a line with only `\r\n`. This line indicates the end of the request header. Anything after that is the request body.
* For this request, the body is a JSON document. This matches the `Content-Type` header. The JSON document is 28 bytes long, which matches the `Content-Length` header.

And this is a sample HTTP response:

```
HTTP/1.1 200 OK\r\n
Server: nginx/1.9.4\r\n
Date: Fri, 20 Apr 2017 16:19:42 GMT\r\n
Content-Type: application/json\r\n
Content-Length: 141\r\n
\r\n
{
  "id": "8fh924b42o",
  "text": "this is a comment",
  "createdAt": "2017-04-20T16:19:42.840Z",
  "updatedAt": "2017-04-20T16:19:42.840Z"
}
```

Again, a few observations:
* Like the request, each line is delimited by `\r\n`.
* The first line is called the "status line." It's composed of:
  * The HTTP version, `HTTP/1.1.1`
  * An [HTTP status code](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10), `200`
  * A [reason phrase](https://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6), `OK`
* Each line after that is a response header, with the same structure as request headers.
* There's a line with only `\r\n`. This indicates the end of the response header and the start of the response body.
* The body is a 141-byte JSON document. This matches the values in the response headers.

In the next section, we will create a TCP server and be able to observe an HTTP request coming in, chunk by chunk. We will see how to read and parse the request, then send a response using Streams.

## Receiving and parsing an HTTP request
NodeJS provides the built-in `net` module to create a streaming TCP server. "Streaming" refers to the fact that the server can send and receive data over time, using [Node's `Stream` API](https://nodejs.org/api/stream.html).

Where the `http` server emitted a `request` event with Request and Response objects, the TCP server will emit a `connection` event with a Socket object. Socket objects are [Duplex Streams](https://nodejs.org/api/stream.html#stream_class_stream_duplex). In short, this means that they can both be read from and written to.

If we make an HTTP request to our TCP server, reading from the Socket will give us the text of the request. There are two ways to read from a readable stream: subscribing to its `data` event, or calling its `.read()` method. Let's look at the first one:

```js
const net = require('net');
const server = net.createServer();
server.on('connection', handleConnection);
server.listen(3000);

function handleConnection(socket) {
  socket.on('data', (chunk) => {
    console.log('Received chunk:\n', chunk.toString());
  });
  socket.write('HTTP/1.1 200 OK\r\nServer: my-web-server\r\nContent-Length: 0\r\n\r\n');
}
```

Put this code in a file called `server.js` and execute it from your command line with `node server.js`. In another terminal, use cURL to make a simple request to your server:

```
curl -v localhost:3000/some/url
```

You should see a verbose output from cURL, showing you the request and response headers. In the Node terminal, you should see something like this:

```
Received chunk:
GET /some/url HTTP/1.1
Host: localhost:3000
User-Agent: curl/7.54.0
Accept: */*

```

Let's make a `POST` request with some data:

```
curl -v -XPOST -d'hello=world' localhost:3000/some/url
```

This should give you the following output in your Node terminal:

```
Received chunk:
POST /some/url HTTP/1.1
Host: localhost:3000
User-Agent: curl/7.54.0
Accept: */*
Content-Length: 11
Content-Type: application/x-www-form-urlencoded

hello=world
```

If you were to send a longer request body, you would receive it in multiple chunks. But **a web server doesn't always need to process a request's body**. 

Often, the header part of a request is sufficient to start processing the request. Since we are writing a generic web server, we have to find a way to stop receiving request data from the socket as soon as we reach the string `\r\n\r\n` in the input. 

This is more easily done by using the `.read()` method of the socket, since we can control when to stop pulling data from the stream. Here's some code to do this:

```js
const net = require('net');
const server = net.createServer();
server.on('connection', handleConnection);
server.listen(3000);

function handleConnection(socket) {
	// Subscribe to the readable event once so we can start calling .read()
	socket.once('readable', function() {
		// Set up a buffer to hold the incoming data
		let reqBuffer = new Buffer('');
		// Set up a temporary buffer to read in chunks
		let buf;
		let reqHeader;
		while(true) {
			// Read data from the socket
			buf = socket.read();
			// Stop if there's no more data
			if (buf === null) break;

			// Concatenate existing request buffer with new data
			reqBuffer = Buffer.concat([reqBuffer, buf]);

			// Check if we've reached \r\n\r\n, indicating end of header
			let marker = reqBuffer.indexOf('\r\n\r\n')
			if (marker !== -1) {
				// If we reached \r\n\r\n, there could be data after it. Take note.
				let remaining = reqBuffer.slice(marker + 4);
				// The header is everything we read, up to and not including \r\n\r\n
				reqHeader = reqBuffer.slice(0, marker).toString();
				// This pushes the extra data we read back to the socket's readable stream
				socket.unshift(remaining);
				break;
			}
		}
		console.log(`Request header:\n${reqHeader}`);

		// At this point, we've stopped reading from the socket and have the header as a string
		// If we wanted to read the whole request body, we would do this:

		reqBuffer = new Buffer('');
		while((buf = socket.read()) !== null) {
			reqBuffer = Buffer.concat([reqBuffer, buf]);
		}
		let reqBody = reqBuffer.toString();
		console.log(`Request body:\n${reqBody}`);

		// Send a generic response
		socket.end('HTTP/1.1 200 OK\r\nServer: my-custom-server\r\nContent-Length: 0\r\n\r\n');
	});
}
```

The code is a bit longer because we need some logic to decide when to stop reading from the stream. This allows us to separate the header from the body and let the developer who will use our web server determine what to do with the body, if anything.

The key part here is the `socket.unshift` line, which "puts back" any extra data we read back into the readable stream. This will allow us to pass this socket along to our user in case they need to read from it.

And here's the full code of our basic web server, putting together everything we have seen so far. Our server exposes a function `createWebServer(requestHandler)`. This function accepts a handler of the form `(req, res) => void`, just like Node's basic web server. The comments in the code explain what each step is doing.

```js
const net = require('net');

function createWebServer(requestHandler) {
	const server = net.createServer();
	server.on('connection', handleConnection);
	
	function handleConnection(socket) {
		// Subscribe to the readable event once so we can start calling .read()
		socket.once('readable', function() {
			// Set up a buffer to hold the incoming data
			let reqBuffer = new Buffer('');
			// Set up a temporary buffer to read in chunks
			let buf;
			let reqHeader;
			while(true) {
				// Read data from the socket
				buf = socket.read();
				// Stop if there's no more data
				if (buf === null) break;
	
				// Concatenate existing request buffer with new data
				reqBuffer = Buffer.concat([reqBuffer, buf]);
	
				// Check if we've reached \r\n\r\n, indicating end of header
				let marker = reqBuffer.indexOf('\r\n\r\n')
				if (marker !== -1) {
					// If we reached \r\n\r\n, there could be data after it. Take note.
					let remaining = reqBuffer.slice(marker + 4);
					// The header is everything we read, up to and not including \r\n\r\n
					reqHeader = reqBuffer.slice(0, marker).toString();
					// This pushes the extra data we read back to the socket's readable stream
					socket.unshift(remaining);
					break;
				}
			}
			
			/* Request-related business */
			// Start parsing the header
			const reqHeaders = reqHeader.split('\r\n');
			// First line is special
			const reqLine = reqHeaders.shift().split(' ');
			// Further lines are one header per line, build an object out of it.
			const headers = reqHeaders.reduce((acc, currentHeader) => {
				const [key, value] = currentHeader.split(':');
				return {
					...acc,
					[key.trim().toLowerCase()]: value.trim()
				};
			}, {});
			// This object will be sent to the handleRequest callback.
			const request = {
				method: reqLine[0],
				url: reqLine[1],
				httpVersion: reqLine[2].split('/')[1],
				headers,
                // The user of this web server can directly read from the socket to get the request body
				socket
			};

			/* Response-related business */
			// Initial values
			let status = 200, statusText = 'OK', headersSent = false, isChunked = false;
			const responseHeaders = {
				server: 'my-custom-server'
			};
			function setHeader(key, value) {
				responseHeaders[key.toLowerCase()] = value;
			}
			function sendHeaders() {
				// Only do this once :)
				if (!headersSent) {
					headersSent = true;
					// Add the date header
					setHeader('date', new Date().toGMTString());
					// Send the status line
					socket.write(`HTTP/1.1 ${status} ${statusText}\r\n`);
					// Send each following header
					Object.keys(responseHeaders).forEach(headerKey => {
						socket.write(`${headerKey}: ${responseHeaders[headerKey]}\r\n`);
					});
					// Add the final \r\n that delimits the response headers from body
					socket.write('\r\n');
				}
			}
			const response = {
				write(chunk) {
					if (!headersSent) {
						// If there's no content-length header, then specify Transfer-Encoding chunked
						if (!responseHeaders['content-length']) {
							isChunked = true;
							setHeader('transfer-encoding', 'chunked');
						}
						sendHeaders();
					}
					if (isChunked) {
						const size = chunk.length.toString(16);
						socket.write(`${size}\r\n`);
						socket.write(chunk);
						socket.write('\r\n');
					}
					else {
						socket.write(chunk);
					}
				},
				end(chunk) {
					if (!headersSent) {
						// We know the full length of the response, let's set it
						if (!responseHeaders['content-length']) {
							// Assume that chunk is a buffer, not a string!
							setHeader('content-length', chunk ? chunk.length : 0);
						}
						sendHeaders();
					}
					if (isChunked) {
						if (chunk) {
							const size = (chunk.length).toString(16);
							socket.write(`${size}\r\n`);
							socket.write(chunk);
							socket.write('\r\n');
						}
						socket.end('0\r\n\r\n');
					}
					else {
						socket.end(chunk);
					}
				},
				setHeader,
				setStatus(newStatus, newStatusText) { status = newStatus, statusText = newStatusText },
				// Convenience method to send JSON through server
				json(data) {
					if (headersSent) {
						throw new Error('Headers sent, cannot proceed to send JSON');
					}
					const json = new Buffer(JSON.stringify(data));
					setHeader('content-type', 'application/json; charset=utf-8');
					setHeader('content-length', json.length);
					sendHeaders();
					socket.end(json);
				}
			};
			
			// Send the request to the handler!
			requestHandler(request, response);
		});
	}

	return {
		listen: (port) => server.listen(port)
	};
}

const webServer = createWebServer((req, res) => {
	// This is the as our original code with the http module :)
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	res.setHeader('Content-Type','text/plain');
	res.end('Hello World!');
});

webServer.listen(3000);
```

As mentioned in the beginning of this post, this server code has no business being used in production. Its only purpose is to learn more about streams and buffers.

Most of the code in there should be self explanatory. We are parsing the request and sending the response using the rules we learned in the previous section. 

The only new bit is the `Transfer-Encoding: chunked`, which is necessary when we don't know in advance the length of the response. You can [learn more about chunked transfer encoding on Wikipedia](https://en.wikipedia.org/wiki/Chunked_transfer_encoding).

## Conclusion
By using some lower-level building blocks such as `net`, `Stream`, and `Buffer`, we were able to create a rudimentary HTTP server based on a TCP server and some parsing logic. In the process, we learned a bit about how HTTP requests and responses work, as well as the basics of readable and writable streams and buffers.