(function ($) {
    "use strict";

    /**=========================
        HEADER FIXED SCROLL
    =========================**/
    $(window).on("scroll", function () {
        if ($(window).scrollTop() > 200) {
            $("body").addClass("header-fixed");
            $(".sticky-header").addClass("sticky-header-fixed");
        } else {
            $("body").removeClass("header-fixed");
            $(".sticky-header").removeClass("sticky-header-fixed");
        }
    });

    /**=========================
        OFFCANVAS MENU
    =========================**/
    $(".dropdown > a").on("click", function (e) {
        e.preventDefault();
        var dropdown = $(this).parent(".dropdown");
        dropdown.find(">.dropdown-menu").slideToggle("show");
        $(this).toggleClass("opened");
        return false;
    });

    $(".navbar-toggler-open").on("click", function (o) {
        o.preventDefault();
        $("body").addClass("overflow-hidden");
        $(".offcanvas").addClass("offcanvas-body");
        $(this).closest(".offcanvas").addClass("active");
    });

    $(".navbar-toggler-close").on("click", function (c) {
        c.preventDefault();
        $("body").removeClass("overflow-hidden");
        $(".offcanvas").removeClass("offcanvas-body");
        $(this).closest(".offcanvas").removeClass("active");
    });
})(jQuery);
