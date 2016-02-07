App.UserPlaylistView = (function () {
    var that = {},
        $userPlaylistBox = null,
        userPlaylistTpl = null,
        userPlaylistItemTpl = null,
        $userPlaylistModal = null,
        $noPlaylistsInfoPanel = null,
        $closePlaylistModal = null,
        listItemColors = null,
        preview = new Audio(),
        $playlistContainerToDelete = null,
        defaultTextColor = null,

        init = function () {
            listItemColors = ["rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)"];
            defaultTextColor = "#f5f5f5";
            $noPlaylistsInfoPanel = $("#no-playlists-info-panel");
            $closePlaylistModal = $("#close-playlist-modal");

            /*
             templates for the user playlist view
             */
            userPlaylistTpl = _.template($("#user-playlist-tpl").html());
            userPlaylistItemTpl = _.template($("#user-playlist-item-tpl").html());

            $userPlaylistModal = $("#user-playlist-modal");
            $userPlaylistBox = $("#user-playlist-box");

            initHandler();

            return that;
        },

        initHandler = function () {
            $userPlaylistModal.on("close", handleUserPlaylistModalClosed);

            $userPlaylistBox.on("click", ".load-playlist", handleLoadPlaylist);
            $userPlaylistBox.on("click", ".open-icon", handleOpenPlaylist);
            $userPlaylistBox.on("click", ".trash-icon", handleDeletePlaylistClicked);
            $userPlaylistBox.on("click", ".close-icon", handleClosePlaylist);
            $userPlaylistBox.on("click", ".user-playlist-item-anchor", handleListItemClick);
            $userPlaylistBox.on("click", ".user-playlist-item-delete", removeListItem);
            $userPlaylistBox.on("click", ".stop-icon", handleStopIconClick);

            $closePlaylistModal.on("click", closeUserPlaylistModal);
        },

    /*
     setup swipe control: use swipe gestures for modals and lists when tabletop mode is enabled
     */
        _setupSwipeControl = function () {
            /*
             swipe to scroll for user playlists to scroll
             */
            $(".user-playlist").swipe({
                swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
                    setupSwipeToScroll($(this), event, direction, distance);
                },
                allowPageScroll: "vertical",
                threshold: 10,
                excludedElements: "button, input, select, textarea, .noSwipe"
            }).on("touchmove", function (e) {
                e.preventDefault();
            });

            /*
             swipe to scroll for modal view of playlist
             */
            $userPlaylistModal.swipe({
                swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
                    setupSwipeToScroll($(this), event, direction, distance);
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
     scroll the defined directions depending on the user's side when tabletop mode is enabled
     */
        setupSwipeToScroll = function (container, event, direction, distance) {
            if (getUserSide() == "left" && direction == "left") {
                scrollMinus(container, distance);
            }
            else if (getUserSide() == "left" && direction == "right") {
                scrollPlus(container, distance);
            }
            else if (getUserSide() == "right" && direction == "right") {
                scrollMinus(container, distance);
            }
            else if (getUserSide() == "right" && direction == "left") {
                scrollPlus(container, distance);
            } else if (getUserSide() == "bottom" && direction == "up") {
                scrollPlus(container, distance);
            }
            else if (getUserSide() == "bottom" && direction == "down") {
                scrollMinus(container, distance);
            }
            else if (getUserSide() == "top" && direction == "down") {
                scrollPlus(container, distance);
            }
            else if (getUserSide() == "top" && direction == "up") {
                scrollMinus(container, distance);
            }
        },

    /*
     scroll minus the swipe distance * 4
     */
        scrollMinus = function (container, distance) {
            var scrollFactor = distance * 4;
            container.animate({scrollTop: "-=" + scrollFactor});
        },

    /*
     scroll plus the swipe distance * 4
     */
        scrollPlus = function (container, distance) {
            var scrollFactor = distance * 4;
            container.animate({scrollTop: "+=" + scrollFactor});
        },

        _setUserPlaylistView = function (userPlaylistObj) {
            //create header views for the playlists and append them
            var playlistHeaderItem = userPlaylistTpl({
                playlist_id: userPlaylistObj.playlistId,
                title: userPlaylistObj.palylistTitle,
                date: userPlaylistObj.date,
                length: userPlaylistObj.length
            });
            $userPlaylistBox.append(playlistHeaderItem);

            //create list views of the playlist and append them
            var JSONPlaylist = userPlaylistObj.JSONPlaylist;
            for (var j in JSONPlaylist) {
                var JSONItem = JSONPlaylist[j],

                    playlistItem = userPlaylistItemTpl({
                        stream_url: JSONItem.stream_url,
                        artwork_url: JSONItem.image_url,
                        title: JSONItem.title,
                        duration: JSONItem.duration,
                        playlist_number: JSONItem.number
                    });
                $("#" + userPlaylistObj.playlistId).append(playlistItem);
            }
            setPlaylistIds();
            updatePlaylistCount();

            return this;
        },

    /*
     set ids and background colors of the playlists
     */
        setPlaylistIds = function () {
            $(".user-playlist").each(function (index) {
                $(this).children(".user-playlist-item").each(function (index) {
                    if (index % 2 == 0) {
                        $(this).css("background", listItemColors[0]);
                    }
                    else {
                        $(this).css("background", listItemColors[1]);
                    }
                    $(this).find(".user-playlist-number").html(index + 1 + ".");
                });
            });
        },

        _openUserPlaylistModal = function () {
            $userPlaylistModal.foundation('reveal', 'open');

            return this;
        },

        _emptyUserPlaylistModal = function () {
            $userPlaylistBox.empty();

            return this;
        },

    /*
     stop track when user playlist track was played
     */
        handleUserPlaylistModalClosed = function () {
            if (preview.currentTime != 0 || preview == null) {
                preview.pause();
                preview.currentTime = 0;
            }
        },

    /*
     load clicked user playlist in the music player
     */
        handleLoadPlaylist = function (e) {
            e.preventDefault();
            var $userPlaylist = $(this).parents(".user-playlist-container").find(".user-playlist");
            if ($userPlaylist.hasClass("loaded") == false) {
                $userPlaylist.addClass("loading");
                var loadedPlaylist = [];
                $(".loading .user-playlist-item").each(function () {
                    var streamUrl = $(this).attr("data-stream-url"),
                        title = $(this).find(".user-playlist-title").html(),
                        artworkUrl = $(this).find(".user-playlist-item-image").attr("src"),
                        duration = $(this).find(".user-playlist-track-duration").html(),
                        playlistObject = {
                            stream_url: streamUrl,
                            title: title,
                            artwork_url: artworkUrl,
                            durationMinsAndSecs: duration
                        };
                    loadedPlaylist.push(playlistObject);
                });
                $userPlaylist.switchClass("loading", "loaded");
                $(this).html("LOADED");
                $(that).trigger("userPlaylistLoaded", [loadedPlaylist]);
                updatePlaylistCount();
            }
        },

    /*
     play user playlist track
     */
        handleListItemClick = function (e) {
            e.preventDefault();
            var $clickedItem = $(e.target).closest(".user-playlist-item");
            $(".preview-playing").removeClass("preview-playing");
            $clickedItem.addClass("preview-playing");
            var streamUrl = $clickedItem.attr("data-stream-url");

            preview.src = streamUrl + "?client_id=" + SC_CLIENT_ID;
            preview.play();
            $clickedItem.addClass("preview-playing");
            $(that).trigger("previewPlayingStart");
            $(".stop-icon").show();
        },

        removeListItem = function (e) {
            var $itemToRemove = $(e.target).closest(".user-playlist-item");
            $itemToRemove.fadeOut(500, function () {
                $itemToRemove.remove();
                setPlaylistIds();
            });
        },

        handleOpenPlaylist = function (e) {
            e.preventDefault();
            $(that).trigger("resizeUserPlaylistHeight");
            $(".user-playlist-header").hide();
            $(this).parents(".user-playlist-container").find(".user-playlist-header").show();
            $(this).parents(".user-playlist-container").find(".user-playlist").slideDown(300);
            $(".open-icon").hide();
            $(".close-icon").show();
        },

        handleClosePlaylist = function (e) {
            e.preventDefault();
            $(".user-playlist-header").show();
            $(this).parents(".user-playlist-container").find(".user-playlist").slideUp(300);
            $(".close-icon").hide();
            $(".open-icon").show();
        },

        handleStopIconClick = function (e) {
            e.preventDefault();
            preview.pause();
            preview.currentTime = 0;
            $(".stop-icon").hide();
            $(".preview-playing").removeClass("preview-playing");
        },

        handleDeletePlaylistClicked = function (e) {
            e.preventDefault();
            $playlistContainerToDelete = $(this).parents(".user-playlist-container");
            var playlistId = $playlistContainerToDelete.find(".user-playlist").attr("id");
            swal({
                title: "Delete playlist?",
                text: "Deleted playlists can not be recovered!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Delete!",
                closeOnConfirm: false,
                animation: false
            }, function () {
                $(that).trigger("deleteUserPlaylist", [playlistId]);
            });
        },

        _removeUserPlaylist = function () {
            if ($playlistContainerToDelete != null) {
                $playlistContainerToDelete.remove();
                $playlistContainerToDelete = null;
                updatePlaylistCount();
            }

            return this;
        },

        _removeLoadedStatus = function () {
            $(".loaded").removeClass("loaded");
            $(".load-playlist").html("LOAD");

            return this;
        },

    /*
     handler for button to close user playlist view
     */
        closeUserPlaylistModal = function () {
            $userPlaylistModal.foundation("reveal", "close");
        },

    /*
     show no playlists info when no playlists are stored
     */
        updatePlaylistCount = function () {
            var playlistCount = $(".user-playlist-container").size();

            if (playlistCount == 0)
                $noPlaylistsInfoPanel.show();
            else
                $noPlaylistsInfoPanel.hide();
        };

    that._setupSwipeControl = _setupSwipeControl;
    that._setUserPlaylistView = _setUserPlaylistView;
    that._openUserPlaylistModal = _openUserPlaylistModal;
    that._emptyUserPlaylistModal = _emptyUserPlaylistModal;
    that._removeUserPlaylist = _removeUserPlaylist;
    that._removeLoadedStatus = _removeLoadedStatus;
    that.init = init;

    return that;

}());
