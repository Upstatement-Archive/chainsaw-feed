var inkwellShare;

;(function($){

	$(window).load(function(){
		inkwellShare = new InkwellShare();
	});

	function InkwellShare(){
		this.bindHandlers();
	}

	InkwellShare.prototype.bindHandlers = function(){
		$('a[data-service="email"]').on('click', this.onShareMailClick);
	};

	InkwellShare.prototype.onShareMailClick = function(e){
		var pid = $('#pid').val();
		if (pid){
			inkwellShare.registerShare(pid, 'email');
		}
	};

	InkwellShare.prototype.registerShare = function(pid, service){
		var data = {pid:pid, service:service, action:'count_share'};
		$.post(ajaxurl, data, function(response){
			console.log(response);
		});
	};

})(jQuery);

var inkwellShareFBLike;

;(function($){

	$(document).ready(function(){
		inkwellShareFBLike = new InkwellShareFBLike();
	});

	function InkwellShareFBLike(){
		this.loadScript();
		this.bindHandlers();
	}

	InkwellShareFBLike.prototype.bindHandlers = function(){
		$('[href="#like"]').on('click', this.onLike);
	};

	InkwellShareFBLike.prototype.onLike = function(){
		FB.getLoginStatus(function(response) {
			if (response.status == 'connected'){
				var uid = response.authResponse.userID;
				var token = response.authResponse.accessToken;
				console.log(response);
				inkwellShareFBLike.like(uid, token);
			} else {
				FB.login(inkwellShareFBLike.onLike, {scope:'publish_actions, publish_stream'});
			}
		});
		return false;
	};

	InkwellShareFBLike.prototype.like = function(uid, token){
		var data = {'access_token':token, 'object':window.location.href};
		FB.api('me/og.likes', 'post', data, function(resp){
			console.log(resp);
		});
	};

	InkwellShareFBLike.prototype.onLikeSuccess = function(response){
		console.log(response);
	};

	InkwellShareFBLike.prototype.setLoginStatus = function(){

	};

	InkwellShareFBLike.prototype.onScriptLoad = function(){
		window.fbAsyncInit = function() {
			FB.init({
				appId: '609529172391698',
				channelUrl: '//yourapp.com/channel.html'
			});
			$('#loginbutton,#feedbutton').removeAttr('disabled');
			FB.getLoginStatus(inkwellShareFBLike.setLoginStatus);
		};
	};

	InkwellShareFBLike.prototype.loadScript = function(){
		var THIS = this;
		$.ajaxSetup({ cache: true });
		$.getScript('//connect.facebook.net/en_UK/all.js', THIS.onScriptLoad);
	};

})(jQuery);
