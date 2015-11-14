(function(document) {

	var ref = new Firebase('https://wetubeapp.firebaseio.com');
	var savedScrollY = 0;

	window.addEventListener('WebComponentsReady', function() {
		var app = document.querySelector('#app');
		var pages = document.querySelector('iron-pages');
		var userInfo = ref.getAuth();

		app.videos = [];

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

			// 유저 정보가 없으면
			if (userInfo === null) {

				// 받아온 유저 정보를 대입한다.
				userInfo = app.userInfo;

				// 로그인 버튼을 숨기기, 로그인 창을 닫는다.
				document.querySelector('#login firebase-google-login-button').style.display = 'none';
				document.querySelector('#login').close();

				// 로그인 된 이후 처리
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

			app.videos.forEach(function(data) {
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

		app.search = function(searchText) {

			if (searchText === undefined || searchText === '') {

				fetch('https://www.googleapis.com/youtube/v3/videos?chart=mostPopular&key=' + Secure.youtubeKey + '&part=snippet&maxResults=10', {
					headers : {
						"Content-type" : "application/json"
					}
				}).then(function(response) {
					return response.json();
					// This returns a promise
				}).then(function(responseObject) {
					if (responseObject.error === undefined) {
						responseObject.items.forEach(function(itemInfo, i) {
							if (itemInfo.kind === 'youtube#video') {
								app.push('videos', {
									id : itemInfo.id,
									title : itemInfo.snippet.title.length > 48 ? itemInfo.snippet.title.substring(0, 46) + '...' : itemInfo.snippet.title,
									description : itemInfo.snippet.description,
									channelTitle : itemInfo.snippet.channelTitle,
									handle : itemInfo.id,
									thumbnail : itemInfo.snippet.thumbnails.medium.url
								});
							}
						});
					}
				}).catch(function(err) {
					// An error occured parsing Json
				});
			} else {
				fetch('https://www.googleapis.com/youtube/v3/search?q=' + searchText + '&key=' + Secure.youtubeKey + '&part=snippet&maxResults=10', {
					headers : {
						"Content-type" : "application/json"
					}
				}).then(function(response) {
					return response.json();
					// This returns a promise
				}).then(function(responseObject) {
					if (responseObject.error === undefined) {
						responseObject.items.forEach(function(itemInfo, i) {
							if (itemInfo.id.kind === 'youtube#video') {
								app.push('videos', {
									id : itemInfo.id,
									title : itemInfo.snippet.title.length > 48 ? itemInfo.snippet.title.substring(0, 46) + '...' : itemInfo.snippet.title,
									description : itemInfo.snippet.description,
									channelTitle : itemInfo.snippet.channelTitle,
									handle : itemInfo.id.videoId,
									thumbnail : itemInfo.snippet.thumbnails.medium.url
								});
							}
						});
					}
				}).catch(function(err) {
					// An error occured parsing Json
				});
			}
		};
		
		app.search();
	});
})(document);
