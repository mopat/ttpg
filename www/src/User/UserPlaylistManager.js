App.UserPlaylistManager = (function () {
    var that = {},
        playlistTitles = [],
        overwrite = false,

        init = function () {
            Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);

            return that;
        },

        _loadPlaylists = function () {
            var query = new Parse.Query("Playlists");
            query.equalTo("user", getCurrentUser());
            query.find({
                success: function (usersPosts) {
                    for (var i in usersPosts) {
                        var userPost = usersPosts[i],
                            JSONPlaylist = userPost._serverData.JSONPlaylist;
                        /*
                         Create playlist object
                         */
                        var playlistObj = {
                            title: userPost._serverData.title,
                            id: usersPosts[i].id
                        };
                        var playlistId = usersPosts[i].id,
                            playlistTitle = userPost._serverData.title;
                        playlistTitle.id = playlistId;
                        playlistTitles.push(playlistObj);

                        /*
                         trigger playlist titles load an give playlist object as parameter
                         */
                        var userPlaylistObj = createUserPlaylistObj(usersPosts[i]._serverData.title, usersPosts[i]._serverData.lastUpdate, usersPosts[i]._serverData.length, usersPosts[i].id, JSONPlaylist);
                        $(that).trigger("userPlaylistTitlesLoaded", [userPlaylistObj]);
                    }
                }
            });
        },

    /*
     start saving playlist in account if playlist name not exists
     */
        _startPlaylistPost = function (JSONPlaylist, playlistName) {
            if (JSONPlaylist != null) {
                if (getCurrentUser() != null) {
                    var isExisitingIndex = isPlaylistNameExisting(playlistName);
                    if (isExisitingIndex != -1) {
                        overwrite = true;
                        swal({
                            title: "Playlist name already exists",
                            text: "Are you sure you want to overwrite?",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Overwrite",
                            closeOnConfirm: false,
                            animation: false
                        }, function () {
                            var playlistId = playlistTitles[isExisitingIndex].id;
                            _deleteUserPlaylist(playlistId);
                            postPlaylist(JSONPlaylist, playlistName);
                            $(that).trigger("emptyOldUserPlaylistView");
                        });
                    }
                    else {
                        $(that).trigger("emptyOldUserPlaylistView");
                        /*
                         post playlist usign the function
                         */
                        postPlaylist(JSONPlaylist, playlistName);
                    }
                }
                else swal({
                    title: "Saving failed!",
                    text: "You need to login to save playlists..",
                    type: "error",
                    animation: false
                });
            }
            else swal({
                title: "Saving failed!",
                text: "Your Playlist is empty!",
                type: "error",
                animation: false
            });
        },

        isPlaylistNameExisting = function (playlistName) {
            for (var i in playlistTitles) {
                if (playlistTitles[i].title == playlistName) {
                    return i;
                }
            }
            return -1;
        },

    /*
     save playlist in account
     */
        postPlaylist = function (JSONPlaylist, playlistName) {
            var Playlists = Parse.Object.extend("Playlists"),
                query = new Parse.Query(Playlists),
                post = new Playlists();
            post.set("user", getCurrentUser());
            post.set("title", playlistName);
            post.set("lastUpdate", getCurrenTimeAndDate());
            post.set("length", JSONPlaylist.length);
            post.set("JSONPlaylist", JSONPlaylist);
            post.save(null, {
                success: function (post) {
                    swal({
                        title: "Your playlist has been saved!",
                        type: "success",
                        animation: false
                    });
                    // Find all posts by the current user
                    query.equalTo("user", getCurrentUser());
                    query.find({
                        success: function (usersPosts) {
                            // userPosts contains all of the posts by the current user.
                            for (var i in usersPosts) {
                                playlistTitles = [];
                                playlistTitles.push(usersPosts[i]._serverData.title);
                            }
                            _loadPlaylists();
                        }
                    });
                }
            });
        },

    /*
     start deleting the playlist from user account by retrieving object and use delete function to delete
     */
        _deleteUserPlaylist = function (playlistId) {
            playlistTitles = [];
            var Playlists = Parse.Object.extend("Playlists");
            var query = new Parse.Query(Playlists);
            query.get(playlistId, {
                success: function (playlist) {
                    deletePlaylist(playlist);
                },
                error: function (object, error) {
                    swal({
                        title: "Could not delete playlist",
                        text: error.message,
                        type: "success",
                        animation: false
                    });
                }
            });
        },

    /*
     delete playlist from account by the given playlist id
     */
        deletePlaylist = function (playlist) {
            playlist.destroy({
                success: function (playlist) {
                    if (overwrite == false)
                        swal({
                            title: "Playlist deleted",
                            type: "success",
                            timer: 500,
                            animation: false
                        });
                    overwrite = false;
                    $(that).trigger("userPlaylistDeleteSuccess");
                },
                error: function (myObject, error) {
                    swal({
                        title: "Could not delete Playlist.",
                        type: "error",
                        timer: 500,
                        animation: false
                    });
                    overwrite = false;
                }
            });
        },

    /*
     return datetime
     */
        getCurrenTimeAndDate = function () {
            var now = new Date(),
                year = now.getFullYear(),
                month = now.getMonth() + 1,
                day = now.getDate(),
                hour = now.getHours(),
                minute = now.getMinutes(),
                second = now.getSeconds();
            if (month.toString().length == 1) {
                month = '0' + month;
            }
            if (day.toString().length == 1) {
                day = '0' + day;
            }
            if (hour.toString().length == 1) {
                hour = '0' + hour;
            }
            if (minute.toString().length == 1) {
                minute = '0' + minute;
            }
            if (second.toString().length == 1) {
                second = '0' + second;
            }
            var dateTime = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;

            return dateTime;
        };

    that._loadPlaylists = _loadPlaylists;
    that._startPlaylistPost = _startPlaylistPost;
    that._deleteUserPlaylist = _deleteUserPlaylist;
    that.init = init;

    return that;

}());
