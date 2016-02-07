App.UserManager = (function () {
    var that = {},

        init = function () {
            checkCurrentUser();

            return that;
        },

        checkCurrentUser = function () {
            $(document).ready(function () {
                if (getCurrentUser() != null) {
                    $(that).trigger("loginSuccessful");
                }
            });
        },

        _signIn = function (username, password, email) {
            var user = new Parse.User();
            user.set("username", username);
            user.set("password", password);
            user.set("email", email);

            user.signUp(null, {
                success: function (user) {
                    $(that).trigger("signInSuccessful");
                },
                error: function (user, error) {
                    $(that).trigger("signInFailed", [error.message]);
                }
            });
        },

        _logIn = function (username, password) {
            Parse.User.logIn(username, password, {
                success: function (user) {
                    currentUser = Parse.User.current();
                    $(that).trigger("loginSuccessful");
                },
                error: function (user, error) {
                    $(that).trigger("loginFailed", [error.message]);
                }
            });
        },

        _logOut = function () {
            Parse.User.logOut();
        };

    that._logIn = _logIn;
    that._signIn = _signIn;
    that._logOut = _logOut;
    that.init = init;

    return that;

}());
