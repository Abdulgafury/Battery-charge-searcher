$(function() {
	setTimeout(function() {
		if (!$('#page-preloader').hasClass('preloader-done')) {
			$('#page-preloader').addClass('preloader-done')
		}
	}, 1000);
})