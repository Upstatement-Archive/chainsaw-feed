;(function($){



	// jQuery plugin functions
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
	/*
    $('.mask-wrapper').waypoint('sticky', {
        offset: 48, // Apply "stuck" when element 48px from top
        wrapper: '<div class="feed-main-sticky-wrapper" />',
        handler: function(dir) {
            $('.feed-main-header').width($('.feed-manager-header').outerWidth() - 338);
            if ($('.feed-main-instructions').outerHeight() === 0) {
                $('.feed-main-sticky-wrapper').css('height', '40px');
            }
        }
    });
*/

	$(".display-selector-dropdown").selectBoxIt({
		showEffect: "slideDown",
	    hideEffect: "slideUp",
	    showEffectSpeed: 200,
	    hideEffectSpeed: 200
	});




	// Utility functions
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

	// Make sure .thin is where it should be
	function refreshThin(){
		$('.feed-block-1').find('.unpinned').find('*').addClass('thin thin-unpin');
		$('.feed-block-2').find('.list-view').find('*').addClass("thin thin-list");
		$('.feed-block-1').find('.unpinned').find('*').removeClass('thin-list');
		$('.feed-block-2').find('.list-view').find('*').removeClass('thin-unpin');
		$('.feed-block-2').find('.feed-in-use').not('.list-view').find('*').removeClass('thin thin-list thin-unpin');
	};

	// Replace the unpin button with a pin button
	function pinButton(){
		var pinButton = $('<button></button>', { class: 'tool pin icon', text: '\u2795', href: '#pin'});
		$('.unpinned').find('.unpin').replaceWith(pinButton);
	};

	// Replace the pin button with an unpin button
	function unpinButton(){
		var unpinButton = $('<button></button>', { class: 'tool unpin icon', text: '\u274C', href: '#unpin'});
		$('.pinned').find('.pin').replaceWith(unpinButton);
	};

	// Prepend the stub date to any unpinned content
	function prependStubDate(){
		$(this).find('.stub-date').prependTo(this);
	};

	// Append the stub date to any pinned content
	function appendStubDate(){
		var $this = $(this);
		$this.find('.stub-pub-info').append($this.find('.stub-date'));
	};


	// Hides search results when user clicks outside of results-mod
	$(document).on('click', function hideResults(e) {
		var container = $('.feed-post-search'),
		results = $('.results-mod');

		var hideMe = true;
		if(e.target == container[0] || container.find(e.target).length) {
			hideMe = false;
		}
		if(e.target == results[0] || results.find(e.target).length) {
			hideMe = false;
		}

		if(results.hasClass('results-mod-active') && hideMe) {
			$('#search-button').css('color', 'rgb(217, 220, 221)');
			results.slideUp(200);
			setTimeout(function() {
				results.addClass('no-results').removeClass('results-mod-active');
				$('.feed-in-use.results').empty();
			}, 200);
		}
	});




	// Functions to set the page
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

	(function withLoad() {
		var recentUpdated = $('[href="#expandCollapse"]').first(),
		updatedIcon = recentUpdated.children('.unpinned-icon');

		pinButton();
		refreshThin();
		$('.unpinned .stub-text').each(prependStubDate);
		$('#wpfooter').hide();
		$('#adminmenuback').css('z-index','0');

		// Bind the enter key to the search button
		$(".search-inputs").keyup(function(event){
			if(event.keyCode == 13){
				var search = $('#search-button');
				search.click();
				search.css('color', 'white');
			}
		});

		// Show recent content unpinned category
		recentUpdated.siblings('.feed-unpinned').show();
		updatedIcon.addClass('up-arrow');
		updatedIcon.css('transform','rotatex(180deg)');
		recentUpdated.addClass('category-expanded');
	})();

	// State-change functions
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~

	// Show post-types dropdown on hover
	$('.post-types').hover(
		function(){
			$('.post-types-dropdown-block').slideDown(200);
		}, 
		function () {
			$('.post-types-dropdown-block').slideUp(200);
		}
	);

	// Show feed-main dropdown on hover
	$('.feed-main-dropdown').hover(
		function(){
			$('.feed-main-dropdown-block').slideDown(200);
		},
		function () {
			$('.feed-main-dropdown-block').slideUp(200);
		}
	);

	// Show display-selector dropdown on hover
	$('.display-selector').hover(
		function(){
			$(this).find('.display-selector-dropdown-block').slideDown(200);
		}, 
		function () {
			$(this).find('.display-selector-dropdown-block').slideUp(200);
		}
	);

	// Show and hide unpinned category items on click and verbose
	// function to change the icon button
	$('[href="#expandCollapse"]').on('click', function() {
		var $this = $(this),
		categoryIcon = $this.parent('.unpinned-category').find('.unpinned-icon');

		$this.siblings('.feed-unpinned').slideToggle('fast');
		if (categoryIcon.hasClass('up-arrow')) {
			categoryIcon.addClass('down-arrow').removeClass('up-arrow');
			categoryIcon.css('transform','rotatex(0deg)');
			$this.removeClass('category-expanded');
		} else {
			categoryIcon.addClass('up-arrow').removeClass('down-arrow');
			categoryIcon.css('transform','rotatex(180deg)');
			$this.addClass('category-expanded');
		}
	});

	// Toggle between list and expanded views
	// Due to toggle, this will only work if there are two buttons and two views
	$('.feed-view-toggle').on('click', function() {
		var pinned = $('.feed-in-use');
		var stubtext = $('.stub-text');

		$('.feed-view-toggle').toggleClass('is-active');
		pinned.toggleClass('list-view');
		if (pinned.hasClass('list-view')) {
			stubtext.each(function(){
				$(this).prepend($(this).find('.stub-date'));
			});
		} else {
			$('.pinned .stub-text').each(function(){
				$(this).find('.stub-pub-info').append($(this).find('.stub-date'));
			});
		}

		refreshThin();

	});

	// Refresh functionality once a user has dragged an item
	$('.feed-in-use').on("sortstop", function( event, ui ) {
		var instructions = $('.feed-main-instructions'),
		pinned = $('.pinned');

		// Hide instructions
		instructions.css('height','0');
		$('.feed-main-sticky-wrapper').css('height','40');

		setTimeout(function() {
			instructions.hide();
		}, 200);

		// Move the fixed feed main up
		$('.feed-main-post-list').css('top','165px');

		// Prepend stub date to unpinned stories
		$('.unpinned .stub-text').each(prependStubDate);

		// Append stub date to pinned stories
		$('.pinned .stub-text').each(appendStubDate);

		// Prepend stub date to list view pinned stories
		$('.list-view .stub-text').each(prependStubDate);

		pinned.children('li').removeClass('removed-stub');

		// Hide recently removed block when empty and set category top
		if ($('.removed-stub').length === 0) {
			$('.recently-removed-wrap').slideUp(200);
		} else {
		}

		// Replace pin button with unpin
		pinned.find('.pin').replaceWith('<button class="tool unpin icon" href="#unpin">&#10060;</button>');
		refreshThin();
	});

	// Functionality for the recently removed block
	$('.feed-in-use').on('click', '.feed-manager-post .unpin', function(e, target){
		var removedPost = $(this).closest('.feed-manager-post');
		removedPost.addClass('removed-stub');
		removedPost.removeClass('pinned');
		removedPost.prependTo('.recently-removed');
		pinButton();
		refreshThin();
		$('.recently-removed-wrap').show();
		$('.removed-stub .stub-text').each(prependStubDate);
	});

})(jQuery);