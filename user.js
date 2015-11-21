/*
 * app에 유저 관련 함수들을 추가합니다.
 */
function injectUserFuncs(app) {

	var firebase = new Firebase('https://wetubeapp.firebaseio.com');
	var userInfo = firebase.getAuth();

	var list = document.querySelector('#list');
	list.style.display = 'none';

	// 로그인 완료 시 실행하는 함수
	var logined = function() {
		list.style.display = 'block';
		app.listSelected = 0;
		
		// 유저 정보 저장
		firebase.child('users').child(userInfo.uid).set({
			provider : userInfo.provider,
			name : userInfo.google.displayName,
			email : userInfo.google.email,
			profileImageURL : userInfo.google.profileImageURL
		});
		
		// 유저 목록 추가되었을 시
		app.addUsers = [];
		firebase.child('add-users').child(userInfo.uid).on('child_added', function(snap) {
			var user = snap.val();
			app.push('addUsers', {
				id : snap.key(),
				name : user.name,
				profileImageURL : user.profileImageURL
			});
		});
		firebase.child('add-users').child(userInfo.uid).on('child_removed', function(snap) {
			var key = snap.key();
			app.addUsers.forEach(function(user, index) {
				if (user.id == key) {
					app.splice('addUsers', index, 1);
				}
			});
		});
		
		// 누군가 나를 초대할 때
		firebase.child('invite').child(userInfo.uid).on('child_added', function(snap) {
			var inviteInfo = snap.val();
			var inviteUserId = snap.key();
			firebase.child('users').child(inviteUserId).once('value', function(snap) {
				var inviteUserInfo = snap.val();
				if (inviteUserInfo !== null
					&& userInfo.uid === inviteUserInfo.wantUserId
					&& inviteInfo.videoId === inviteUserInfo.nowVideoId) {
					
					app.inviteUserName = inviteUserInfo.name;
					app.inviteUserId = inviteUserId;
					app.inviteVideoData = {
						id : inviteInfo.videoId,
						title : inviteInfo.videoTitle,
						description : inviteInfo.videoDescription
					};
					document.querySelector('#invite-user-toast').show();
				} else {
					firebase.child('invite').child(userInfo.uid).child(inviteUserId).remove();
				}
			});
		});
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

	app.checkAddUserKey = function(e) {
		if (e.keyCode === 13) {
			app.addUser();
		}
	};

	app.addUser = function() {
		
		var email = app.addUserEmail.trim();

		if (userInfo.google.email === email) {
			alert('본인은 추가할 수 없습니다.');
		} else {
			firebase.child('users')
			.orderByChild('email')
			.startAt(email)
			.endAt(email)
			.once('value', function(snap) {
				var users = snap.val();
				if (users === null) {
					alert('해당 이메일에 해당하는 유저가 없습니다.');
				} else {
					for (var id in users) {
						// 드디어 유저 정보를 찾았다.
						firebase.child('add-users').child(userInfo.uid).child(id).set({
							name : users[id].name,
							profileImageURL : users[id].profileImageURL
						});
						app.addUserEmail = '';
						app.addUserName = users[id].name;
						document.querySelector('#add-user-toast').show();
					}
				}
			});
		}
	};

	app.openInviteUser = function() {
		document.querySelector('#users-dialog').open();
	};
	
	app.removeUser = function(e) {
		firebase.child('add-users').child(userInfo.uid).child(e.currentTarget.dataId).remove();
	};
	
	var wantUserId;
	var inviteRoomRef;
	var onRemoveInviteRoom;
	var chatRef;
	var onChat;
	var sendLiveInterval;
	var checkLiveInterval;
	
	clearRoom = function() {
		
		if (inviteRoomRef !== undefined) {
			chatRef.off('child_added', onChat);
			inviteRoomRef.off('child_removed', onRemoveInviteRoom);
			inviteRoomRef.remove();
			inviteRoomRef = undefined;
			chatRef = undefined;
			onChat = undefined;
		}
		
		wantUserId = undefined;
		
		if (sendLiveInterval !== undefined) {
			clearInterval(sendLiveInterval);
			sendLiveInterval = undefined;
		}
		
		if (checkLiveInterval !== undefined) {
			clearInterval(checkLiveInterval);
			checkLiveInterval = undefined;
		}
	};
	
	startChat = function(inviteUserId, targetUserId, opponentUserName) {
		
		// 유저 초대 화면을 숨기고, 채팅 화면을 연다.
		document.querySelector('#invite-user-form').hidden = true;
		document.querySelector('#chat-list').hidden = false;
		document.querySelector('#chat-form').hidden = false;
		
		app.chatInfos = [];
		inviteRoomRef = firebase.child('invite').child(targetUserId);
		
		// 상대가 방을 나가 방이 파기되었을 때
		onRemoveInviteRoom = inviteRoomRef.on('child_removed', function(snap) {
			
			if (snap.key() === inviteUserId) {
				
				app.push('chatInfos', {
					isLeft : true,
					userName : opponentUserName
				});
				
				clearRoom();
				
				document.querySelector('#chat-form').hidden = true;
				
				setTimeout(function() {
					document.querySelector('#invite-user-form').hidden = false;
					document.querySelector('#chat-list').hidden = true;
				}, 3000);
			}
		});
		
		chatRef = inviteRoomRef.child(inviteUserId).child('chats');
		
		var isConnected = false;
		var isLive = false;
		
		// 메시지가 왔을 때
		onChat = chatRef.on('child_added', function(snap) {
			
			var info = snap.val();
			
			if (info.userId !== userInfo.uid) {
				
				if (app.youtubePlayer.pauseVideo !== undefined && isConnected !== true) {
					app.youtubePlayer.pauseVideo();
				}
				
				isConnected = true;
				isLive = true;
				
				// 동영상을 재생했다고 전송받음
				if (info.isStarted === true) {
					app.youtubePlayer.isNotMe = true;
					if (app.youtubePlayer.seekTo !== undefined) {
						// 동영상 타임라인 이동
						app.youtubePlayer.seekTo(info.currentTime);
						app.youtubePlayer.playVideo();
					}
				}
				
				// 동영상을 멈추었다고 전송받음
				else if (info.isPaused === true) {
					app.youtubePlayer.isNotMe = true;
					if (app.youtubePlayer.pauseVideo !== undefined) {
						app.youtubePlayer.pauseVideo();
					}
				}
			}
			
			if (info.isLive !== true) {
				
				app.push('chatInfos', {
					isChat : info.isChat,
					isEntered : info.isEntered,
					isLeft : info.isLeft,
					isStarted : info.isStarted,
					isPaused : info.isPaused,
					isMoved : app.youtubePlayer.isPlaying,
					
					userId : info.userId,
					userName : info.userId === userInfo.uid ? (info.isChat === true ? '나' : userInfo.google.displayName) : opponentUserName,
					nameSpanClass : info.userId === userInfo.uid ? 'me' : 'other',
					message : info.message
				});
			}
		});
		
		// 3초마다 접속되어있는지 보냄
		sendLiveInterval = setInterval(function() {
			app.sendChat({
				isLive : true
			});
		}, 3000);
		
		// 5초마다 접속되어있는지 확인
		checkLiveInterval = setInterval(function() {
			if (isConnected === true && isLive !== true) {
				
				// 상대방이 나갔다고 판단
				app.push('chatInfos', {
					isLeft : true,
					userName : opponentUserName
				});
				
				clearRoom();
				
				document.querySelector('#chat-form').hidden = true;
				
				setTimeout(function() {
					document.querySelector('#invite-user-form').hidden = false;
					document.querySelector('#chat-list').hidden = true;
				}, 3000);
			}
			isLive = false;
		}, 5000);
	};
	
	app.sendChat = function(data) {
		
		data.userId = userInfo.uid;
		
		if (chatRef !== undefined) {
			chatRef.push(data);
		}
	};
	
	app.chat = function() {
		if (app.chatMessage !== '') {
			app.sendChat({
				isChat : true,
				message : app.chatMessage
			});
			app.chatMessage = '';
		}
	};

	app.checkChatKey = function(e) {
		if (e.keyCode === 13) {
			app.chat();
		}
	};
	
	// 유저 초대하기
	app.inviteUser = function(e) {
		if (userInfo.nowVideoId !== undefined && app.currentData !== undefined) {
			wantUserId = e.currentTarget.dataId;
			firebase.child('invite').child(wantUserId).child(userInfo.uid).set({
				videoId : userInfo.nowVideoId,
				videoTitle : app.currentData.title,
				videoDescription : app.currentData.description,
			});
			firebase.child('users').child(userInfo.uid).update({
				wantUserId : wantUserId
			});
			
			// 유저 창 닫기
			document.querySelector('#users-dialog').close();
			
			// 초대 완료 알림 출력
			app.invitedTargetUserName = e.currentTarget.dataName;
			document.querySelector('#invited-toast').show();
			
			// 채팅 시작
			startChat(userInfo.uid, wantUserId, app.invitedTargetUserName);
		}
	};
	
	// 초대 수락
	app.acceptInvite = function() {
		if (app.inviteVideoData !== undefined) {
			app.view(app.inviteVideoData);
			document.querySelector('#invite-user-toast').hide();
			
			startChat(app.inviteUserId, userInfo.uid, app.inviteUserName);
			
			app.sendChat({
				isEntered : true
			});
		}
	};
	
	// 초대 거절
	app.dismissInvite = function() {
		firebase.child('invite').child(userInfo.uid).child(app.inviteUserId).remove();
		
		delete app.inviteUserName;
		delete app.inviteUserId;
		delete app.inviteVideoData;
		document.querySelector('#invite-user-toast').hide();
	};
	
	// 비디오 방 접속
	app.enterRoom = function(videoId) {
		firebase.child('users').child(userInfo.uid).update({
			nowVideoId : videoId,
			wantUserId : null
		});
		userInfo.nowVideoId = videoId;
	};
	
	// 비디오 방 퇴장
	app.exitRoom = function() {
		
		firebase.child('users').child(userInfo.uid).update({
			nowVideoId : null,
			wantUserId : null
		});
		delete userInfo.nowVideoId;
		
		clearRoom();
		
		document.querySelector('#chat-form').hidden = true;
		document.querySelector('#invite-user-form').hidden = false;
		document.querySelector('#chat-list').hidden = true;
	};
}