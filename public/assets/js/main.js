'use strict';
/*****************************************

	TABLE OF CONTENTS
	---------------------------
		1. Intro effects
		2. Box Effect
		3. Counter
		4. Text Animation
		5. Subscribe
		6. Social Icons
		7. Subscribe input field

 *****************************************/

 /******************************************************************
 *******************************		1. Intro effects
 ******************************************************************/
	function loader() {
		var body = $('body')[0];
		var loader = $('#loader-wrap')[0];

		setTimeout(function() {
			loader.style.opacity = 0;
			loader.style.visibility = 'hidden';
			body.style.overflow = 'visible';
		},1000);
	};
	function introMain() {
		setTimeout(function() {
			$('#counter').addClass('loaded');
			setTimeout(function() {
				$('.countdown-wrap').addClass('countdown-wrap-active');
				$('.main-paragraph').addClass('main-paragraph-active');
				$('.main-subparagraph').addClass('main-subparagraph-active');
				setTimeout(function() {	
					$('.logo').addClass('logo-active');
					setTimeout(function() {
						$('.switch-button-1').addClass('switch-button-1-active');
						$('.subscribe-btn').addClass('subscribe-btn-active');
					}, 100);
				}, 500);
			}, 300);
		}, 0);
	};
	function outroMain() {
		setTimeout(function() {
			$('#counter').removeClass('loaded');
			setTimeout(function() {
				$('.countdown-wrap').removeClass('countdown-wrap-active');
				$('.main-paragraph').removeClass('main-paragraph-active');
				$('.main-subparagraph').removeClass('main-subparagraph-active');
				setTimeout(function() {	
					$('.logo').removeClass('logo-active');
					setTimeout(function() {
						$('.switch-button-1').removeClass('switch-button-1-active');
						$('.subscribe-btn').removeClass('subscribe-btn-active');
					}, 50);
				}, 200);
			}, 100);
		},0);
	}
	function introSubscribe() {
		setTimeout(function() {
	 	$('.subscribe-z').addClass('subscribe-wrap-active');
	 	$('.subscribe').addClass('borders-merge');
	 	$('.subscribe').addClass('subscribe-active');
		}, 800);
	}
	function outroSubscribe() {
		$('.subscribe-z').removeClass('subscribe-wrap-active');
		$('.subscribe').removeClass('borders-merge');
		$('.subscribe').removeClass('subscribe-active');
	}
	function introAbout() {
		setTimeout(function() {
			$("#content-section").fadeIn();
			$('.social').addClass('social-active');
			setTimeout(function() {
				$('.soc-wrap').addClass('soc-wrap-hover');
				$('.about-head1,.about-head2').addClass('about-head-active');
				setTimeout(function() {
					$('.about-head-container').addClass('about-head-container-active');
					$('.soc-wrap').removeClass('soc-wrap-hover');
				}, 1000);
			}, 500);
		}, 1000);
	}
	function outroAbout() {
		setTimeout(function() {
			$("#content-section").fadeOut();
			$('.social').removeClass('social-active');
			setTimeout(function() {
				$('.soc-wrap').removeClass('soc-wrap-hover');
				$('.about-head1,.about-head2').removeClass('about-head-active');
				setTimeout(function() {
					$('.about-head-container').removeClass('about-head-container-active');
					$('.soc-wrap').removeClass('soc-wrap-hover');
				}, 100);
			}, 100);
		}, 100);
	}
	window.onload = function() {
	loader();
		setTimeout(function() {
			introMain();
		}, 1500);
	}
