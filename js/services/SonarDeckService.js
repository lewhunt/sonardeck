//  © 2016 Lew Hunt - SonarDeck - the free web app that filters your SoundCloud stream, likes and new music tracks

var sonardeckApp = angular.module('sonardeckApp');

sonardeckApp.service("SonarDeckService", function($http, $localStorage) {
		
	//sonardeck - localhost
	//this.client_id = '';
	//this.redirect_uri = "http://localhost:8080/callback.html";
	
	//sonardeck - www.sonardeck.com
	this.client_id = '3e30622b5930b0d24b43217f57e223fb';
	this.redirect_uri = "http://www.sonardeck.com/callback.html";	
	
	this.endPoint = {
		explore: "https://api.soundcloud.com/tracks",
		latest: "https://api.soundcloud.com/tracks",
		stream: "https://api.soundcloud.com/me/activities/tracks/affiliated",
		//stream: "https://api.soundcloud.com/e1/me/stream",
		likes: "https://api.soundcloud.com/me/favorites",
		playlists: "https://api.soundcloud.com/e1/me/playlist_likes"
	}
	
	this.nextUrl = {
		explore: null,
		latest: null,
		stream: null,
		likes: null,
		playlists: null
	};
	
	this.parameters = {
		limit: 80,
		linked_partitioning: 1,
		genres: null,
		client_id: this.client_id,
		oauth_token: null
	};

	
	this.initSC = function() {
	
		SC.initialize({
		  client_id: this.client_id,
		  redirect_uri: this.redirect_uri
		});
		
		this.loadToken();
		
	};
	
	this.saveToken = function(oauth_token) {
		$localStorage.oauth_token = oauth_token;
	};

	this.loadToken = function() {
		this.parameters.oauth_token = $localStorage.oauth_token;
		return this.parameters.oauth_token;
	};
	
	this.clearToken = function() {
		$localStorage.oauth_token = null;
	};
	
	
	
	this.getHttp = function(pageType) {

		var that = this;
		
		var nextUrl, paramsAdditional;
		
		nextUrl = this.nextUrl[pageType];
				
		//if (this.parameters.genres==null) delete this.parameters.genres;		
		
		// only add parameters if they are not already in the nextUrl request
		if (nextUrl.indexOf(this.parameters.client_id) == -1) {
			paramsAdditional = that.parameters;
			// might need to keep oauth_token in to detect user favorites in track lists
			//if (nextUrl.indexOf(this.endPoint.explore)>-1) paramsAdditional.oauth_token = null;
		}
		else {
			paramsAdditional = null;
		}
	
		return $http.get(nextUrl, {
			params: paramsAdditional
			});				
			
	};
	

	// called from controller init and controller getTracks 
	
	this.updateUrl = function(pageType, next_href) {
	
		if (next_href) this.nextUrl[pageType] = next_href;
		else this.nextUrl[pageType] = "end";
		
	};
	
	
	
	
	this.parseItemData = function(response) {
	

		var itemData = response;

		// /me/activities/tracks/affiliated for the stream are inside an inner origin object
		// /e1/me/stream for the stream are inside an inner track object	

		if (response['playlist']) innerNodeLabel = 'playlist';
		else if (response['origin']) innerNodeLabel = 'origin';
		else if (response['track']) innerNodeLabel = 'track';
		else innerNodeLabel = null;
		//else innerNodeLabel = this.streamEndPoints[this.streamEndPoints.selected].innerNodeLabel;

		if (response[innerNodeLabel]) {
			itemData = response[innerNodeLabel];
			itemData.type = response.type;
			itemData.container_date = response.created_at;
			if (response.user) itemData.container_user = response.user;
			else itemData.container_user = null;
		}

		itemData.description = null;

		// type is used in the stream for repost/playlist etc...
		// track_type is used mainly by the /tracks api-call to filter original/demo/spoken etc - often null
		// so I don't think we need to set the below to track
		//if (itemData.type==null) itemData.type = 'track';
												
		// we need to get the user image if no artwork!!
		if (itemData.artwork_url==null || typeof itemData.artwork_url == 'undefined') {
			if (typeof itemData.user != 'undefined') itemData.artwork_url = itemData.user.avatar_url;
		}

		itemData.artwork_url = this.resizeArtwork(itemData.artwork_url);

		if (typeof itemData.likes_count == 'undefined') {
			if (typeof itemData.favoritings_count != 'undefined') itemData.likes_count = itemData.favoritings_count;
			else itemData.likes_count = null; 
		}

		//console.log(itemData);
		return itemData;
	
	};


	this.resizeArtwork = function(artwork_url) {

		if (artwork_url!=null) {				
			artwork_url = artwork_url.replace("large.jpg", "t300x300.jpg");	
		}
	
		return artwork_url;
	
	};	
	
	
	
	
	
	this.initSC();		

});