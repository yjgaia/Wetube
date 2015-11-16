(function(document) {
	window.addEventListener('WebComponentsReady', function() {

		var app = document.querySelector('#app');

		injectUserFuncs(app);
		injectViewFuncs(app);
	});
})(document);
