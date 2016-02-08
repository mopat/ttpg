App.MainController = (function () {
    var that = {},
        mainModel = null,
        playlistView = null,
        playlistOptions = null,
        controlsView = null,
        searchView = null,
        pickTrackView = null,
        userPlaylistManager = null,
        userManager = null,
        userPlaylistView = null,
        userManagementView = null,

        resize = null,

        init = function () {
            mainModel = App.MainModel.init();
            playlistView = App.PlaylistView.init();
            playlistOptions = App.PlaylistOptions.init();
            controlsView = App.ControlsView.init();
            searchView = App.SearchView.init();
            pickTrackView = App.PickTrackView.init();
            userPlaylistManager = App.UserPlaylistManager.init();
            userManager = App.UserManager.init();
            userPlaylistView = App.UserPlaylistView.init();
            userManagementView = App.UserManagementView.init();

            resize = App.Resize.init();


            initPlaylistHandler();
            initSearchViewHandler();
            initPickTrackViewHandler();
            initDataHandler();
            initUserManagementHandler();
            initUserPlaylistViewHandler();
            initPlaylistOptionsHandler();
            initUserAndPlaylistManagementHandler();

            documentStart();
        },

        documentStart = function () {
        /*    window.onbeforeunload = function () {
                return "Do you really want to leave this page. Some data will be lost."
            };*/
            $(window).on("orientationchange", function () {
                resize._resizePlaylistHeight();
            });
            $(document).on("click", function () {
                if ($(".sweet-alert").is(":visible") && isTabletopMode())
                    rotateAlert();
            });
            function isTouchDevice() {
                return 'ontouchstart' in window // works on most browsers
                    || 'onmsgesturechange' in window; // works on ie10
            }
            $(document).on("ready", function () {
                if (localStorage.getItem(STORAGE_IDENTIFIER) != null) {
                    var storedPlaylist = JSON.parse(localStorage[STORAGE_IDENTIFIER]);

                    if (storedPlaylist.length != 0) {
                        playlistView._addPlaylist(storedPlaylist);
                        playlistOptions._setIsPlaylistExisting(true);
                        playlistView._playStoredTrack();
                    }
                }

                else {
                    localStorage.setItem(PLAYED_TRACK_IDENTIFIER, -1);
                    localStorage[STORAGE_IDENTIFIER] = JSON.stringify([]);
                }
        /*        if (isMobile.any == false && isTouchDevice()) {
                    swal({
                        title: "Use TailorTunes in Tabletop mode?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes",
                        cancelButtonText: "No",
                        closeOnConfirm: false,
                        closeOnCancel: true,
                        animation: false
                    }, function (isConfirm) {
                        if (isConfirm) {
                            swal({
                                title: "Use rotate gesture to change orientation",
                                text: "You're using TailorTunes in Tabletop mode!",
                                imageUrl: "ui-images/two_finger_rotate.png",
                                showConfirmButton: true,
                                animation: false
                            });
                            setTabletopMode(true);
                            $("body").on("contextmenu", function (e) {
                                e.preventDefault();
                            });
                            userPlaylistView._setupSwipeControl();
                            playlistView._setupSwipeControl();
                            rotationHandler._setTabletopMode();
                        }
                        else
                            setTabletopMode(false);
                    });
                }*/
            });
        },

        handleCheckSortModeSwitch = function () {
            playlistOptions._checkSortModeSwitch();
        },

        initPlaylistHandler = function () {
            $(playlistView).on("trackPicked", handleTrackPick);
            $(playlistView).on("playlistItemsRemoved", handleAllPlaylistItemsRemoved);
            $(controlsView).on("trackEnded", handleTrackEnd);
            $(controlsView).on("nextButtonClick", handleNextButtonClick);
            $(controlsView).on("previousButtonClick", handlePreviousButtonClick);
            $(playlistView).on("playlistItemClicked", handlePlaylistItemClick);
            $(playlistView).on("checkSortModeSwitch", handleCheckSortModeSwitch);
        },

        initSearchViewHandler = function () {
            $(searchView).on("searchButtonClickedEchoNest", handleSearchButtonClickedEchoNest);
            $(searchView).on("searchEchoNestSimilarTracks", handleSearchEchoNestSimilarTracks);
            $(searchView).on("searchIconFocusIn", handleSearchIconFocusIn);
            $(searchView).on("searchIconFocusOut", handleSearchIconFocusOut);
        },

        initPickTrackViewHandler = function () {
            $(pickTrackView).on("echonestTrackIDPicked", handleTrackIdPicked);
            $(pickTrackView).on("soundcloudTrackPicked", handleSoundlcoudTrackPicked);
            $(pickTrackView).on("previewPlayingStart", handlePreviewPlayingStart);
        },

        initDataHandler = function () {
            $(mainModel).on("showLoadingAnimation", handleShowLoadingAnimation);
            $(mainModel).on("hideLoadingAnimation", handleHideLoadingAnimation);
            $(searchView).on("searchButtonClickedSoundcloud", handleSearchButtonClickedSoundcloud);
            $(mainModel).on("echoNestTrackSearchResultsComplete", handleEchoNestTrackSearchResultsComplete);
            $(mainModel).on("soundcloudTrackSearchResultsComplete", handleSoundcloudTrackSearchResultsComplete);
            $(mainModel).on("playlistCreated", handlePlaylistCreated);
        },

        initUserManagementHandler = function () {
            $(playlistOptions).on("savePlaylistClicked", handleSavePlaylistClicked);
            $(playlistOptions).on("postPlaylistClicked", handlePostPlaylistClicked);
            $(userPlaylistManager).on("userPlaylistTitlesLoaded", handleUserPlaylistTitlesLoaded);
            $(userPlaylistView).on("userPlaylistLoaded", handleUserPlaylistLoaded);
            $(userPlaylistManager).on("emptyOldUserPlaylistView", handleEmptyUserPlaylistView)
        },

        initUserPlaylistViewHandler = function () {
            $(userPlaylistView).on("previewPlayingStart", handlePreviewPlayingStart);
            $(userPlaylistView).on("resizeUserPlaylistHeight", handleResizeUserPlaylistHeight);
        },

        initPlaylistOptionsHandler = function () {
            $(playlistOptions).on("sortEnabled", handleSortEnabled);
            $(playlistOptions).on("sortDisabled", handleSortDisabled);
            $(playlistOptions).on("cancelPlaylistPostButton", handleCancelPlaylistPostButton);
        },

        initUserAndPlaylistManagementHandler = function () {
            //login, signin, show playlists
            $(userManagementView).on("loginButtonClicked", handleLoginButtonClick);
            $(userManager).on("loginSuccessful", handleLoginSuccessful);
            $(userManager).on("loginFailed", handleLoginFailed);

            //signin
            $(userManagementView).on("signInButtonClick", handleSignInButtonClick);
            $(userManager).on("signInSuccessful", handleSignInSuccessful);
            $(userManager).on("signInFailed", handleSignInFailed);

            //Logout, show playlists
            $(userManagementView).on("handleLogoutClicked", handleLogoutClick);
            $(userManagementView).on("myPlaylistsAnchorClick", handleMyPlaylistsAnchorClick);

            //delete user playlist
            $(userPlaylistView).on("deleteUserPlaylist", handleDeleteUserPlaylist);
            $(userPlaylistManager).on("userPlaylistDeleteSuccess", handleDeleteUserPlaylistSuccess);

            //empty playlist
            $(userManagementView).on("emptyOldUserPlaylistView", handleEmptyUserPlaylistView);
            $(playlistOptions).on("playlistCleared", handlePlaylistCleared);
            $(playlistView).on("playlistSpaceFillerClicked", handlePlaylistSpaceFillerClick);
            $(playlistView).on("allPlaylistItemsRemoved", handleAllPlaylistItemsRemoved);
        },


        handleTrackPick = function (event, src, title) {
            controlsView._handleTrackPicked(src, title);
        },

        handleAllPlaylistItemsRemoved = function () {
            controlsView._resetPlayer();
        },

        handleTrackEnd = function () {
            playlistView._playNextTrack();
        },

        handleShowLoadingAnimation = function () {
            playlistView._showLoadingAnimation();
        },

        handleHideLoadingAnimation = function () {
            playlistView._hideLoadingAnimation();
        },

        handleSearchButtonClickedEchoNest = function (event, srchObj) {
            mainModel._searchEchoNestTracks(srchObj);
        },

        handleSearchEchoNestSimilarTracks = function (event, srchObj) {
            mainModel._searchEchoNestSimilarTracks(srchObj);
        },

        handleSearchButtonClickedSoundcloud = function (event, srchObj) {
            mainModel._searchSoundcloudTracksSimple(srchObj);
        },

        handleNextButtonClick = function () {
            playlistView._playNextTrack();
        },

        handlePreviousButtonClick = function () {
            playlistView._playPreviousTrack();
        },

        handlePlaylistCreated = function (event, playlist) {
            playlistView._addPlaylist(playlist);
            playlistOptions._setIsPlaylistExisting(playlistView._isPlaylistExisting());
        },

        handleSoundlcoudTrackPicked = function (event, track) {
            playlistView._addPlaylist(track);
            playlistOptions._setIsPlaylistExisting(playlistView._isPlaylistExisting());
        },

        handlePlaylistItemClick = function (event, streamUrl, title) {
            controlsView._handleTrackPicked(streamUrl, title);
        },

        handleEchoNestTrackSearchResultsComplete = function (event, query, tracks) {
            pickTrackView._setEchoNestTrackIdPicker(query, tracks);
        },

        handleSoundcloudTrackSearchResultsComplete = function (event, tracks) {
            pickTrackView._setSoundcloudTrackPicker(tracks);
        },

        handleTrackIdPicked = function (event, srchObj) {
            mainModel._searchEchoNestTracks(srchObj);
        },

        handleSavePlaylistClicked = function (event, playlistName) {
            var JSONPlaylist = playlistView._getPlaylistAsJSON();
            userPlaylistManager._startPlaylistPost(JSONPlaylist, playlistName);
            resize._resizePlaylistHeight();
        },

        handlePostPlaylistClicked = function () {
            resize._resizePlaylistHeight();
        },

        handleUserPlaylistTitlesLoaded = function (event, userPlaylistObj) {
            userPlaylistView._setUserPlaylistView(userPlaylistObj);
        },

        handleUserPlaylistLoaded = function (event, playlist) {
            playlistView._addPlaylist(playlist);
            playlistOptions._setIsPlaylistExisting(playlistView._isPlaylistExisting());
        },

        handlePreviewPlayingStart = function () {
            controlsView._pauseTrack();
        },

        handlePreviewPlayingStop = function () {
            controlsView._playTrack();
        },

        handleResizeUserPlaylistHeight = function () {
            resize._resizeUserPlaylistHeight();
        },

        handleLoginButtonClick = function (event, username, password) {
            userManager._logIn(username, password);
        },

        handleLogoutClick = function () {
            userManager._logOut();
        },

        handleLoginSuccessful = function () {
            userManagementView._loginSuccessful();
            userPlaylistManager._loadPlaylists();
        },

        handleSignInSuccessful = function () {
            userManagementView._loginSuccessful();
        },

        handleLoginFailed = function (event, errorMessage) {
            userManagementView._loginFailed(errorMessage);
        },

        handleMyPlaylistsAnchorClick = function () {
            userPlaylistView._openUserPlaylistModal();
        },

        handleEmptyUserPlaylistView = function () {
            userPlaylistView._emptyUserPlaylistModal();
        },

        handleCancelPlaylistPostButton = function () {
            resize._resizePlaylistHeight();
        },

        handleSignInButtonClick = function (event, username, password, email) {
            userManager._signIn(username, password, email);
        },

        handleSignInFailed = function (event, errorMessage) {
            userManagementView._signInFailed(errorMessage);
        },

        handleDeleteUserPlaylist = function (event, playlistId) {
            userPlaylistManager._deleteUserPlaylist(playlistId);
        },

        handleDeleteUserPlaylistSuccess = function () {
            userPlaylistView._removeUserPlaylist();
        },

        handlePlaylistCleared = function () {
            controlsView._resetPlayer();
            userPlaylistView._removeLoadedStatus();
            playlistView._clearPlaylist();

            playlistOptions._setIsPlaylistExisting(playlistView._isPlaylistExisting());
        },

        handleAllPlaylistItemsRemoved = function () {
            controlsView._resetPlayer();
            userPlaylistView._removeLoadedStatus();

            playlistOptions._setIsPlaylistExisting(playlistView._isPlaylistExisting());
        },

        handlePlaylistSpaceFillerClick = function () {
            searchView._scrollToSearchField();
        },

        handleRotationChange = function () {
            resize._resizePlaylistHeight();
            resize._resizeUserPlaylistHeight();
        },

        handleSearchIconFocusIn = function () {
            playlistOptions._hideOptionsBox();
            controlsView._hideControlsBox();
            resize._resizePlaylistHeight();
        },

        handleSearchIconFocusOut = function () {
            controlsView._showControlsBox();
            playlistOptions._showOptionsBox();
            resize._resizePlaylistHeight();
        },

        handleSortEnabled = function () {
            controlsView._hideControlsBox();
            playlistView._addSortable()._disableSwipe();
            resize._resizePlaylistHeight();
        },

        handleSortDisabled = function () {
            controlsView._showControlsBox();
            playlistView._removeSortable()._enableSwipe();
            resize._resizePlaylistHeight();
        };


    that.init = init;

    return that;

}());
