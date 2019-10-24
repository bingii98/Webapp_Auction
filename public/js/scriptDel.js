jQuery(document).ready(function ($) {
	//open popup
	$('.cd-popup-trigger').on('click', function (event) {
		event.preventDefault();
		$('.cd-popup').addClass('is-visible');
	});

	//close popup
	$('.cd-popup').on('click', function (event) {
		if ($(event.target).is('.cd-popup-close') || $(event.target).is('.cd-popup')) {
			event.preventDefault();
			$(this).removeClass('is-visible');
		}
	});

	//close popup
	$('.cd-popup').on('click', function (event) {
		if ($(event.target).is('.cd-popup-close1') || $(event.target).is('.cd-popup')) {
			event.preventDefault();
			$(this).removeClass('is-visible');
		}
	});

	//close popup when clicking the esc keyboard button
	$(document).keyup(function (event) {
		if (event.which == '27') {
			$('.cd-popup').removeClass('is-visible');
		}
	});
});

function setHrefDel(data) {
	$(".cd-buttons").html('<li><a href="' + data + '">Yes</a></li><li><a class="btn cd-popup-close1" style="padding-top: 0px;">No</a></li>');
}