(function ($) {
    "use strict";

    /**=========================
        MENU
    =========================**/
    $( window ).on( 'elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction( 'frontend/element_ready/ekit-nav-menu.default', function($scope, $){
            $('body .ekit-menu-dropdown-toggle').on('click', function(eve) {
                $(this).toggleClass('elementskit-submenu-indicator-close');
            });
            $('body .elementskit-submenu-panel .dropdown-item').on('click', function(eve) {
                $(this).toggleClass('elementskit-submenu-indicator-close');
            });
        });
    });

    /**=========================
        HEADER FIXED SCROLL
    =========================**/
    $(window).on("scroll", function () {
        if ($(window).scrollTop() > 200) {
            $("body").css("padding-top", "100px");
            $(".el-sticky-header").addClass("el-sticky-header-fixed");
        } else {
            $("body").css("padding-top", "0px");
            $(".el-sticky-header").removeClass("el-sticky-header-fixed");
        }
    });

    /**=========================
        CAROUSEL
    =========================**/
    // Services carousel
    $( window ).on( 'elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction( 'frontend/element_ready/services-carousel.default', function($scope, $){
            if ($("body").hasClass("rtl")) {
                $(".services-carousel").not('.slick-initialized').slick({
                    slidesToShow: 3,
                    variableWidth: false,
                    pauseOnHover: false,
                    pauseOnFocus: false,
                    infinite: true,
                    rtl: true,
                    responsive:[
                        {
                            breakpoint: 1024,
                            settings:{
                                slidesToShow: 2,
                                slidesToScroll: 1,
                            }
                        },
                        {
                            breakpoint: 767,
                            settings:{
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                            }
                        }
                    ]
                });
            }else{
                $(".services-carousel").not('.slick-initialized').slick({
                    slidesToShow: 3,
                    variableWidth: false,
                    pauseOnHover: false,
                    pauseOnFocus: false,
                    infinite: true,
                    responsive:[
                        {
                            breakpoint: 1024,
                            settings:{
                                slidesToShow: 2,
                                slidesToScroll: 1,
                            }
                        },
                        {
                            breakpoint: 767,
                            settings:{
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                            }
                        }
                    ]
                });
            }
        });
    });

    // Testimonial carousel
    $( window ).on( 'elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction( 'frontend/element_ready/viscareo-testimonials-carousel.default', function($scope, $){
            if ($("body").hasClass("rtl")) {
                $(".v-testimonial-carousel").not('.slick-initialized').slick({
                    slidesToShow: 1,
                    variableWidth: false,
                    pauseOnHover: false,
                    pauseOnFocus: false,
                    infinite: true,
                    rtl: true,
                    responsive:[
                        {
                            breakpoint: 991,
                            settings:{
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                            }
                        }
                    ]
                });
            }else{
                $(".v-testimonial-carousel").not('.slick-initialized').slick({
                    slidesToShow: 1,
                    variableWidth: false,
                    pauseOnHover: false,
                    pauseOnFocus: false,
                    infinite: true,
                    responsive:[
                        {
                            breakpoint: 991,
                            settings:{
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                            }
                        }
                    ]
                });
            }
        });
    });

    // Testimonial 2 carousel
    $( window ).on( 'elementor/frontend/init', function() {
        elementorFrontend.hooks.addAction( 'frontend/element_ready/viscareo-testimonials-carousel-2.default', function($scope, $){
            if ($("body").hasClass("rtl")) {
                $(".v-testimonial-carousel-2").not('.slick-initialized').slick({
                    slidesToShow: 1,
                    variableWidth: false,
                    pauseOnHover: false,
                    pauseOnFocus: false,
                    infinite: true,
                    rtl: true,
                    responsive:[
                        {
                            breakpoint: 991,
                            settings:{
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                            }
                        }
                    ]
                });
            }else{
                $(".v-testimonial-carousel-2").not('.slick-initialized').slick({
                    slidesToShow: 1,
                    variableWidth: false,
                    pauseOnHover: false,
                    pauseOnFocus: false,
                    infinite: true,
                    responsive:[
                        {
                            breakpoint: 991,
                            settings:{
                                slidesToShow: 1,
                                slidesToScroll: 1,
                                infinite: true,
                            }
                        }
                    ]
                });
            }
        });
    });

})(jQuery);
