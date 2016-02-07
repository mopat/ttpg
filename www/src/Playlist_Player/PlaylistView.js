App.PlaylistView = (function () {
    var that = {},
        $playlistBox = null,
        $playlist = null,
        playlistItemTpl = null,
        listItemColors = [],
        isPlaylistExisting = null,
        $playlistSpaceFiller = null,
        $loadingAnimation = null,
        defaultTextColor = null,
        playlistLength = 0,
        completePlaylist = [],

        init = function () {
            $playlistBox = $("#playlist-box");
            $playlist = $("#playlist");
            isPlaylistExisting = false;

            $playlistSpaceFiller = $("#playlist-space-filler");
            $loadingAnimation = $("#spinner-loader-box");
            defaultTextColor = "#f5f5f5";
            playlistItemTpl = _.template($("#playlist-item-tpl").html());

            listItemColors = ["rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)"];

            initHandler();

            setPlaylistIds();
            if (isMobile.any) {
                setupSwipeToDelete();
            }
            return that;
        },

        initHandler = function () {
            $playlist.on("click", ".playlist-item-anchor", handleListItemClick);
            $playlist.on("click", ".playlist-item-delete", removeListItem);
            $playlistSpaceFiller.on("click", playlistSpaceFillerClick);
        },

    /*
     setup swipe control: use swipe gestures for lists when tabletop mode is enabled
     */
        _setupSwipeControl = function () {
            $playlist.swipe({
                swipe: function (event, direction, distance, fingerCount, fingerData, duration) {
                    setupSwipeToScroll(event, direction, distance);
                },
                allowPageScroll: "vertical",
                threshold: 10,
                excludedElements: "button, input, select, textarea, .noSwipe"
            }).on("touchmove", function (e) {
                e.preventDefault();
            });

            return this;
        },
    /*
     swipe to delete on small devices when
     */
        setupSwipeToDelete = function (event, direction) {
            $playlist.swipe({
                swipe: function (event, direction, distance, fingerCount, fingerData, duration) {
                    if (getUserSide() == "bottom" && direction == "left")
                        removeListItem(event);
                    else if (getUserSide() == "left" && direction == "up")
                        removeListItem(event);
                    else if (getUserSide() == "top" && direction == "right")
                        removeListItem(event);
                    else if (getUserSide() == "right" && direction == "down")
                        removeListItem(event);
                },
                allowPageScroll: "vertical",
                threshold: 10,
                excludedElements: "button, input, select, textarea, .noSwipe"
            });
        },

    /*
     scroll the defined directions depending on the user's side when tabletop mode is enabled
     */
        setupSwipeToScroll = function (event, direction, distance) {
            if (getUserSide() == "left" && direction == "left") {
                scrollMinus(distance);
            }
            else if (getUserSide() == "left" && direction == "right") {
                scrollPlus(distance);
            }
            else if (getUserSide() == "right" && direction == "right") {
                scrollMinus(distance);
            }
            else if (getUserSide() == "right" && direction == "left") {
                scrollPlus(distance);
            }
            else if (getUserSide() == "bottom" && direction == "up") {
                scrollPlus(distance);
            }
            else if (getUserSide() == "bottom" && direction == "down") {
                scrollMinus(distance);
            }
            else if (getUserSide() == "top" && direction == "down") {
                scrollPlus(distance);
            }
            else if (getUserSide() == "top" && direction == "up") {
                scrollMinus(distance);
            }
        },

    /*
     scroll minus the swipe distance * 4
     */
        scrollMinus = function (distance) {
            var scrollFactor = distance * 4;
            $playlist.animate({scrollTop: "-=" + scrollFactor});
        },

    /*
     scroll plus the swipe distance * 4
     */
        scrollPlus = function (distance) {
            var scrollFactor = distance * 4;
            $playlist.animate({scrollTop: "+=" + scrollFactor});
        },

        removeListItem = function (e) {
            var $itemToRemove = $(e.target).closest(".playlist-item");

            swal({
                title: "Delete track?",
                text: "Deleted tracks cannot be restored!",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes",
                closeOnConfirm: true,
                animation: false
            }, function () {
                $itemToRemove.fadeOut(200, function fadeOutComplete() {
                    if ($itemToRemove.hasClass("now-playing"))
                        _playNextTrack();

                    $itemToRemove.remove();
                    setPlaylistIds();
                    checkPlaylistLength();
                });
            });
        },

        checkPlaylistLength = function () {
            if (playlistLength == 0) {
                isPlaylistExisting = false;
                $(that).trigger("allPlaylistItemsRemoved");
            }
        },

    /*
     add a playlist by the given array
     */
        _addPlaylist = function (playlist) {
            completePlaylist = completePlaylist.concat(playlist);
            for (var i in playlist) {
                $playlistSpaceFiller.hide();
                var artworkUrl = playlist[i].artwork_url;
                if (artworkUrl == null)
                    artworkUrl = playlist[i].user.avatar_url;

                var duration = playlist[i].durationMinsAndSecs;
                if (duration == null)
                    duration = getMinutesAndSeconds(playlist[i].duration);

                var title = playlist[i].title,

                    streamUrl = playlist[i].stream_url,

                    playlistItem = playlistItemTpl({
                        stream_url: streamUrl,
                        artwork_url: artworkUrl,
                        title: title,
                        duration: duration
                    });
                $playlist.append(playlistItem);
            }
            setPlaylistIds();
            startPlaylistExisting();

            /*
             save current playlist in localstorage
             */
            localStorage[STORAGE_IDENTIFIER] = JSON.stringify(completePlaylist);

            isPlaylistExisting = true;
            $(that).trigger("checkSortModeSwitch");

            return this;
        },

        startPlaylistExisting = function () {
            var firstTrack = $("#playlist .playlist-item").first();
            if (!isPlaylistExisting && localStorage.getItem(PLAYED_TRACK_IDENTIFIER) < 0)
                playTrack(firstTrack);
        },

    /*
     start playlist
     */
        startPlaylist = function () {
            var firstTrack = $("#playlist .playlist-item").first();
            if (isPlaylistExisting)
                playTrack(firstTrack);
        },

        _playNextTrack = function () {
            var $nowPlaying = $("#playlist .now-playing");
            if ($("#playlist .playlist-item").last().hasClass("now-playing")) {
                $(".now-playing").removeClass("now-playing");
                startPlaylist();
            }
            else {
                $nowPlaying.removeClass("now-playing");
                var $nextTrack = $nowPlaying.next();
                playTrack($nextTrack);
            }

            return this;
        },

        _playPreviousTrack = function () {
            var $nowPlaying = $("#playlist .now-playing");
            if ($("#playlist .playlist-item").first().hasClass("now-playing")) {
                $(".now-playing").removeClass("now-playing");
                startPlaylist();
            }
            else {
                var $previousTrack = $nowPlaying.prev();
                $nowPlaying.removeClass("now-playing");
                playTrack($previousTrack);
            }

            return this;
        },

        handleListItemClick = function (e) {
            e.preventDefault();
            var $nowPlaying = $("#playlist .now-playing");
            $nowPlaying.removeClass("now-playing");
            var $clickedItem = $(e.target).closest(".playlist-item");
            playTrack($clickedItem);
        },

    /*
     play the given track in the playlist and save in localstorage
     */
        playTrack = function ($track) {
            $track.addClass("now-playing");
            var streamUrl = $track.attr("data-stream-url"),
                title = $track.find(".playlist-title").html();
            $(that).trigger("trackPicked", [streamUrl, title]);
            localStorage.setItem(PLAYED_TRACK_IDENTIFIER, $track.index() - 1);
        },

    /*
     play the last played track before site was refreshed or closed
     */
        _playStoredTrack = function () {
            var storedTrackNumber = localStorage.getItem(PLAYED_TRACK_IDENTIFIER);
            $("#playlist .playlist-item").each(function (index) {
                if (index == storedTrackNumber) {
                    var playlistItemStoredTrack = $(this);
                    playTrack(playlistItemStoredTrack);
                }
            });
            return this;
        },

    /*
     set ids and background colors of the playlists
     */
        setPlaylistIds = function () {
            playlistLength = 0;
            $("#playlist .playlist-item").each(function (index) {
                playlistLength++;
                if (index % 2 == 0) {
                    $(this).css("background", listItemColors[0]);
                }
                else {
                    $(this).css("background", listItemColors[1]);
                }
                $(this).find(".playlist-number").html(index + 1 + ".");
            });
        },

    /*
     add sort functionality
     */
        _addSortable = function () {
            $playlist.rotatableSortable({
                contentId: "#rotatable",
                delegates: ".playlist-item",
                rotation: getRotation(),
                delay: 50,
                sortEnd: function () {
                    setPlaylistIds();
                }
            });
            return this;
        },

    /*
     remove sort functionality
     */
        _removeSortable = function () {
            $("#playlist").destroy({
                listId: "#playlist",
                delegates: ".playlist-item"
            });
            return this;
        },

        getMinutesAndSeconds = function (duration) {
            var minutes = Math.floor((duration / 1000) / 60),
                seconds = Math.floor(duration % 60);
            if (seconds < 10)
                seconds = "0" + seconds;
            var minutesAndSeconds = minutes + ":" + seconds;
            return minutesAndSeconds;
        },

        _enableSwipe = function () {
            $playlist.swipe("enable");
            return this;
        },

        _disableSwipe = function () {
            $playlist.swipe("disable");
            return this;
        },

        _getPlaylistAsJSON = function () {
            var playlistAsJSON = [];

            $("#playlist .playlist-item").each(function () {
                var playlistNumber = $(this).attr("id"),
                    imageUrl = $(this).find(".playlist-item-image").attr("src"),
                    streamURL = $(this).attr("data-stream-url"),
                    duration = $(this).find(".playlist-track-duration").html(),
                    title = $(this).find(".playlist-title").html(),

                    playlistObject = {
                        number: playlistNumber,
                        image_url: imageUrl,
                        stream_url: streamURL,
                        duration: duration,
                        title: title
                    };
                playlistAsJSON.push(playlistObject);
            });
            if (playlistAsJSON.length == 0)
                return null;
            else
                return JSON.parse(JSON.stringify(playlistAsJSON));
        },

    /*
     trigger event to show search form
     */
        playlistSpaceFillerClick = function (e) {
            e.preventDefault();
            $(that).trigger("playlistSpaceFillerClicked");
        },

    /*
     remove all items from playlist
     */
        _clearPlaylist = function () {
            $playlist.find("li").remove();
            isPlaylistExisting = false;
            $playlistSpaceFiller.show();
            completePlaylist = [];
            localStorage[STORAGE_IDENTIFIER] = JSON.stringify(completePlaylist);
            localStorage.setItem(PLAYED_TRACK_IDENTIFIER, -1);

            return this;
        },

        _hideLoadingAnimation = function () {
            $loadingAnimation.hide();
            $loadingAnimation.undim();
            if (isTabletopMode()) {
                $loadingAnimation.css({WebkitTransform: 'rotate(' + 0 + 'deg)'});
                $loadingAnimation.css({'-moz-transform': 'rotate(' + 0 + 'deg)'});
                $loadingAnimation.css('transform', 'rotate(' + 0 + 'deg)');
                clearTimeout($loadingAnimation.timer);
            }
            return this;
        },

        _showLoadingAnimation = function () {
            $loadingAnimation.show().dimBackground();
            $loadingAnimation.timer = null;
            var degree = 0;
            if (isTabletopMode())
                rotate();
            function rotate() {
                $loadingAnimation.css({WebkitTransform: 'rotate(' + degree + 'deg)'});
                $loadingAnimation.css({'-moz-transform': 'rotate(' + degree + 'deg)'});
                $loadingAnimation.css('transform', 'rotate(' + degree + 'deg)');
                $loadingAnimation.timer = setTimeout(function () {
                    ++degree;
                    rotate();
                }, 5);
            }
            return this;
        },

        _isPlaylistExisting = function () {
            return isPlaylistExisting;
        };

    that._addPlaylist = _addPlaylist;
    that._playNextTrack = _playNextTrack;
    that._playPreviousTrack = _playPreviousTrack;
    that._playStoredTrack = _playStoredTrack;
    that._getPlaylistAsJSON = _getPlaylistAsJSON;
    that._hideLoadingAnimation = _hideLoadingAnimation;
    that._showLoadingAnimation = _showLoadingAnimation;
    that._addSortable = _addSortable;
    that._removeSortable = _removeSortable;
    that._enableSwipe = _enableSwipe;
    that._disableSwipe = _disableSwipe;
    that._clearPlaylist = _clearPlaylist;
    that._isPlaylistExisting = _isPlaylistExisting;
    that._setupSwipeControl = _setupSwipeControl;
    that.init = init;

    return that;

}());
