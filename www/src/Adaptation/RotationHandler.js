/*
 handle rotations
 */
App.RotationHandler = (function () {
    var that = {},
        $rotate = null,
        $rotatable = null,
        $modals = null,
        $sortModeSwitch = null,
        $rotateInfoBox = null,
        $rotationTriggerBox = null,
        $tabletopInfoBox = null,
        ROTATE_DURATION = 1000,

        init = function () {
            return that;
        },

        _setTabletopMode = function () {
            if (isTabletopMode()) {
                initRotation();
                $tabletopInfoBox.show();
            }
        },

        initRotation = function () {
            $rotate = $(".rotate");
            $rotatable = $("#rotatable");
            $modals = $(".reveal-modal");
            $sortModeSwitch = $("#sort-mode-switch");
            $rotateInfoBox = $("#rotate-info-box");
            $rotationTriggerBox = $("#rotation-trigger-box");
            $tabletopInfoBox = $("#tabletop-info-box");

            initHandler();
            handleRotateGesture();
        },

        initHandler = function () {
            $rotate.on("click", handleRotateClick);
            $rotationTriggerBox.on("click", closeTriggerBox);
            $tabletopInfoBox.on("click", handleTabletopInfoBoxClick);

            window.addEventListener("resize", function () {
                fitContentSize(getRotation(), getUserSide());
            }, false);
        },

        handleTabletopInfoBoxClick = function (e) {
            e.preventDefault();
            swal({
                title: "Use rotate gesture to change content orientation",
                imageUrl: "ui-images/two_finger_rotate.png",
                showConfirmButton: true,
                animation: false
            });
        },

    /*
     enable rotate gesture and initialize rotate options
     */
        handleRotateGesture = function () {
            var el = document.getElementById("body"),
                hammertime = new Hammer(el);

            hammertime.get("rotate").set({enable: true});
            hammertime.get("pinch").set({enable: true});
            hammertime.on("rotate pinch", function (e) {
                e.preventDefault();
            });
            hammertime.on("rotatestart", function (e) {
                if ($sortModeSwitch.attr("checked") && $("#playlist").has($(e.target)).length)
                    swal({title: "Disable sort mode to rotate!", animation: false, type: "warning"});
            });
            //when rotation degree is higher than 20 show rotate triggers
            hammertime.on("rotateend", function (e) {
                var rotationValue = e.rotation;
                if (rotationValue < 0)
                    rotationValue *= -1;
                if (rotationValue >= 20) {
                    showRotateTriggers();
                }
            });
        },

        showRotateTriggers = function () {
            $rotationTriggerBox.show();
            $rotate.show();

            $("#rotate-" + getRotation()).hide();
        },

        hideRotateTriggers = function () {
            $rotationTriggerBox.fadeOut(100);
        },

    /*
     start rotation when rotation trigger is clicked
     */
        handleRotateClick = function (e) {
            var $clickedRotation = $(e.target),
                rotation = $clickedRotation.attr("data-rotate"),
                side = $clickedRotation.attr("data-side");

            hideRotateTriggers();
            $clickedRotation.fadeOut(500);
            setRotation(rotation);
            setUserSider(side);
            //fit the size of the content
            fitContentSize(rotation, side);

            if ($sortModeSwitch.attr("checked")) {
                $("#playlist").destroy({
                    delegates: ".playlist-item"
                });
                $("#playlist").rotatableSortable({
                    contentId: "#rotatable",
                    listId: "#playlist",
                    delegates: ".playlist-item",
                    rotation: getRotation(),
                    delay: 50
                });
            }
        },

        closeTriggerBox = function () {
            hideRotateTriggers();
        },

    /*
     rotate the content with a transition and resize ui elements
     */
        fitContentSize = function (rotation, side) {
            $modals.transition({rotate: rotation}, ROTATE_DURATION);
            $(".sweet-alert").transition({rotate: rotation}, ROTATE_DURATION);
            $rotatable.transition({rotate: rotation}, ROTATE_DURATION, function () {
                switch (side) {
                    case "left":
                        $rotatable.css("float", "left");
                        leftOrRightResize();
                        modalLeft();
                        sweetAlertLeft();
                        break;
                    case "right":
                        $rotatable.css("float", "right");
                        leftOrRightResize();
                        modalRight();
                        sweetAlertRight();
                        break;
                    case "top":
                        topOrBottomModeResize();
                        sweetAlertDefault();
                        break;
                    case "bottom":
                        topOrBottomModeResize();
                        sweetAlertDefault();
                        break;
                }
            });
            //trigger rotation changed when rotation is completed
            setTimeout(function () {
                $(that).trigger("rotationChanged");
            }, ROTATE_DURATION);
        },

    /*
     resize rotatable box and modals when user is on left or right side of the table
     */
        leftOrRightResize = function () {
            $("#controls-box .row").width($(window).height());
            $rotatable.width($(window).height());

            //set modal width to rotatable width
            $modals.width($rotatable.width());
        },

    /*
     resize rotatable box and modals when user is on top or bottom side of the table
     */
        topOrBottomModeResize = function () {
            $rotatable.width("100%");
            $("#controls-box .row").width($(".row").width());

            //set modal width to width of a row
            $modals.width($("#controls-box .row").width()).css("left", 0).css("right", 0);
        },

        modalRight = function () {
            /*
             the distance to the left of the screen corresponds to the width of the document
             minus the width of the popups
             */
            var left = $(document).width() - $modals.width();
            $modals.css("left", left);
        },

        modalLeft = function () {
            /*
             the distance to the left of the screen corresponds to the width of the document
             minus the width of the pop-ups times -1
             */
            var left = ($(document).width() - $modals.width()) * -1;
            $modals.css("left", left);
        },

    /*
     fit view of sweet alert when the user is on the left side of the table
     */
        sweetAlertLeft = function () {
                /* for Rotation of 90 degrees
                 the distance from the left side corresponds to
                 the distance of the rotatable container to the left side.
                 For this shift in the center of the container and
                 Centering by subtracting half the height of a Sweet Alerts
                 */
                var offsetLeft = $rotatable.offset().left + $rotatable.height() / 2 - $(".sweet-alert").height() / 2;
                $(".sweet-alert").offset({left: offsetLeft})
        },

    /*
     fit view of sweet alert when the user is on the ight side of the table
     */
        sweetAlertRight = function () {
                /* for Rotation of 270 degrees
                 the distance from the left side corresponds to
                 the distance of the rotatable container to the left side.
                 For this shift in the center of the container and
                 Centering by subtracting half the height of a Sweet Alerts
                 */
                var offsetLeft = $rotatable.offset().left + $rotatable.height() / 2 - $(".sweet-alert").height() / 2;
                $(".sweet-alert").offset({left: offsetLeft})
        },

        sweetAlertDefault = function () {
            setTimeout(function () {
                $(".sweet-alert").css("left", "50%");
            }, 0)
        },

        _rotateAlert = function () {
            if (getUserSide() == "left")
                sweetAlertLeft();
            else if (getUserSide() == "right")
                sweetAlertRight();
            else if (getUserSide() == "top" || getUserSide() == "bottom")
                sweetAlertDefault();
        };

    that._setTabletopMode = _setTabletopMode;
    that._rotateAlert = _rotateAlert;
    that.init = init;

    return that;
}());

