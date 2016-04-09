// Configurable parameters
var apiUrl = 'php/slides.php';

// Configurable parameters from the database
var slides = [];

// Default configuration
var sliderConfig = {
    animationDuration: 400,
    autoplay: true,
    delay: 4000,
    fullscreen: false
};

// play/pause icons
var sliderPlayIcon = {
    play: 'img/play.png',
    pause: 'img/pause.png'
};
var sliderFullscreenIcon = 'img/fullscreen.png';

// internal vars
var sliderWidth = 0;
var sliderHeight = 0;
var sliderInterval = null;
var sliderAnimating = false;
var sliderContainer; // global container (#slideshow)
var sliderSlideContainer; // slide container (#slide)
var sliderFullscreenBtn;
var sliderToggleBtn;
var sliderLength;
var sliderNavigation;
var sliderCurrentSlide = 0;

/**
 * Go forwards one (or "count" number) slide
 * @param count number|undefined advance this number of slides
 * @return boolean false
 */
function sliderNext(count) {
    if (sliderAnimating) {
        return false;
    }
    if (typeof count === "undefined") {
        count = 1;
    }
    sliderAnimating = true;
    sliderSlideContainer.find('.shown').removeClass('shown');
    sliderSlideContainer.animate({"margin-left": -sliderWidth * count}, sliderConfig.animationDuration, "swing", function () {
        sliderAnimating = false;
        for (var i = 0; i < count; i++) {
            sliderSlideContainer.find(".element:last").after(sliderSlideContainer.find(".element:first"));
        }
        sliderSlideContainer.css({"margin-left": 0});
        sliderSlideContainer.find(".element:first").addClass('shown');
        sliderCurrentSlide += count;
        if (sliderCurrentSlide >= sliderLength) {
            sliderCurrentSlide = 0;
        }
        updateNav();
    });
    sliderResetInterval();
    return false;
}

/**
 * Go back one (or "count" number) slide
 * @param count number|undefined go back this number of slides
 * @return boolean false
 */
function sliderPrev(count) {
    if (sliderAnimating) {
        return false;
    }
    if (typeof count === "undefined") {
        count = 1;
    }

    sliderAnimating = true;
    // insert the list slide at the begining
    sliderSlideContainer.find('.shown').removeClass('shown');
    for (var i = 0; i < count; i++) {
        sliderSlideContainer.find(".element:first").before(sliderSlideContainer.find(".element:last"));
    }
    sliderSlideContainer.css({"margin-left": -sliderWidth * count});
    sliderSlideContainer.animate({"margin-left": 0}, sliderConfig.animationDuration, "swing", function () {
        sliderAnimating = false;
        sliderSlideContainer.css({"margin-left": 0});
        sliderSlideContainer.find(".element:first").addClass('shown');
        sliderCurrentSlide -= count;
        if (sliderCurrentSlide < 0) {
            sliderCurrentSlide = sliderLength - 1;
        }
        updateNav();
    });
    sliderResetInterval();
    return false;
}

/**
 * Moves the slider to the specified slide
 * @param index
 * @returns boolean false
 */
function sliderGoto(index) {
    if (sliderAnimating || index == sliderCurrentSlide) {
        return false;
    }

    var distance = index - sliderCurrentSlide;

    if (distance > 0) {
        sliderNext(distance);
    } else {
        sliderPrev(-distance);
    }

    return false;
}

/**
 * Pauses the slider autoplay
 * @param silent boolean if set and true won't update the play button text
 */
function sliderPause(silent) {
    clearInterval(sliderInterval);
    sliderInterval = null;
    if (!silent) {
        sliderToggleBtn.find('img').attr('src', sliderPlayIcon.play);
    }
}

/**
 * Enables the slider autoplay
 * @param silent boolean if set and true won't update the play button text
 */
function sliderPlay(silent) {
    if (sliderInterval) {
        clearInterval(sliderInterval);
    }
    sliderInterval = setInterval(sliderNext, sliderConfig.delay);
    if (!silent) {
        sliderToggleBtn.find('img').attr('src', sliderPlayIcon.pause);
    }
}

