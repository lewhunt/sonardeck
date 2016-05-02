// © © 2016 Lew Hunt - SonarDeck - the free web app that filters your SoundCloud stream, likes and new music tracks

// SoundCloud Player Widget inside a 'flip and grow' card
// inspired by demo code seen here - http://stackoverflow.com/questions/24503882/the-google-cards-flip-and-grow-effect 


// thumbnailDirective for when user clicks the thumbnail image either in grid or bottom play-bar

sonardeckApp.directive('thumbnailDirective', function() {
  
  return {
  
    restrict: 'AE',
    link: function(scope, elem, attrs) {
    
    	var cloneElement = $('#cardClone');
            
		elem.on('click', function() {        
		
			
  
			if (!scope.mainCtrl.cloneflipped && $('.cloneArtwork').is(":hidden") ) {
			
				//Cache clicked card
				scope.mainCtrl.thumbnailElement = $(elem);

				//Store position of this element for the return trip

				var offset = scope.mainCtrl.thumbnailElement.offset();
	
				scope.mainCtrl.lastThumbnailPosition.top = offset.top;
				scope.mainCtrl.lastThumbnailPosition.left = offset.left;
				scope.mainCtrl.lastThumbnailPosition.width = scope.mainCtrl.thumbnailElement.width();
				scope.mainCtrl.lastThumbnailPosition.height = scope.mainCtrl.thumbnailElement.height();

				var rotatefront = "rotateY(180deg)";
				var rotateback = "rotateY(0deg)";
				if ((scope.mainCtrl.lastThumbnailPosition.left + scope.mainCtrl.lastThumbnailPosition.width / 2) > $(window).width() / 2) {
					rotatefront = "rotateY(-180deg)";
					rotateback = "rotateY(-360deg)";
				}

				//Copy contents of the clicked card into the clones front card
				cloneElement.find('#cloneFront').html(scope.mainCtrl.thumbnailElement.html());

				//Show the clone on top of the clicked card and hide the clicked card
				//[hack: using opacity for hiding here, visibility:hidden has a weird lag in win chrome]
				cloneElement.css({
					'display': 'block',
						'height': scope.mainCtrl.lastThumbnailPosition.height,
						'width': scope.mainCtrl.lastThumbnailPosition.width,
						'top': scope.mainCtrl.lastThumbnailPosition.top - $(document).scrollTop(),
						'left': scope.mainCtrl.lastThumbnailPosition.left
				});
	
				scope.mainCtrl.thumbnailElement.css('opacity', 0);

				//Need to dynamically alter contents of the clone rear BEFORE it animates? Do it here
				
				//handle scrolling and sd-navbar-options
				if (scope.mainCtrl.hasScrollbar) $('html, .sd-navbar, .sd-playbar').addClass('no-scroll-padding');
				$('html').addClass('no-scroll');
				$('.sd-navbar-options').hide();
				$('.sd-navbar-player-options').show();
	
				$(cloneElement).css('z-index', 99);
	
				$('.cbp-rfgrid').css('opacity', 0.3);
		
	
				$('#cloneBack .cloneArtwork').css({
					'background-image': 'url(' + scope.mainCtrl.thumbnailElement.find('.artwork').attr('src') + ')'
				});
				
				if ( scope.mainCtrl.trackUri != $(scope.mainCtrl.thumbnailElement).data('track') ) scope.mainCtrl.widget.pause();
	
				$('#sc-widget').css('display', 'none');


				//Flip the card while centering it in the screen
				//[hack: we have to wait for the clone to finish drawing before calling the transform so we put it in a 100 millisecond settimeout callback]
				setTimeout(function () {
	
					cloneElement.css({
						'top': '10%',
						'left': '10%',
						'right': '10%',
						'height': '80%',
						'width': '80%'
					});
	
					cloneElement.find('#cloneFront').css({
						'transform': rotatefront,
						'-webkit-transform': rotatefront,
						'-moz-transform': rotatefront
					});
					cloneElement.find('#cloneBack').css({
						'transform': rotateback,
						'-webkit-transform': rotateback,
						'-moz-transform': rotateback
					});
				}, 100);

			} 

			else {
				$('body').click();
			} 
  
		});
		
    }
  };
});



// cloneDirective copies/clones thumbnail image to the growing card - then launches SoundCloud Player Widget after transition is complete

