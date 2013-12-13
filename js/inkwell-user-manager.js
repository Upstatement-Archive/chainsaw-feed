var inkwellUserManager;
;(function($){

	function InkwellUserManager(){
		this.bindHandlers();
	}

	InkwellUserManager.prototype.bindHandlers = function(){
		$("#acf-field-author").select2();
		$('.post_type-attachment #authordiv').hide();
	};


	$(document).ready(function(){
		inkwellUserManager = new InkwellUserManager();
	});

})(jQuery);