/**
 * Resets the slider timer
 */
function sliderResetInterval() {
    if (sliderInterval) {
        sliderPause();
        sliderPlay();
    }
}

/**
 * Auto resizes the images
 * @param img image dom elment
 */
function imgAutoSize(img) {
    // reset previously defined width / height
    $(img).css('width', '');
    $(img).css('height', '');
    $(img).css('transform', '');
    // get the w/h
    var w = $(img).width();
    var h = $(img).height();

    // we only need to deal with height, as there is a (width: 100%) in the css
    if (h < sliderHeight) {
        // image is not tall enough, we resize it so it's height matches the slider height
        var deltaRatio = (sliderHeight - h) / h;
        var compensationWidth = deltaRatio * w;
        $(img).height(sliderHeight);
        $(img).width(w + compensationWidth);
        // center the image
        $(img).css('transform', 'translateX(-' + compensationWidth / 2 + 'px)');
    } else if (h > sliderHeight) {
        // the inverse case (we already have a width: 100% in css so we only need to recenter)
        $(img).css('transform', 'translateY(' + (sliderHeight - h) / 2 + 'px)');
    }
}

/**
 * Updates the navigation bubbles
 */
function updateNav() {
    sliderNavigation.find('.active').removeClass('active');
    sliderNavigation.find('a:eq(' + sliderCurrentSlide + ')').addClass('active');
}

/**
 * Recalculates a slide width, useful for responsive
 */
function recomputeSliderWidth() {
    if (sliderWidth == sliderContainer.width() && sliderHeight == sliderContainer.height()) {
        // slider width/height didn't change
        return;
    }
    sliderWidth = sliderContainer.width();
    sliderHeight = sliderContainer.height();
    sliderContainer.find('.element').css({
        width: sliderWidth,
        height: sliderHeight
    });
    // +1 to add a safe margin (because of whitespace)
    sliderSlideContainer.width(sliderWidth * ($("#slide .element").length + 1));

    sliderSlideContainer.find('.image > img').each(function () {
        imgAutoSize(this);
    });
}

/**
 * Builds a slide element
 * @param slide object a slide object from the slides array
 * @returns the jQuery slide object ready to be appended
 */
function sliderBuildElement(slide) {
    var img = $('<img>').attr('src', slide.img);
    var element = $('<div class="element">').append(
        $('<div class="image">').append(img)
    );

    // when images load, we resize them
    img.load(function () {
        imgAutoSize(this);
    });

    // Title / Description
    if (typeof slide.title !== "undefined" || typeof slide.description !== "undefined") {
        var caption = $('<div class="caption">');

        if (typeof slide.title !== "undefined") {
            caption.append('<h2>' + slide.title + '</h2>');
        }
        if (typeof slide.description !== "undefined") {
            caption.append('<p>' + slide.description + '</p>');
        }

        element.append(caption);
    }

    return element;
}

/**
 * Applies the fullscreen status based on the sliderConfig.fullscreen var
 * @param animate boolean whether or not we need to do a fadeOut/fadeIn
 */
function applyFullscreen(animate) {
    if (typeof animate === "undefined") {
        animate = true;
    }

    var fadeDuration = 250;

    var toggle = function (el, show) {
        if (show) {
            el.addClass('fullscreen');
        } else {
            el.removeClass('fullscreen');
        }
    };

    if (animate) {
        sliderContainer.fadeOut(fadeDuration, function () {
            sliderContainer.show().css('opacity', 0);
            toggle(sliderContainer, sliderConfig.fullscreen);
            recomputeSliderWidth();
            sliderContainer.animate({'opacity': 1}, fadeDuration);
        });

        sliderNavigation.fadeOut(fadeDuration, function () {
            toggle(sliderNavigation, sliderConfig.fullscreen);
            sliderNavigation.fadeIn(fadeDuration);
        });
    } else {
        toggle(sliderNavigation, sliderConfig.fullscreen);
        toggle(sliderContainer, sliderConfig.fullscreen);
        recomputeSliderWidth();
    }
}

