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

		firebase.child('users').child(userInfo.uid).set({
			provider : userInfo.provider,
			name : userInfo.google.displayName,
			email : userInfo.google.email
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
	
	var findAddUsers = function() {
		
		firebase.child('add-users').child(userInfo.uid).once('value', function(snap) {
			var users = snap.val();
			app.addUsers = [];
			if (users !== null) {
				for (var id in users) {
					app.push('addUsers', {
						id : id,
						name : users[id]
					});
				}
			}
		});
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
						firebase.child('add-users').child(userInfo.uid).child(id).set(users[id].name);
						findAddUsers();
					}
				}
			});
		}
	};

	app.inviteUser = function() {
		document.querySelector('#users-dialog').open();
		findAddUsers();
	};

}
