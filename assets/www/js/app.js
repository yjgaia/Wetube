(function(document) {

	var app;

	window.addEventListener('WebComponentsReady', function() {

		app = document.querySelector('#app');

		injectUserFuncs(app);
		injectViewFuncs(app);
	});
	
	if (location.protocol === 'file:') {
		document.addEventListener('deviceready', function() {
			document.addEventListener('backbutton', function() {
				if (app !== undefined) {
					var pages = document.querySelector('iron-pages');
					if (pages.selected === 0) {
						if (confirm('앱을 종료하시겠습니까?') === true) {
							navigator.app.exitApp();
						}
					} else {
						pages.selected -= 1;
					}
				}
			}, false);
		}, false);
	}

})(document);