/**
 * Init and start the slideshow
 */
function sliderInit() {
    // getting the main container element
    sliderContainer = $("#slideshow");

    // create slide container
    sliderSlideContainer = $('<div id="slide">');

    // play/pause button
    sliderToggleBtn = $('<a href="#" class="autoplay">').append('<img src="' + sliderPlayIcon.pause + '" alt="Lecture / Pause"/>');

    // fullscreen toggle button
    sliderFullscreenBtn = $('<a href="#" class="fullscreenToggle">').click(function () {
        sliderConfig.fullscreen = !sliderConfig.fullscreen;
        applyFullscreen(true);
        return false;
    }).append('<img src="' + sliderFullscreenIcon + '" alt="Plein écran on/off"/>');

    // setting slide count
    sliderLength = slides.length;

    // will contain the controls
    var controls = $('<div id="controls">').append(
        $('<a href="#" class="prev">').html('&laquo;').click(function () {
            return sliderPrev();
        }),
        $('<a href="#" class="next">').html('&raquo;').click(function () {
            return sliderNext();
        }),
        sliderToggleBtn,
        sliderFullscreenBtn
    );

    // append the controls and the slide container into the main container
    sliderContainer.append(
        controls,
        sliderSlideContainer
    );

    // bind actions
    sliderToggleBtn.click(function () {
        if (sliderConfig.autoplay) {
            sliderPause();
        } else {
            sliderPlay();
        }
        sliderConfig.autoplay = !sliderConfig.autoplay;
        return false;
    });

    // play/pause on hover/out
    sliderContainer.hover(function () {
        if (!sliderConfig.fullscreen && sliderConfig.autoplay) {
            sliderPause(true);
        }
    }, function () {
        if (!sliderConfig.fullscreen && sliderConfig.autoplay) {
            sliderPlay(true);
        }
    });

    // will contain the navigation buttons
    sliderNavigation = $("<div class='navigation'>");

    // build slides
    for (var i = 0; i < slides.length; i++) {
        sliderSlideContainer.append(sliderBuildElement(slides[i]));
        // build navigation
        sliderNavigation.append(
            $('<a href="#">').text(i + 1).data('slide', i).click(function () {
                sliderGoto($(this).data('slide'));
            })
        );
    }

    sliderContainer.after(sliderNavigation);
    updateNav();

    // display the first caption (adding the css class)
    sliderSlideContainer.find('.element:first').addClass('shown');

    // fullscreen toggle
    applyFullscreen(false);

    // calculate the slider width and register the resize event
    // recomputeSliderWidth();
    $(window).resize(recomputeSliderWidth);

    // catch the arrow left & right buttons
    $(document).keydown(function (e) {
        if (e.which == 37) {
            sliderPrev();
            e.preventDefault();
        } else if (e.which == 39) {
            sliderNext();
            e.preventDefault();
        }
    });

    // finally, if we need to autoplay the slider, we just do it
    if (sliderConfig.autoplay) {
        sliderPlay();
    } else {
        sliderPause();
    }
}

/**
 * When the dom is ready, we start loading our config and slides via AJAX then we init the slider when we received all
 * the necessary data
 */
$(document).ready(function () {
    var confLoaded = false;
    var slidesLoaded = false;
    $.ajax(apiUrl, {
        data: {
            action: 'config'
        }
    }).success(function (data) {
        sliderConfig = $.merge(data, sliderConfig);

        confLoaded = true;
        if (confLoaded && slidesLoaded) {
            sliderInit();
        }
    });
    $.ajax(apiUrl, {
        data: {
            action: 'slides'
        }
    }).success(function (data) {
        slides = data;
        slidesLoaded = true;
        if (confLoaded && slidesLoaded) {
            sliderInit();
        }
    });
});
