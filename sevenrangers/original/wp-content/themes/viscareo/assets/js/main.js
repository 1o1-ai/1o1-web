(function ($) {
    "use strict";

    /**=========================
        LOADER
    =========================**/
    $(window).on("load", function () {
        $(".loader-fix-js-check").fadeOut("slow", function () {
            $(this).remove();
        });
    });

    /**=========================
        CAROUSEL
    =========================**/
    // Slider
    $(".carousel").carousel({
        pause: false,
        interval: 7000,
    });
    // Swipe
    $(".carousel .carousel-inner").swipe({
        swipeLeft: function (event, direction, distance, duration, fingerCount) {
            this.parent().carousel("next");
        },
        swipeRight: function () {
            this.parent().carousel("prev");
        },
        threshold: 0,
        tap: function (event, target) {
            window.location = $(this).find(".carousel-item.active a").attr("href");
        },
        excludedElements: "label, button, input, select, textarea, .noSwipe",
    });
    $(".carousel .carousel-inner").on("dragstart", "a", function () {
        return false;
    });

    /**=========================
        PLAY VIDEO
    =========================**/
    $("#video").on("hidden.bs.modal", function () {
        var $this = $(this).find("iframe"),
            tempSrc = $this.attr("src");
        $this.attr("src", "");
        $this.attr("src", tempSrc);
    });

    /**=========================
        COUNTER
    =========================**/
    $(".countUp").countUp({
        time: 2000,
        delay: 10,
    });

    // services carousel
    $(".category-carousel").not(".slick-initialized").slick({
        slidesToShow: 5,
        autoplay: false,
        dots: false,
        variableWidth: false,
        centerMode: true,
        centerPadding: "0",
        pauseOnHover: false,
        pauseOnFocus: false,
        infinite: true,
    });

    /**=========================
        MAGANIFIC POPUP
    =========================**/
    $("a.mfpclick").click(function (m) {
        m.preventDefault();
        var gallery = $(this).attr("href");
        $(gallery)
            .magnificPopup({
                delegate: "a",
                type: "image",
                mainClass: "mfp-fade",
                gallery: {
                    enabled: true,
                },
            })
            .magnificPopup("open");
    });

    /**=========================
        SELECT
    =========================**/
    $(".select2").select2();
    $(".select2-no-search").select2({
        minimumResultsForSearch: Infinity,
    });

    /**=========================
        TOOLTIP
    =========================**/
    $(".theme-tooltip").tooltip();

    /**=========================
        VALIDATE
    =========================**/
    var year = new Date().getFullYear();
    $("#year").html(year);

    /**=========================
        EASING
    =========================**/
    $(".easing-click").click(function () {
        if (location.pathname.replace(/^\//, "") == this.pathname.replace(/^\//, "") && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $("[name=" + this.hash.slice(1) + "]");
            if (target.length) {
                $("html, body").animate(
                    {
                        scrollTop: target.offset().top - 100,
                    },
                    1000,
                    "easeInOutExpo"
                );
                return false;
            }
        }
    });

    /**=========================
        BACK TO TOP
    =========================**/
    $(window).on("scroll", function () {
        if ($(this).scrollTop() > 200) {
            $("body").attr("id", "body-id");
            $(".backtotop").addClass("backtotop-bottom");
        } else {
            $("body").removeAttr("id", "body-id");
            $(".backtotop").removeClass("backtotop-bottom");
        }
    });
})(jQuery);
