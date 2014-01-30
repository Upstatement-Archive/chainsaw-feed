var inkwellFeed;

;(function($){

	function InkwellFeed(){
		this.lastSearch = null;
		this.bindHandlers();
	}

	InkwellFeed.prototype.bindHandlers = function(){
		var THIS = this;
		$(document).on('ready', THIS.initSortable);
		$(window).on('load', function(){
			$('select[data-selected]').each(THIS.updateSelectMenu);
			$(document).on('click', '[href="#remove"]', THIS.onFeedItemRemove);
			$(document).on('click', '[href="#pin"]', THIS.onFeedItemPin);
			$(document).on('click', '[href="#unpin"]', THIS.onFeedItemUnpin);
			$('.feed-post-search input[type="submit"]').on('click', THIS.onPostSearch);
			$('.feed-post-search input[type="search"]').on('keypress', THIS.onPostSearchEnter);
			$('.feed-post-search').show();
			$('a[href="#send-to-feeds"]').on('click', THIS.onManuallySendToFeeds);
			$('#wpfooter').hide();
			$('.feed-manager').css('visibility','visible');
			inkwellFeed.updateNumberings();
			inkwellFeed.updateScope();
			$('.post-types-dropdown-options a').on('click', THIS.togglePostTypeOption);
		});
		$(document).on('click', '.feed-publish-trigger', function(){
			$('#chainsaw-feed-form').submit();
		});
	};

	InkwellFeed.prototype.togglePostTypeOption = function(e){
		console.log('togglePostTypeOption');
		var $this = $(this);
		var $checkbox = $this.find('input:checkbox');
		var active = $checkbox.is(':checked');
		var $icon = $this.find('.icon');
		console.log($icon);
		if (active){
			//we should deactivate
			$checkbox.removeAttr('checked');
			$icon.hide();
			console.log()
		} else {
			//we shoud ACTIVATE
			$checkbox.attr('checked', true);
			$icon.show();
		}
		return false;
	};

	InkwellFeed.prototype.onManuallySendToFeeds = function(e){
		var data = {action:'manually_send_post_to_feeds', pid:acf.post_id};
		$.post(ajaxurl, data, function(response){
			alert('Added to your feed!');
		});
		return false;
	};

	InkwellFeed.prototype.onPostSearchEnter = function(e){
		if (e.keyCode != 13){
			return;
		}
		e.preventDefault();
		var $this = $(this);
		var search = $this.val();
		if (search.length > 3){
			inkwellFeed.runPostSearch(search);
		}
		return false;
	};

	InkwellFeed.prototype.clearLastSearch = function(){
		setTimeout(function(){
			inkwellFeed.lastSearch = null;
		}, 1000);
	};

	InkwellFeed.prototype.onPostSearch = function(e){
		var $this = $(this);
		var $form = $this.closest('.feed-post-search');
		var search = $form.find('input[type="search"]').val();
		if (search == inkwellFeed.lastSearch) {
			inkwellFeed.clearLastSearch();
			return false;
		}
		inkwellFeed.lastSearch = search;
		if (search.length < 3){
			alert('Your search must be at least 3 characters.');
			inkwellFeed.clearLastSearch();
			return false;
		}
		inkwellFeed.clearLastSearch();
		inkwellFeed.runPostSearch(search);
		return false;
	};

	InkwellFeed.prototype.runPostSearch = function(term){
		var data = {query:term, action:'chainsaw_query_posts', method:'post', format:'html'};
		$.post(ajaxurl, data, inkwellFeed.onPostResults);
		return false;
	};

	InkwellFeed.prototype.onPostResults = function(res, resp){
		//var json = JSON.parse(res);
		$results = $('.feed-in-use.results');
		$results.empty();
		$results.html(res);
		if (res.length){
			$('.results-mod').removeClass('no-results').addClass('results-mod-active');
			$('.results-mod').slideDown(300);
		}

		// No results alert
		if (res.length === 0){
			alert('No results found.');
			return false;
		}

		// Wrap new-post-stub divs in li
		$('.results').children('div').each(function(){
			$(this).wrap('<li class="feed-manager-post" />');
		});
		// Change unpin button to pin button
		$('.unpinned').find('.unpin').replaceWith('<button class="tool pin icon" href="#pin">&#10133;</button>');

		// Prepend the stub date to any unpinned content
		$('.unpinned .stub-text').each(function prependStubDate(){
			$(this).prepend($(this).find('.stub-date'));
		});

		// Make sure .thin is where it should be
		(function refreshThin(){
			$('.feed-block-1').find('.unpinned').find('*').addClass('thin thin-unpin');
			$('.feed-block-2').find('.list-view').find('*').addClass("thin thin-list");
			$('.feed-block-1').find('.unpinned').find('*').removeClass('thin-list');
			$('.feed-block-2').find('.list-view').find('*').removeClass('thin-unpin');
			$('.feed-block-2').find('.feed-in-use').not('.list-view').find('*').removeClass('thin thin-list thin-unpin');
		})();

	};

	InkwellFeed.prototype.onFeedItemUnpin = function(){
		var $this = $(this);
		var $li = $this.closest('li');
		$li.closest('.feed-manager').find('ul.posts').prepend($li);
		$li.find('.post-scope').val('posts');
		return false;
	};

	InkwellFeed.prototype.updateScope = function() {
		$('.feed-main-post-list .feed-manager-post').each(function(i) {
			var $this = $(this);
			var $feed = $this.closest('.feed-in-use');
			$this.find('.post-scope').val($feed.data('scope'));
		});
	};

	InkwellFeed.prototype.updateNumberings = function(){
		$('.feed-main-post-list .new-post-stub').each(function(i) {
			$(this).find('.feeds-number').val(i+1);
		});
	};

	InkwellFeed.prototype.onFeedItemPin = function(){
		var $this = $(this),
			$li = $this.closest('li');

		$li.closest('.feed-manager').find('ol.pinned').prepend($li);
		$li.find('.post-scope').val('pinned');

		// Remove class removed-stub
		$li.removeClass('removed-stub');

		// Change the pin button to unpin

		// Put the stub-date in the right place
		$('.pinned').find('.pin').replaceWith('<button class="tool unpin icon" href="#unpin">&#10060;</button>');

		// Make sure .thin is where it should be
		(function refreshThin(){
			$('.feed-block-1').find('.unpinned').find('*').addClass('thin thin-unpin');
			$('.feed-block-2').find('.list-view').find('*').addClass("thin thin-list");
			$('.feed-block-1').find('.unpinned').find('*').removeClass('thin-list');
			$('.feed-block-2').find('.list-view').find('*').removeClass('thin-unpin');
			$('.feed-block-2').find('.feed-in-use').not('.list-view').find('*').removeClass('thin thin-list thin-unpin');
		})();

		// Append stub date to pinned stories
		$('.pinned .stub-text').each(function(){
			$(this).find('.stub-pub-info').append($(this).find('.stub-date'));
		});

		// Prepend stub date to list-view pinned stories
		$('.list-view .stub-text').each(function(){
			$(this).find('.stub-date').prependTo(this);
		});

		// Re-index the list
		inkwellFeed.updateNumberings();
		inkwellFeed.updateScope();
		//THIS.update();

		// Hide recently removed block when empty and set category top
		if ($('.removed-stub').length === 0) {
			$('.recently-removed-wrap').slideUp(200);
		} else {}
		return false;
	};

	InkwellFeed.prototype.onFeedItemRemove = function(){
		alert('onFeedItemRemove');
		var $this = $(this);
		var $li = $this.closest('li');
		$li.fadeOut(function(){
			$(this).remove();
		});
		return false;
	};

	InkwellFeed.prototype.onSortableUpdate = function(event, ui){
		var $li = $(ui.item);
		var $ol = $li.find('.feed-in-use');
		var scope = $ol.data('scope');
		$li.find('.post-scope').val(scope);
		if ($ol.hasClass('saveable')){
			$li.find('.array-saver').attr('name', 'pids[]');
		}
		/* remove duplicates */
		var pid = $li.data('pid');
		$('li.feed-manager-post[data-pid="'+pid+'"]').not($li).remove();
		console.log('updateNumberings');
		inkwellFeed.updateNumberings();
		inkwellFeed.updateScope();
		$('.feed-in-use').each(function(){
			var $this = $(this);
			var stubs = $this.find('.feed-manager-post');
			if (stubs.length){
				$this.find('.feed-pinned-holder').slideUp();
			} else {
				$this.find('.feed-pinned-holder').slideDown();
			}
		});
	};



	InkwellFeed.prototype.initSortable = function(){
		var THIS = this;

		$('.feed-block-1 .feed-in-use').sortable({
			helper: 'clone',
			appendTo: '.feed-manager-content',
			scroll: false,
			revert: 200,
			connectWith: '.feed-block-2 .feed-in-use',
			update:inkwellFeed.onSortableUpdate
		});

		$('.feed-block-2 .feed-in-use').sortable({
			helper: 'clone',
			appendTo: '.feed-manager-content',
			scroll: false,
			revert: 200,
			connectWith: '.feed-block-2 .feed-in-use',
			update:inkwellFeed.onSortableUpdate
		});

		$('.feeds-number').on('keypress', function(e){
			if (e.keyCode != 13){
				return;
			}
			var $this = $(this);
			var $stub = $this.closest('.feed-manager-post');
			var $container = $this.closest('.feed-main-post-list');
			var pos = $this.val();
			pos -= 2;
			pos = Math.max(0, pos);
			pos = Math.min(pos, $container.find('.feed-manager-post').length);
			var $before = $container.find('.feed-manager-post:eq('+pos+')');
			$before.after($stub);
			$('.feed-block-2 .feed-in-use').sortable('refresh');
			inkwellFeed.updateNumberings();
			inkwellFeed.updateScope();
			$this.blur();
			return false;
		});

	};

	InkwellFeed.prototype.updateSelectMenu = function(){
		var $select = $(this);
		var value = $select.data('selected');
		$select.val(value);
	};

	inkwellFeed = new InkwellFeed();

})(jQuery);
