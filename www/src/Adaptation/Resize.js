/*
 Resizing width and height of the lists
 */
App.Resize = (function () {
    var that = {},
        $sortSwitchBox = null,
        $playlist = null,
        $header = null,
        $controlsBox = null,

        init = function () {
            $sortSwitchBox = $("#sticky-sort-switch-box");
            $playlist = $("#playlist");
            $header = $("#header");
            $controlsBox = $("#controls-box");

            $(document).on("ready", function () {
                _resizePlaylistHeight();
            });

            window.addEventListener("resize", function () {
                _resizePlaylistHeight();
            }, false);

            $( window ).on( "orientationchange", function() {
                _resizePlaylistHeight();
            });
            return that;
        },

        _resizePlaylistHeight = function () {
            var height = $(document).height() - $header.height();
            if ($controlsBox.is(":visible"))
                height -= $controlsBox.height();

            $playlist.css("height", height);
            return this;
        },

        _resizeUserPlaylistHeight = function () {
            $(".user-playlist").height($("#user-playlist-box").height() - ($(".user-playlist-container").height()) + 30);
        };

    that._resizePlaylistHeight = _resizePlaylistHeight;
    that._resizeUserPlaylistHeight = _resizeUserPlaylistHeight;
    that.init = init;

    return that;
}());
