/**
 * Created by Patrick on 12.02.2015.
 */
(function ($) {
    var lastMove = null,
        $closestItem = null,
        $drag = null,
        horizontalSpace = null,
        verticalSpace = null,
        rotation = null,
        $list = null,
        $content = null,
        $delegates = null,
        notDraggingItems = [],
        defaultWidth = null,
        delay = null,
        scrollInterval = null,
        scrollIntervalDuration = null,
        scrollTolerance = null,
        scrollPx = null,
        $oldClosestItem = null,
        ghostInterval = null,
        $ghost = null;

    var min = Number.POSITIVE_INFINITY;


    $.fn.rotatableSortable = function (options) {
        return this.each(function () {
            var settings = $.extend({}, $.fn.rotatableSortable.defaults, options);
            //global vars
            rotation = settings.rotation;
            delay = settings.delay;
            scrollIntervalDuration = settings.scrollIntervalDuration;
            scrollTolerance = settings.scrollTolerance;
            scrollPx = settings.scrollPx;

            $list = $(this);

            $delegates = $list.find(settings.delegates);
            $content = $(settings.contentId);

            if ($delegates.length > 1) {
                setRotationSpaces();
                addSortable();
            }
            else {
                alert("Sorting not possible with list length < 1");
            }


            function addSortable() {
                $delegates.on("touchstart", function (e) {
                    e.preventDefault();
                    if (e.originalEvent.changedTouches.length == 1) {

                        lastMove = e;
                        $drag = $(this);

                        var timeout = window.setTimeout(function () {
                            followCursor(e);
                            onTouchMove();
                            onTouchEnd();

                            $ghost = $drag.clone();
                            $ghost.css("z-index", "-1");
                            $ghost.toggleClass("ghost", "drag");

                            ghostInterval = setInterval(function () {
                                cloneDrag();
                            }, 50);

                            $(document).css("user-select", "none").attr('unselectable', 'on').on('selectstart', false);
                            $drag.addClass("drag").off("touchend");

                            if (scrollInterval == null)
                                scrollInterval = setInterval(function () {
                                    scroll();
                                }, scrollIntervalDuration);
                        }, delay);

                        $delegates.on("touchend", function () {
                            clearTimeout(timeout);
                            clearTimeout(ghostInterval);
                            clearInterval(scrollInterval);
                            if ($ghost != null || $ghost != undefined)
                                $ghost.remove();
                            $list.stop();
                            $drag.off("touchmove mousemove touchend mouseup");
                            $delegates.off("touchend");
                            scrollInterval = null;
                            return false;
                        });
                        return false;
                    }
                });


                $delegates.on("mousedown", (function (e) {
                    e.preventDefault();

                    lastMove = e;
                    $drag = $(this);

                    var timeout = window.setTimeout(function () {

                        followCursor(e);

                        onMouseMove();
                        onMouseUp();
                        $ghost = $drag.clone();
                        $ghost.css("z-index", "-1");
                        $ghost.toggleClass("ghost", "drag");
                        ghostInterval = setInterval(function () {
                            cloneDrag();
                        }, 50);

                        $(document).css("user-select", "none").attr('unselectable', 'on').on('selectstart', false);
                        $drag.addClass("drag").off("mouseup");

                        if (scrollInterval == null)
                            scrollInterval = setInterval(function () {
                                scroll();
                            }, scrollIntervalDuration);

                    }, delay);

                    $drag.on("mouseup", function () {
                        clearTimeout(timeout);
                        clearTimeout(ghostInterval);
                        clearInterval(scrollInterval);
                        if ($ghost != null || $ghost != undefined)
                            $ghost.remove();
                        $drag.off("touchmove mousemove touchend mouseup");
                        $delegates.off("mouseup");
                        scrollInterval = null;
                        return false;
                    });
                    return false;
                }));

            }

            function cloneDrag() {
                min = Number.POSITIVE_INFINITY;

                if ($oldClosestItem != $closestItem) {
                    insertClone();
                }

                $oldClosestItem = $closestItem;
                for (var i = 0; i < notDraggingItems.length; i++) {
                    var notDraggingItemOffset = null,
                        top = null,
                        dist = null;
                    if (rotation == 0 || rotation == 180) {
                        notDraggingItemOffset = $(notDraggingItems[i]).offset().top;
                        top = lastMove.pageY;
                    }
                    else if (rotation == 90 || 270) {
                        notDraggingItemOffset = $(notDraggingItems[i]).offset().left;
                        top = lastMove.pageX;
                    }

                    dist = top - notDraggingItemOffset;
                    if (dist < 0) {
                        dist *= -1;
                    }
                    if (dist < min) {
                        $closestItem = $(notDraggingItems[i]);
                        min = dist;
                    }
                }
                $ghost.css("position", "relative").css(horizontalSpace, "auto").css(verticalSpace, "auto").css("min-width", defaultWidth);
            }

            function insertClone() {
                $ghost.css("opacity", 1);
                if (rotation == 180)
                    if (lastMove.pageY >= $closestItem.offset().top + $closestItem.height() / 2)
                        $ghost.insertBefore($closestItem);
                    else
                        $ghost.insertAfter($closestItem);
                else if (rotation == 0)
                    if (lastMove.pageY <= $closestItem.offset().top - $closestItem.height() / 2)
                        $ghost.insertBefore($closestItem);
                    else
                        $ghost.insertAfter($closestItem);
                else if (rotation == 90)
                    if (lastMove.pageX >= $closestItem.offset().left + $closestItem.height() / 2)
                        $ghost.insertBefore($closestItem);
                    else
                        $ghost.insertAfter($closestItem);
                else if (rotation == 270)
                    if (lastMove.pageX >= $closestItem.offset().left - $closestItem.height() / 2)
                        $ghost.insertAfter($closestItem);
                    else
                        $ghost.insertBefore($closestItem);

            }


            //FOLLOW CURSOR
            function onTouchMove() {
                $(document).on("touchmove", function (e) {
                    e = e.originalEvent.targetTouches[0];
                    followCursor(e);
                });
            }

            function onMouseMove() {
                $(document).on("mousemove", function (e) {
                    e.preventDefault();
                    followCursor(e);
                });
            }

            function followCursor(e) {
                lastMove = e;

                defaultWidth = $delegates.width();
                notDraggingItems = $delegates.not(".drag");
                $drag.css("position", "absolute").css("min-width", defaultWidth).css("z-index", "10").css("opacity", 0.2);

                if (rotation == 0)
                    $drag.css(horizontalSpace, e.pageX - $list.offset().left - $drag.width() / 2).css(verticalSpace, e.pageY - $list.offset().top - $drag.height() / 2);
                else if (rotation == 90)
                    $drag.css(horizontalSpace, e.pageX - $list.offset().left - $drag.height() / 2).css(verticalSpace, e.pageY - $list.offset().top - $drag.width() / 2);
                else if (rotation == 180)
                    $drag.css(horizontalSpace, e.pageX - $list.offset().left - $drag.width() / 2).css(verticalSpace, e.pageY - $list.offset().top - $drag.height() / 2);
                else if (rotation == 270)
                    $drag.css(horizontalSpace, e.pageX - $list.offset().left - $drag.height() / 2).css(verticalSpace, e.pageY - $list.offset().top - $drag.width() / 2);
            }


            //SORT END
            function onMouseUp() {
                $(document).on("mouseup", function (e) {
                    e.preventDefault();
                    $drag.css("color", "#f5f5f5");
                    $ghost.replaceWith($drag);
                    sortComplete();
                    scrollInterval = null;
                });
            }

            function onTouchEnd() {
                $(document).on("touchend", function (e) {
                    $drag.css("color", "#f5f5f5");
                    $ghost.replaceWith($drag);
                    sortComplete();
                    scrollInterval = null;
                });
            }

            function sortComplete() {
                min = Number.POSITIVE_INFINITY;
                $list.stop();
                clearInterval(scrollInterval);

                $drag.css("position", "relative").css(horizontalSpace, "auto").css(verticalSpace, "auto").css("min-width", defaultWidth);
                $drag.removeClass("drag").css("z-index", "0").css("opacity", 1);

                clearInterval(ghostInterval);

                removeEvents();

                settings.sortEnd.call(this);
            }

            function setRotationSpaces() {
                if (rotation == 180) {
                    horizontalSpace = "right";
                    verticalSpace = "bottom";
                }
                else if (rotation == 0) {
                    horizontalSpace = "left";
                    verticalSpace = "top";
                }
                else if (rotation == 90) {
                    horizontalSpace = "bottom";
                    verticalSpace = "left";
                }
                else if (rotation == 270) {
                    horizontalSpace = "top";
                    verticalSpace = "right";
                }
            }

            function removeEvents() {
                /*$(document).on("touchstart touchmove touchend mousedown mousemove mouseup", function(){
                 return true;
                 });*/
                $(document).off("touchstart").off("touchmove").off("touchend").off("mousedown").off("mousemove").off("mouseup");
                $(document).css("user-select", "auto").attr('unselectable', 'off').on('selectstart', true);
            }


            //SCROLL
            function scroll() {
                var bottomBorder = 0,
                    topBorder = 0;

                switch (parseInt(rotation)) {
                    case  0:
                        bottomBorder = $list.offset().top + $list.height();
                        topBorder = $list.offset().top;
                        scrollZeroRotation(bottomBorder, topBorder);
                        break;
                    case 90:
                        bottomBorder = $list.offset().left;
                        topBorder = $list.offset().left + $list.height();
                        scrollNinetyRotation(bottomBorder, topBorder);
                        break;
                    case 180:
                        bottomBorder = $list.offset().top;
                        topBorder = $list.offset().top + $list.height();
                        scrollOneEightyRotation(bottomBorder, topBorder);
                        break;
                    case 270:
                        bottomBorder = $list.offset().left + $list.height();
                        topBorder = $list.offset().left;
                        scrollTwoSeventyRotation(bottomBorder, topBorder);
                        break;
                    default :
                        return;
                }
            }

            function scrollZeroRotation(bottomBorder, topBorder) {
                if ($drag.offset().top <= bottomBorder && $drag.offset().top >= bottomBorder - scrollTolerance) {
                    scrollPlus();
                }
                else if ($drag.offset().top >= topBorder && $drag.offset().top <= topBorder + scrollTolerance) {
                    scrollMinus();
                }
                else {
                    $list.stop();
                }
            }

            function scrollOneEightyRotation(bottomBorder, topBorder) {
                if ($drag.offset().top >= bottomBorder && $drag.offset().top <= bottomBorder + scrollTolerance) {
                    scrollPlus();
                }
                else if ($drag.offset().top <= topBorder && $drag.offset().top >= topBorder - scrollTolerance) {
                    scrollMinus();
                }
                else {
                    $list.stop();
                }
            }

            function scrollNinetyRotation(bottomBorder, topBorder) {
                if ($drag.offset().left >= bottomBorder && $drag.offset().left <= bottomBorder + scrollTolerance) {
                    scrollPlus();
                }
                else if ($drag.offset().left <= topBorder && $drag.offset().left >= topBorder - scrollTolerance) {
                    scrollMinus();
                }
                else {
                    $list.stop();
                }
            }

            function scrollTwoSeventyRotation(bottomBorder, topBorder) {
                if ($drag.offset().left <= bottomBorder && $drag.offset().left >= bottomBorder - scrollTolerance) {
                    scrollPlus();
                }
                else if ($drag.offset().left >= topBorder && $drag.offset().left <= topBorder + scrollTolerance) {
                    scrollMinus();
                }
                else {
                    $list.stop();
                }
            }

            function scrollPlus() {
                $list.animate({scrollTop: '+=' + scrollPx}, function () {
                    $list.stop();
                });
            }

            function scrollMinus() {
                $list.animate({scrollTop: '-=' + scrollPx}, function () {
                    $list.stop();
                });
            }
        });
    };


    $.fn.rotatableSortable.defaults = {
        delegates: "li",
        contentId: "#content",
        rotation: 0,
        delay: 1000,
        scrollIntervalDuration: 200,
        scrollTolerance: 100,
        scrollPx: 100,

        sortEnd: function () {
            //called when mouse or touch is released
        }
    };

    $.fn.destroy = function (options) {
        var $delegates = $(options.delegates);
        if (options.delegates == null || options.delegates == undefined)
            $delegates = $(this).children();

        $(this).stop();
        if ($ghost != null || $ghost != undefined)
            $ghost.remove();
        $delegates.off("touchstart").off("mousedown").off("touchend").off("mouseup");
        clearTimeout(scrollInterval);
        return this;
    };

}(jQuery));