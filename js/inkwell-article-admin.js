var inkwellArticleAdmin;

;(function($){

	function InkwellArticleAdmin(){
		this.init();
	}

	InkwellArticleAdmin.prototype.bindHandlers = function() {
		setTimeout(this.preSelectTab, 3000);
	};

	InkwellArticleAdmin.prototype.initFields = function(){
		var $postContent = $('#postdivrich');
		$('div.field_type-tab[data-field_name="normal_article"]').after($postContent);
		$postContent.css('float', 'none');
		$('#acf-post_content').remove();
	};

	InkwellArticleAdmin.prototype.preSelectTab = function(){
		var items = $('.values .layout .menu-item-handle');
		if (items.length){
			var $builderTab = $('li.field_key-field_51644565fb0a3 a');
			$builderTab.trigger('click');
			console.log($builderTab);
		}
	};

	InkwellArticleAdmin.prototype.init = function(){
		this.initFields();
		this.bindHandlers();
	};

	inkwellArticleAdmin = new InkwellArticleAdmin();

})(jQuery);