sonardeckApp.directive('cloneDirective', function($timeout, SonarDeckService) {
  
  return {
    
    restrict: 'AE',
    link: function(scope, elem, attrs) {
    
    	var cloneElement = $('#cardClone');
    	
    	var hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
    	
    	var SCPlayEvent = function() {
    		//console.log('SCPlayEvent');
			$('.sd-playbar > .glyphicon').removeClass('glyphicon-play');
			$('.sd-playbar > .glyphicon').addClass('glyphicon-pause');
			//get current sound
			scope.mainCtrl.widget.getCurrentSound(function(value){
				updatePlaybarInfo(value);
			});	
    	};
    	var SCPauseEvent = function() {
    		//console.log('SCPauseEvent');
			$('.sd-playbar > .glyphicon').removeClass('glyphicon-pause');
			$('.sd-playbar > .glyphicon').addClass('glyphicon-play');
			//get current sound
			scope.mainCtrl.widget.getCurrentSound(function(value){
				updatePlaybarInfo(value);
			});	
    	}; 	
    	
    	scope.mainCtrl.widget.bind(SC.Widget.Events.PLAY, SCPlayEvent);
    	scope.mainCtrl.widget.bind(SC.Widget.Events.PAUSE, SCPauseEvent);
    	
    	var updatePlaybarInfo = function(currentSound) {
    	
			//console.dir(currentSound);
			scope.mainCtrl.trackUri = currentSound.uri;
			
			$('.sd-playbar-thumbnail > a').data('track', currentSound.uri);
			
			if (currentSound.artwork_url==null || typeof currentSound.artwork_url == 'undefined') {
				if (typeof currentSound.user != 'undefined') $('.sd-playbar-thumbnail > a > img').attr('src', SonarDeckService.resizeArtwork(currentSound.user.avatar_url));
			}
			else $('.sd-playbar-thumbnail > a > img').attr('src', SonarDeckService.resizeArtwork(currentSound.artwork_url));
			
    		$('.metadata > .user').html(currentSound.user.username);
			$('.metadata > .title').html(currentSound.title);
			$('.metadata-right .plays').html(currentSound.playback_count);
			$('.metadata-right .likes').html(currentSound.likes_count);
			$('.metadata-right .reposts').html(currentSound.reposts_count);
			$('.sd-playbar-thumbnail, .metadata, .metadata-right .counts').css('visibility', 'visible');
			
    	};
    	      
		elem.on('transitionend webkitTransitionEnd oTransitionEnd', function(e) {

			if (e.target === e.currentTarget) {
	
				if (e.originalEvent.propertyName == 'top') {

					//Toggle the clone state
					scope.mainCtrl.cloneflipped = !scope.mainCtrl.cloneflipped;

					//Detect if our clone has returned to the original position and then hide it
					if (!scope.mainCtrl.cloneflipped) {

						//console.log('after shrunk');
	
						$(scope.mainCtrl.thumbnailElement).css('opacity', 1);
						$(cloneElement).css('z-index', 99);
	
						// need to hide it for firefox but this prevents us seeing the loader
						$('.iframe').addClass('hide-opacity-mozilla');
	
						$('.cloneArtwork').show();
	
						$(cloneElement).hide();

	
					} else {
						//Need to dynamically alter contents of the clone rear AFTER it animates? Do it here
						//$('#cloneBack').html('hi');
				
						$(cloneElement).css('z-index', 4000);
	
						$('#sc-widget').css('display', 'block');
	
						//var widgetOptions = {visual: true, auto_play:false, show_comments:true, hide_related:true};
						var widgetOptions = scope.mainCtrl.filters.widgetOptions;
	
						widgetOptions.callback = function(){
	 
							$('#sc-widget').css('display', 'block');
							
							// after short timeout remove cover artwork to reveal SC widget and 
							setTimeout(function () {
								$('.cloneArtwork').hide();
								$('.iframe').removeClass('hide-opacity-mozilla');
								
								//check isPaused
								scope.mainCtrl.widget.isPaused(function(value){
									//SC play event doesnt fire when autoplay is true so we need to manually check if paused
									if (value==false) SCPlayEvent();
									else SCPauseEvent();
								});									
								
							}, 500);
	  
						};
											
						// we only need to load SC widget if we are clicking a different thumbnail
						if ( scope.mainCtrl.trackUri != $(scope.mainCtrl.thumbnailElement).data('track') ) {
							scope.mainCtrl.trackUri = $(scope.mainCtrl.thumbnailElement).data('track');
							scope.mainCtrl.widget.load(scope.mainCtrl.trackUri, widgetOptions);
						}
						else {
							// no need to load new track so just call the callback
							widgetOptions.callback();
						}
						
				
					}
				}
				
			}  

		});
		
    }
  };
});


//If user clicks outside of the flipped card, return to default state

sonardeckApp.directive('closePlayerDirective', function() {
  
  return {
    
    restrict: 'AE',
    link: function(scope, elem, attrs) {
    
    	var cloneElement = $('#cardClone');
    	
    	var hasScrollbar = window.innerWidth > document.documentElement.clientWidth;
      
		elem.on('click', function(e) {

			if (scope.mainCtrl.cloneflipped && $('.cloneArtwork').is(":hidden") ) {

				if (e.target === e.currentTarget) {
					//Reverse the animation

					$('#sc-widget').css('display', 'none');

					$('.cloneArtwork').show();

					//handle scrolling and sd-navbar-options
					$('.sd-navbar-options').show();
					$('.sd-navbar-player-options').hide();
					if (scope.mainCtrl.hasScrollbar) $('html, .sd-navbar, .sd-playbar').removeClass('no-scroll-padding');
					$('html').removeClass('no-scroll');

					cloneElement.css({
						'top': scope.mainCtrl.lastThumbnailPosition.top - $(document).scrollTop() + 'px',
							'left': scope.mainCtrl.lastThumbnailPosition.left + 'px',
							'height': scope.mainCtrl.lastThumbnailPosition.height + 'px',
							'width': scope.mainCtrl.lastThumbnailPosition.width + 'px',
							'z-index': 99
					});


					cloneElement.find('#cloneFront').css({
						'transform': 'rotateY(0deg)',
						'-webkit-transform': 'rotateY(0deg)',
						'-moz-transform': 'rotateY(0deg)'
					});
					cloneElement.find('#cloneBack').css({
						'transform': 'rotateY(-180deg)',
						'-webkit-transform': 'rotateY(-180deg)',
						'-moz-transform': 'rotateY(-180deg)'
					});

					$('.cbp-rfgrid').css('opacity', 1);	

				}

			} 


		});
		
    }
  };
});


