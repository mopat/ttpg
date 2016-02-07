App.MainModel = (function () {
    var that = {},
        scLimit = 50,
        playlist = [],
        stringScoreTolerance = 0.5,
        requestInterval = null,

        init = function () {
            initSoundCloud();

            return that;
        },

        initSoundCloud = function () {
            SC.initialize({
                client_id: SC_CLIENT_ID
            });
        },

    /*
     search all echoNest tracks but not similar
     */
        _searchEchoNestTracks = function (srchObj) {
            $(that).trigger("showLoadingAnimation");
            var queryFactory = new QueryFactory();
            var queryBuilder = queryFactory.createQuery({
                type: srchObj.type,
                query: srchObj.query,
                option: srchObj.option,
                trackID: srchObj.trackID,
                searchLimit: srchObj.searchLimit
            });

            $.ajax({
                type: "GET",
                url: queryBuilder.queryUrl,
                cache: false,
                success: function (jsonObject) {
                    if (jsonObject.response.songs != undefined) {
                        var tracks = removeDuplicates(jsonObject.response.songs, "echoNest");
                        searchSoundCloudTracks(tracks);
                    }
                    else {
                        $(that).trigger("hideLoadingAnimation");
                        swal({
                            title: "No results found for " + '"' + srchObj.query + '"' + " in " + srchObj.type,
                            type: "error",
                            animation: false
                        });
                    }

                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    swal({
                        title: "No results found for " + '"' + srchObj.query + '"' + " in " + srchObj.type,
                        type: "error",
                        animation: false
                    });
                    $(that).trigger("hideLoadingAnimation");
                }
            });

            return this;
        },

    /*
     search similar echonest tracks
     */
        _searchEchoNestSimilarTracks = function (srchObj) {
            var getIdQuery = "http://developer.echonest.com/api/v4/song/search?api_key=" + ECHONEST_API_KEY + "&format=json&results=20" + "&title=" + srchObj.query + "&sort=song_hotttnesss-desc";
            $.ajax({
                type: "GET",
                url: getIdQuery,
                cache: false,
                success: function (jsonObject) {
                    var tracks = removeDuplicates(jsonObject.response.songs, "echoNest");
                    $(that).trigger("echoNestTrackSearchResultsComplete", [srchObj.query, tracks]);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    swal({
                        title: "No results found for " + '"' + srchObj.query + '"' + " in " + srchObj.type,
                        type: "error",
                        animation: false
                    });
                }
            });

            return this;
        },

    /*
     search single soundcloud track
     */
        _searchSoundcloudTracksSimple = function (srchObj) {
            $(that).trigger("showLoadingAnimation");
            playlist = [];
            $.ajax({
                url: getScUrl(srchObj.query),
                data: {
                    format: 'json'
                },
                dataType: 'json',
                success: function (data) {
                    if (data.length != 0) {
                        var filteredTracks = filterResults(data, srchObj.query);
                        $(that).trigger("soundcloudTrackSearchResultsComplete", [filteredTracks]);
                    }
                    $(that).trigger("hideLoadingAnimation");
                },
                error: function () {
                    swal({
                        title: "No results found for " + '"' + srchObj.query + '"' + " in " + srchObj.type,
                        type: "error",
                        animation: false
                    });
                    $(that).trigger("hideLoadingAnimation");
                },
                type: 'GET'
            });

            return this;
        },

    /*
     execute search in soundcloud with the given tracks from echonest
     */
        searchSoundCloudTracks = function (tracks) {
            playlist = [];
            var count = tracks.length;

            requestInterval = setInterval(function () {
                if (count > 0 && tracks.length > 0) {
                    var artist = normalize(tracks[0].artist_name);
                    var title = normalize(tracks[0].title);
                    var query = artist + " " + title;
                    ajaxQuery(query)
                }
                tracks.splice(0, 1);

                /*
                 ajax function to start a soundcloud request each 200 milliseconds
                 for preventing "too many requests"-error in soundcloud
                 */
                function ajaxQuery(query) {
                    return $.ajax({
                        url: getScUrl(query),
                        data: {
                            format: 'json'
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            count--;
                        },
                        dataType: 'json',
                        success: function (data) {

                            count--;
                            if (data.length != 0) {
                                //filter tracks and add them
                                var filteredTracks = filterResults(data, query);
                                addToPlayList(filteredTracks);
                            }
                            if (count == 0) {
                                //remove duplicates and show them in the playlist
                                playlist = removeDuplicates(playlist, "soundCloud");
                                setPlaylistView();
                                clearInterval(requestInterval);
                                $(that).trigger("hideLoadingAnimation");
                            }
                        },
                        type: 'GET'
                    });
                }
            }, 200);
        },

    /*
     remove duplicates for echonest or soundcloud and return unique tracks
     */
        removeDuplicates = function (tracks, sender) {
            var uniqueTracks = [];
            var indentification = [];
            indentification.length = tracks.length;

            var result = [];
            $.each(indentification, function (i, e) {
                if (sender == "echoNest")
                    indentification[i] = tracks[i].artist_name + " - " + tracks[i].title;
                else indentification[i] = tracks[i].id;
                if ($.inArray(indentification[i], result) == -1) {
                    result.push(indentification[i]);
                    uniqueTracks.push(tracks[i])
                }
            });
            return uniqueTracks;
        },

        addToPlayList = function (filteredTracks) {
            var tracks = [];

            //sort tracks by score
            filteredTracks.sort(sortByFavoritingsCount);
            //take tracks with best match
            for (var i = 0; i < 20; i++) {
                tracks[i] = filteredTracks[i];
            }
            //sort tracks by playback_count
            tracks.sort(sortByFavoritingsCount);
            // console.log(tracks[0].title);
            //take the first element and add id to the playlist
            if (tracks[0] != undefined)
                playlist.push(tracks[0]);
        },

    /*
     filter the results due to problems with the SC API.
     some tracks may not be playlable without filtering manually
     */
        filterResults = function (tracks, query) {
            var count = 0,
                filteredTracks = [];

            for (var i in tracks) {
                var currentTitle = tracks[i].title;
                currentTitle = normalize(currentTitle);
                // console.log(currentTitle);

                var score = currentTitle.score(query),
                    streamable = tracks[i].streamable,
                    sharing = tracks[i].sharing,
                    duration = tracks[i].duration;

                if (score > stringScoreTolerance && streamable == true && sharing == "public" && duration > 90000) {
                    count++;
                    tracks[i].score = score;
                    filteredTracks.push(tracks[i]);
                }
            }
            return filteredTracks;
        },

    /*
     sort tracks by favoritings count so best tracks will be picked
     */
        sortByFavoritingsCount = function (a, b) {
            return b.favoritings_count - a.favoritings_count;
        },

    /*
     remove whitespaces and normalize
     */
        normalize = function (string) {
            return string.replace("-", " ").replace(/[^\w\s.]/gi, ' ').replace(/\s{2,}/g, ' ').toLowerCase().trim();
        },

        setPlaylistView = function () {
            $(that).trigger("playlistCreated", [playlist]);
        },

        getScUrl = function (query) {
            return "https://api.soundcloud.com/tracks?&q=" + query + "&client_id=" + SC_CLIENT_ID + "&limit=" + scLimit;
        };

    that._searchEchoNestTracks = _searchEchoNestTracks;
    that._searchEchoNestSimilarTracks = _searchEchoNestSimilarTracks;
    that._searchSoundcloudTracksSimple = _searchSoundcloudTracksSimple;
    that.init = init;

    return that;

}());