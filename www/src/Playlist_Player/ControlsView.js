App.ControlsView = (function () {
    var that = {},
        sc_client_id = '23a3031c7cd251c7c217ca127777e48b',
        $controlsBox = null,
        $timeSlider = null,
        $volumeMinus = null,
        $volumePlus = null,
        $volumeIcon = null,
        $volume = null,
        $player = null,
        player = null,
        $playButton = null,
        $pauseButton = null,
        $nextButton = null,
        $previousButton = null,
        $elapsedTime = null,
        $titleInfo = null,
        $marquee = null,

        init = function () {
            $controlsBox = $("#controls-box");
            $timeSlider = $("#time-slider");
            $volumeMinus = $("#volume-minus");
            $volumePlus = $("#volume-plus");
            $volumeIcon = $("#volume-icon");
            $volume = $("#volume-value");
            $player = $('#player');
            player = document.getElementById("player");
            $playButton = $("#play-button");
            $pauseButton = $("#pause-button");
            $nextButton = $("#next-button");
            $previousButton = $("#previous-button");
            $elapsedTime = $("#elapsed-time");
            $titleInfo = $(".title-info");
            $marquee = $(".marquee");

            initTimeSlider();
            initPlayerControls();
            addTrackEndListener();
            initHandler();

            player.volume = 1;

            return that;
        },

        initHandler = function () {
            $volumeMinus.on("click", handleVolumeMinus);
            $volumePlus.on("click", handleVolumePlus);
            $nextButton.on("click", handleNextButtonClick);
            $previousButton.on("click", handlePreviousButtonClick);
        },

        addTrackEndListener = function () {
            player.addEventListener("ended", function () {
                $(that).trigger("trackEnded");
            });
        },

    /*
     initialize the slider for the player time and register evets
     */
        initTimeSlider = function () {
            $timeSlider.slider();
            $timeSlider.slider("option", "max", 100);
            $timeSlider.slider({step: 0.25});

            $player.on('timeupdate', function () {
                handleTimeSliderUpdate();
            });

            $timeSlider.on("slide", function (event, ui) {
                $player.off();
                var val = $timeSlider.slider("value");
                player.currentTime = val * player.duration / 100;
            });

            $timeSlider.on("slidestop", function (event, ui) {
                $player.on('timeupdate', function () {
                    handleTimeSliderUpdate();
                });
                var val = $timeSlider.slider("value");
                player.currentTime = val * player.duration / 100;
            });
        },

        handleVolumeMinus = function () {
            player.volume -= 0.1;
            setVolumeView();
        },

        handleVolumePlus = function () {
            player.volume += 0.1;
            setVolumeView();
        },

        setVolumeView = function () {
            var volume = Math.round((player.volume * 100) / 10) * 10;

            $volume.html(volume + "%");
            if (volume == 0)
                $volumeIcon.switchClass("fi-volume", "fi-volume-strike");
            else if ($volumeIcon.hasClass("fi-volume-strike"))
                $volumeIcon.switchClass("fi-volume-strike", "fi-volume");
        },

        handleTimeSliderUpdate = function () {
            $timeSlider.slider({value: (player.currentTime / player.duration) * 100});
            var minutes = Math.floor(player.currentTime / 60);
            var seconds = Math.floor(player.currentTime % 60);
            if (seconds < 10)
                seconds = "0" + seconds;
            var minutesAndSeconds = minutes + ":" + seconds;
            $elapsedTime.html(minutesAndSeconds);
        },

        initPlayerControls = function () {
            $playButton.on('click', function (e) {
                e.preventDefault();
                player.play();
            });

            $pauseButton.on('click', function (e) {
                e.preventDefault();
                player.pause();
            });
        },

        _handleTrackPicked = function (streamUrl, title) {
            resetTimer();
            streamUrl += '?client_id=' + sc_client_id;
            $player.attr('src', streamUrl);
            player.play();
            $titleInfo.html(title);
            $marquee.marquee({
                //speed in milliseconds of the marquee
                duration: 5000,
                //gap in pixels between the tickers
                gap: 250,
                //time in milliseconds before the marquee will start animating
                delayBeforeStart: 0,
                //'left' or 'right'
                direction: 'left',
                duplicated: true
            });

            return this;
        },

        _resetPlayer = function () {
            player.pause();
            player.currentTime = 0;
            resetTimer();
            resetTitleInfo();

            return this;
        },

        _pauseTrack = function () {
            player.pause();

            return this;
        },

        _playTrack = function () {
            player.play();

            return this;
        },

        handleNextButtonClick = function (e) {
            e.preventDefault();
            $(that).trigger("nextButtonClick");
            resetTimer();
        },

        handlePreviousButtonClick = function (e) {
            e.preventDefault();
            $(that).trigger("previousButtonClick");
            resetTimer();
        },

        resetTimer = function () {
            $timeSlider.slider({value: 0});
            $elapsedTime.html("0:00");
        },

        resetTitleInfo = function(){
            $titleInfo.empty();
        },

        _hideControlsBox = function () {
            $controlsBox.hide();

            return this;
        },

        _showControlsBox = function () {
            $controlsBox.fadeIn(500);

            return this;
        };

    that._handleTrackPicked = _handleTrackPicked;
    that._resetPlayer = _resetPlayer;
    that._pauseTrack = _pauseTrack;
    that._playTrack = _playTrack;
    that._hideControlsBox = _hideControlsBox;
    that._showControlsBox = _showControlsBox;
    that.init = init;

    return that;

}());