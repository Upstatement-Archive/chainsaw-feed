;(function($){

	$(".display-selector-dropdown").selectBoxIt({
		showEffect: "slideDown",
	    hideEffect: "slideUp",
	    showEffectSpeed: 200,
	    hideEffectSpeed: 200
	});


	// Utility functions
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~


	// Replace the unpin button with a pin button
	function pinButton(){
		var pinButton = $('<button></button>', { class: 'tool pin icon', text: '\u2795', href: '#pin'});
		$('.unpinned').find('.unpin').replaceWith(pinButton);
	}

	// Replace the pin button with an unpin button
	function unpinButton(){
		var unpinButton = $('<button></button>', { class: 'tool unpin icon', text: '\u274C', href: '#unpin'});
		$('.pinned').find('.pin').replaceWith(unpinButton);
	}

	// Prepend the stub date to any unpinned content
	function prependStubDate(){
		$(this).find('.stub-date').prependTo(this);
	}

	// Append the stub date to any pinned content
	function appendStubDate(){
		var $this = $(this);
		$this.find('.stub-pub-info').append($this.find('.stub-date'));
	}


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
		$('.unpinned .stub-text').each(prependStubDate);

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

	// Refresh functionality once a user has dragged an item
	$('.feed-in-use').on("sortstop", function( event, ui ) {
		pinned = $('.pinned');

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
		}

		// Replace pin button with unpin
		pinned.find('.pin').replaceWith('<button class="tool unpin icon" href="#unpin">&#10060;</button>');
	});

	// Functionality for the recently removed block
	$('.feed-in-use').on('click', '.feed-manager-post .unpin', function(e, target){
		var removedPost = $(this).closest('.feed-manager-post');
		removedPost.addClass('removed-stub');
		removedPost.removeClass('pinned');
		removedPost.prependTo('.recently-removed');
		pinButton();
		$('.recently-removed-wrap').show();
		$('.removed-stub .stub-text').each(prependStubDate);
	});

})(jQuery);