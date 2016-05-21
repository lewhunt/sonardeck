//  © 2016 Lew Hunt - SonarDeck - the free web app that filters your SoundCloud stream, likes and new music tracks

sonardeckApp.controller('MainController', function($scope, SonarDeckService, $timeout, $location, $route) {

	this.showMenu = undefined;
	this.showCover = undefined;

	this.items = {};
	this.filteredItems = {};
	this.filteredItemsInTypeahead = [];
	
	this.filters = {};
	
	this.pageType = 'latest';
	
	this.filterMenuFlag = false;

	this.signedIn = false;

	this.filters.latest = {track_type:['Original']};
	this.filters.explore = {genre:['Alternative Rock']};	
	this.filters.stream = {type:[]};
	this.filters.likes = {keywords:{}};
	this.filters.widgetOptions = {visual: true, auto_play:true, show_comments:true, hide_related:true};
	// for future inclusion in filters: likes_count:{start:0,end:100000,min:0,max:1000000}
	
	
	this.genreModel = [
		'Alternative',
		'Alternative Rock', 
		'Ambient', 
		'Classical', 
		'Country', 
		'Dance & EDM', 
		'Dancehall', 
		'Deep House', 
		'Disco', 
		'Drum & Bass', 
		'Dubstep',
		'Electronic',
		'Folk & Singer-Songwriter',
		'Hip-hop & Rap',
		'House',
		'Indie',
		'Jazz & Blues',
		'Latin',
		'Metal',
		'Piano',
		'Pop',
		'R&B & Soul',
		'Reggae',
		'Reggaeton',
		'Rock',
		'Soundtrack',
		'Techno',
		'Trance',
		'Trap',
		'Triphop',
		'World'
	];
	
	this.latestTrackTypeModel = [
		'Original',
		'Remix',
		'Recording',
		'Podcast',
		'Demo'
	];
	
	this.streamTrackTypesModel = {
		'track': 'New Tracks',
		'track-repost': 'Reposted Tracks',
		'playlist': 'New Playlists',
		'playlist-repost': 'Reposted Playlists'
	};
	
	
	////////////////////////////////////////////////////
	// vars used by the thumbnail/clone player directive
	////////////////////////////////////////////////////
	
	//check if device has scrollbar so we can determine if any no-scroll padding will be needed during player and filter overlays
	this.hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
		
	if (this.hasScrollbar) $('.sd-filter-panel, .sd-fieldset-scrollable-list').addClass('sd-scrollbar');
	
	//Set a global for the card we just clicked so we can track it
	this.thumbnailElement = '';

	//Set up an object for last clicked element so we know where to return to on collapse
	this.lastThumbnailPosition = {'top': 0, 'left': 0,'width': 0,'height': 0};

	//Set a flag to determine the current flip state of our clone
	this.cloneflipped = false;

	this.widgetIframe = document.getElementById('sc-widget');
	
	this.widget = SC.Widget(this.widgetIframe);
	
	this.trackUri = '';
	
	this.currentItem = null;
	
	/////////////////////////////////////////////////////////////
	
	
	this.countKeywordsEntered = function(obj){	
		var count = 0;
		for(var key in obj) {
			if (obj.hasOwnProperty(key)) {
		  		if (obj[key].length>0 || (key=='user' && obj[key].username.length>0) ) count++;	
			}
		}
		return count;
	};	
	
	this.listSelectedTrackTypes = function() {
		
		var selectedTrackTypes = [];
		
		for (var i = 0; i < this.filters[this.pageType].type.length; i++) {
			
			var currentArrayValue = this.filters[this.pageType].type[i];
			
			if (this.streamTrackTypesModel[currentArrayValue]) {
				selectedTrackTypes.push(this.streamTrackTypesModel[currentArrayValue]);  
			}
			
		}
		
		return selectedTrackTypes.join(', ');
		
	};
	

	
	this.updateFilterOptions = function(currentIndex, optionsType){	
	
	
		var storedOption = this.filters[this.pageType][optionsType];
		
		this.filters[this.pageType][optionsType] = [];
		
		if (optionsType=="genre") {
			if (storedOption != this.genreModel[currentIndex]) {
				this.filters[this.pageType][optionsType].push(this.genreModel[currentIndex]);
			}
		}
		else {
			if (storedOption != this.latestTrackTypeModel[currentIndex]) {
				this.filters[this.pageType][optionsType].push(this.latestTrackTypeModel[currentIndex]);
				this.filters[this.pageType].searchQuery = null;
			}	
		}
		
		this.initPublicTracks(this.pageType);
		
		this.getTracks();		

	}; 

	
	this.searchQueryChanged = function() {
		
		if (this.filters[this.pageType].searchQuery.length==0) this.filters[this.pageType].searchQuery=null;
	
		if (SonarDeckService.parameters.q != this.filters[this.pageType].searchQuery) {
		 
			this.initPublicTracks(this.pageType);
		
			this.getTracks();
		}
		
	};	
	

	this.initPublicTracks = function() {
	
		this.showRepostOptions = false;
		this.showPublicOptions = true;
		
		this.items = {};
		this.items[this.pageType] = [];
		this.filteredItems = {};
		this.filteredItems[this.pageType] = [];	

		this.busy = false;
	
		this.checkForMoreCallsCount = 0;
		this.checkForMoreCallsMax = 9;
		
		SonarDeckService.parameters.types = this.filters[this.pageType].track_type;
		SonarDeckService.parameters.q = this.filters[this.pageType].searchQuery;
		SonarDeckService.parameters.genres = this.filters[this.pageType].genre;
		SonarDeckService.parameters.tags = null;
		SonarDeckService.parameters.license = null;
		
		if (this.filters[this.pageType].searchQuery!=null) {
			if (this.filters[this.pageType].searchQuery.indexOf('tags=') > -1) { 
				SonarDeckService.parameters.q = "";
				SonarDeckService.parameters.tags = this.filters[this.pageType].searchQuery.substring(this.filters[this.pageType].searchQuery.indexOf('=')+1);
			}
			else if (this.filters[this.pageType].searchQuery.indexOf('license=') > -1) { 
				SonarDeckService.parameters.q = "";
				SonarDeckService.parameters.license = this.filters[this.pageType].searchQuery.substring(this.filters[this.pageType].searchQuery.indexOf('=')+1);
			}
		}
		
		
		SonarDeckService.updateUrl(this.pageType, SonarDeckService.endPoint[this.pageType]);
		
		this.resetCheckForMoreCallsCount();
		
		this.limitCount = SonarDeckService.parameters.limit;
		
		//to show correct soundcloud connect button
		if (SonarDeckService.loadToken() == null || SonarDeckService.loadToken() == undefined) {
			this.signedIn = false;
		}
		else this.signedIn = true;
		
	};
	
	
	this.initUserTracks = function() {
	
		var that = this;
		
		this.showPublicOptions = false;
		
		this.items = {};
		this.items[this.pageType] = [];
		this.filteredItems = {};
		this.filteredItems[this.pageType] = [];	
		
		this.busy = false;
	
		this.checkForMoreCallsCount = 0;
		this.checkForMoreCallsMax = 9;
		
		if (this.pageType=="stream") {
			this.showRepostOptions = true;
			//
		}
		else  {
			this.showRepostOptions = false;
		}
		
		SonarDeckService.updateUrl(this.pageType, SonarDeckService.endPoint[this.pageType]);
		
		SonarDeckService.parameters.genres = null;
		
		this.resetCheckForMoreCallsCount();
		
		this.limitCount = SonarDeckService.parameters.limit;	
		
		
		if (SonarDeckService.loadToken() == null || SonarDeckService.loadToken() == undefined) {
		
			this.signedIn = false;
			
			this.showIntroScreen();
				
			SC.connect()
				.then(
					function(options){
						that.signedIn = true;
						SonarDeckService.saveToken(options.oauth_token);
						SonarDeckService.loadToken();				
						that.getTracks();
						that.hideIntroScreen();
						//console.log('connecting');					
					})
					.catch(function(op){
						//console.log('error', op);
					});
		}
		
		else {
			
			this.signedIn = true;
			//this.hideIntroScreen();
			
		}
		
		
	};
	
	
	this.updatedFilterRefresh = function() {
		
		this.limitCount = SonarDeckService.parameters.limit;
	
		this.resetCheckForMoreCallsCount();
		
		var that = this;
		$timeout(function() {
			that.checkForMoreCalls();
		},0);

	};	
	


	this.getTracks = function() {
	
		if (this.busy) return;
			
		this.busy = true;
		
		var that = this;
		
		var innerNodeLabel;	
		
		var pageType = this.pageType;
		
		if (SonarDeckService.nextUrl[that.pageType]=="end") {
			this.busy = false;
			return;
		}
				
		SonarDeckService.getHttp(pageType)
			.then(
				function(response) {
				
					SonarDeckService.updateUrl(pageType, response.data.next_href);	
	
					for (var i = 0; i < response.data.collection.length; i++) {
						
						if (response.data.collection[i].uri || response.data.collection[i].playlist || response.data.collection[i].track || response.data.collection[i].origin) {
							if (that.items[pageType] != undefined) that.items[pageType].push(SonarDeckService.parseItemData(response.data.collection[i]));	
						}

					}
				}, 				
				function(error) {
				
					//console.log("error in controller");	
										
					if (error.status==401) {
						SonarDeckService.clearToken();
						that.checkForMoreCallsCount = that.checkForMoreCallsMax;
					}
					
					else if (error.status==503) {
						that.checkForMoreCallsCount = that.checkForMoreCallsMax - 1;
					}
					
				})
			.finally(function() {
			
				that.busy = false;

				if (SonarDeckService.nextUrl[that.pageType]!="end") that.checkForMoreCalls();	
			
			});
	};

	
	this.checkForMoreCalls = function() {
		
		this.checkFilterCount(this.filteredItems[this.pageType].length);	
			
		if (this.limitCount>this.filteredItems[this.pageType].length && (angular.element('.cbp-rfgrid').height() - angular.element(window).scrollTop() < angular.element(window).height()+100 )) {
					
				if (this.checkForMoreCallsCount<this.checkForMoreCallsMax) {
					
					this.incrementLimitCount();

					this.getTracks();				
					
				}	
		}	
		
	};
	
	this.infiniteScrollActivated = function() {
	
		if (this.filteredItems == undefined) return;
	
		this.checkFilterCount(this.filteredItems[this.pageType].length);
		
		this.incrementLimitCount();
		
		if (this.limitCount>this.filteredItems[this.pageType].length) {
		
			this.getTracks();
		
		}
	
	};
		
	
	this.createTypeaheadArray = function(textEntryType) {
		
		this.typeahreadArray = [];
		
		this.typeahreadArray = _.chain(this.filteredItems[this.pageType]).map(textEntryType).uniq().sortBy().compact().value();					

	};
	
	this.startsWith = function(array, viewValue) {
	
		return array.substr(0, viewValue.length).toLowerCase() == viewValue.toLowerCase();
	} 
		

		
	this.incrementLimitCount = function() {
		
		this.limitCount = this.limitCount + 20;
		
	};	
			
	
	this.resetCheckForMoreCallsCount = function() {
		
		this.checkForMoreCallsCount = 0;

	};
	
	
	this.checkFilterCount = function(count) {	
		
		if (this.storedFilterCount==count && this.limitCount>=this.storedFilterCount) {
			this.checkForMoreCallsCount++;
		}
		else {
			this.resetCheckForMoreCallsCount();
		}
		
		this.storedFilterCount = count;
		
		if (count==0) this.limitCount = SonarDeckService.parameters.limit;		
					
	};
	
	
	this.printItem = function(item) {
			
		
		//this.currentItem = item;
		
		//console.log(this.currentItem);
		

	
	};
	
	
	
	this.filterButtonSelected = function() {
	
		this.showMenu = !this.showMenu;
								
		// prevent grid scrolling when filter popup is shown
		if (this.showMenu==true) {
			$(".sd-filter-panel").scrollTop(0);
			$('html').addClass('no-scroll');
			if (this.hasScrollbar) $('html, .sd-navbar, .sd-playbar').addClass('no-scroll-padding');		
		} 
		else {
			var that = this;
			$timeout(function() {
				$('html').removeClass('no-scroll');
				if (that.hasScrollbar) $('html, .sd-navbar, .sd-playbar').removeClass('no-scroll-padding');	
			},500);
		}
		
	};
	
	this.clearFiltersButtonSelected = function() {
		
		this.filters[this.pageType] = {};
		
		$route.reload();
				
	};
	
	this.showIntroScreen = function() {
		
		this.showIntro = true;
		$('html').addClass('no-scroll');
		if (this.hasScrollbar) $('html, .sd-navbar, .sd-playbar').addClass('no-scroll-padding');	
	};
	
	
	
	this.hideIntroScreen = function() {
		
		this.showIntro = false;
		$('html').removeClass('no-scroll');
		if (this.hasScrollbar) $('html, .sd-navbar, .sd-playbar').removeClass('no-scroll-padding');	
	};
	
	this.showIntroScreen();
		
	
	this.connectButtonSelected = function() {
		//console.log("connectSelected");
		
		var that = this;
			
		SC.connect()
			.then(
				function(options){
					that.signedIn = true;
					SonarDeckService.saveToken(options.oauth_token);
					SonarDeckService.loadToken();					
					that.getTracks();
					that.hideIntroScreen();
					//console.log('connecting');					
				})
				.catch(function(op){
					//console.log('error', op);
				});
		
	};
	
	this.disconnectButtonSelected = function() {
		
		//console.log("disconnectSelected");
		
		var result = confirm("Are you sure you want to log out from your SoundCloud account?");
		
		if (result) {
		
			SonarDeckService.clearToken();
			this.signedIn = false;
			this.filterButtonSelected();
			
					
			var that = this;
								
			$timeout(function() {
				$location.path( "/" );	
				that.showIntroScreen();
			},350);
		
		}

	};
	
	
		
	this.multipleKeywordsComparator = function (expected, actualInCompactForm)
	{
		if (expected==null || typeof expected != 'string') return false;

		var listActual = actualInCompactForm.split(',');
		var mustBeIncluded = false;
		
		// console.log(listActual);

		angular.forEach(listActual, function (actual)
		{
			// Search for a substring in the object value which match one of the predicate, in a case-insensitive manner
			if (angular.lowercase(expected).indexOf(angular.lowercase(actual).trim()) !== -1)
			{
				mustBeIncluded = true;
			}
			
			//if we want to keep filter when user types comma
			//if (actual!="" && angular.lowercase(expected).indexOf(angular.lowercase(actual).trim()) !== -1)

		});
		
		//if we want to keep filter when user types comma
		//if (listActual.length==1 && listActual[0]=="") mustBeIncluded = true;
		

		return mustBeIncluded;
	};	
		
	

});