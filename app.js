(function(document) {

	var ref = new Firebase('https://wetubeapp.firebaseio.com');
	var savedScrollY = 0;

	window.addEventListener('WebComponentsReady', function() {
		var app = document.querySelector('#app');
		var pages = document.querySelector('iron-pages');
		var userInfo = ref.getAuth();

		var arr = [];

		[1, 2, 3].forEach(function(i) {

			arr.push({
				id : 'id-' + i,
				title : '영상 제목 ' + i,
				description : '영상 설명 ' + i
			});
		});

		app.videos = arr;

		var list = document.querySelector('#list');
		list.style.display = 'none';

		// 로그인 완료 시
		var logined = function() {
			list.style.display = 'block';
			app.listSelected = 0;
		};

		if (userInfo === null) {
			document.querySelector('#login').open();
		} else {
			logined();
		}

		app.googleLoggedIn = function() {

			if (userInfo === null) {
				userInfo = app.userInfo;

				document.querySelector('#login firebase-google-login-button').style.display = 'none';
				document.querySelector('#login').close();

				logined();
			}
		};

		app.logout = function() {

			userInfo = null;
			firebaseLogin.logout();

			list.style.display = 'none';
			document.querySelector('#login firebase-google-login-button').style.display = 'block';
			document.querySelector('#login').open();
		};

		app.view = function(e) {
			
			arr.forEach(function(data) {
				if (data.id === e.currentTarget.dataId) {
					app.currentData = data;
				}
			});
			
			savedScrollY = window.pageYOffset;
			window.scrollTo(0, savedScrollY);
			
			pages.selected = 1;
		};

		app.back = function() {
			pages.selected = 0;
			window.scrollTo(0, savedScrollY);
		};
		
		app.inviteUser = function() {
			document.querySelector('#users-dialog').open();
		};
	});
})(document); 