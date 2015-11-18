/*
 * app에 뷰 처리 함수들을 추가합니다.
 */
function injectViewFuncs(app) {

	var pages = document.querySelector('iron-pages');
	var savedScrollY = 0;
	
	app.view = function(data) {
		app.currentData = data;

		savedScrollY = window.pageYOffset;
		window.scrollTo(0, savedScrollY);

		pages.selected = 1;
		
		app.enterRoom(data.id);
	};

	app.goView = function(e) {

		app.videos.forEach(function(data) {
			if (data.id === e.currentTarget.dataId) {
				app.view(data);
			}
		});
	};

	app.back = function() {
		pages.selected = 0;
		window.scrollTo(0, savedScrollY);
		app.currentData = undefined;
		
		app.exitRoom();
	};

	app.checkSearchKey = function(e) {
		if (e.keyCode === 13) {
			app.search();
		}
	};

	app.search = function() {

		app.videos = [];

		if (app.searchQuery === '') {

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
								thumbnail : itemInfo.snippet.thumbnails.medium.url
							});
						}
					});
				}
			}).catch(function(err) {
				// An error occured parsing Json
			});
		} else {
			fetch('https://www.googleapis.com/youtube/v3/search?q=' + app.searchQuery + '&key=' + Secure.youtubeKey + '&part=snippet&maxResults=10', {
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
								id : itemInfo.id.videoId,
								title : itemInfo.snippet.title.length > 48 ? itemInfo.snippet.title.substring(0, 46) + '...' : itemInfo.snippet.title,
								description : itemInfo.snippet.description,
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
}
