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
		
		if (app.youtubePlayer !== undefined) {
			app.youtubePlayer.destroy();
			app.youtubePlayer = undefined;
		}
		
		// #video에 플레이어 삽입
		app.youtubePlayer = new YT.Player('video', {
			height : '390',
			width : '640',
			videoId : app.currentData.id,
			events : {
				'onReady' : function() {
					app.youtubePlayer.lastTime = 0;
					
					app.youtubePlayer.checkSeekInterval = setInterval(function() {
						if (app.youtubePlayer.getCurrentTime !== undefined) {
							var currentTime = app.youtubePlayer.getCurrentTime();
							if (app.youtubePlayer.lastTime > 0 && Math.abs(currentTime - app.youtubePlayer.lastTime) > 1) {
								app.sendChat({
									isMoved : true,
									currentTime : currentTime
								});
							}
							app.youtubePlayer.lastTime = currentTime;
						}
					}, 500);
				},
				'onStateChange' : function(e) {
					
					// 내가 조작한 경우에만 전송한다.
					if (app.youtubePlayer.isNotMe !== true) {
						
						// 재생을 시작하면 현재 타임라인 정보와 함께 전송한다.
						if (app.youtubePlayer.isPlaying !== true && e.data === YT.PlayerState.PLAYING) {
							app.sendChat({
								isStarted : true,
								currentTime : app.youtubePlayer.getCurrentTime()
							});
						}
						
						// 재생을 멈추면 전송한다.
						else if (app.youtubePlayer.isPlaying === true && e.data === YT.PlayerState.PAUSED) {
							app.sendChat({
								isPaused : true
							});
						}
					}
					
					if (e.data === YT.PlayerState.PLAYING) {
						app.youtubePlayer.isPlaying = true;
						app.youtubePlayer.isNotMe = false;
					} else if (e.data === YT.PlayerState.PAUSED) {
						app.youtubePlayer.isPlaying = false;
						app.youtubePlayer.isNotMe = false;
					} else if (e.data === YT.PlayerState.ENDED) {
						app.youtubePlayer.isPlaying = false;
						app.youtubePlayer.isNotMe = false;
					}
				}
			}
		});
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
		
		if (app.youtubePlayer !== undefined) {
			clearInterval(app.youtubePlayer.checkSeekInterval);
			app.youtubePlayer.destroy();
			app.youtubePlayer = undefined;
		}
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
					'Content-type' : 'application/json'
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
								description : itemInfo.snippet.description.substring(0, 175),
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
					'Content-type' : 'application/json'
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
	
	window.onresize = function() {
		
		try {
			
			document.querySelector('#chat-list').style.height =
				(document.documentElement.clientHeight - 60 -
				document.querySelector('#video').offsetHeight -
				document.querySelector('#chat-form').offsetHeight) + 'px';
			
			document.querySelector('#chat-list').scrollTop = 999999;
			
		} catch(e) {
			// ignore.
		}
	};
}

