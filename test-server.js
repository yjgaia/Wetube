// load UJS.
require('./UJS-COMMON.js');
require('./UJS-NODE.js');

RUN(function() {
	'use strict';

	var
	// port
	port = 8222;

	INIT_OBJECTS();

	// don't resource caching.
	CONFIG.isDevMode = true;

	RESOURCE_SERVER({
		port : port,
		rootPath : __dirname + '/assets/www'
	}, function(requestInfo, response, onDisconnected, replaceRootPath, next) {

		var
		// uri
		uri = requestInfo.uri;

		if (uri === '') {
			requestInfo.uri = 'index.html';
		}
	});

	console.log('UJS test server running. - http://localhost:' + port);
});
