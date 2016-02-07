var PARSE_APPLICATION_ID = "yOTWw2niwOWRTql2MtewglSVcXYQa36Bld6ztZX3",
    PARSE_JAVASCRIPT_KEY = "wyt0MOGfNQxPCEC3fFDkxGmpukQ7ulbOzeMY27Ql",

    SC_CLIENT_ID = "23a3031c7cd251c7c217ca127777e48b",

    ECHONEST_API_KEY = "N2U2OZ8ZDCXNV9DBG",

    STORAGE_IDENTIFIER = "stored_playlist",

    PLAYED_TRACK_IDENTIFIER = "played_track";

var rotation = "0";
var userSide = "bottom";
var tabletopMode = false;

function setRotation(value) {
    rotation = value;
}

function getRotation() {
    return rotation;
}

function setUserSider(side) {
    userSide = side;
}

function getUserSide() {
    return userSide;
}

function setTabletopMode(isTabletopMode) {
    tabletopMode = isTabletopMode;
}

function isTabletopMode() {
    return tabletopMode;
}
