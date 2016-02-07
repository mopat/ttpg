App.UserManagementView = (function () {
    var that = {},
        $formBox = null,
        $loginAnchor = null,
        $loginUsername = null,
        $loginPassword = null,
        $loginButton = null,
        $loginForm = null,
        $loggedInUsername = null,
        $myPlaylistsAnchor = null,
        $logoutAnchor = null,
        $loggedInBox = null,
        $signInAnchor = null,
        $signInUsername = null,
        $signInPassword = null,
        $signInButton = null,
        $signInEmail = null,
        $signInForm = null,
        $cancelButton = null,

        init = function () {
            $formBox = $(".form-box");
            $loginAnchor = $("#login-anchor");
            $loginUsername = $("#login-username");
            $loginPassword = $("#login-password");
            $loginButton = $("#login-button");
            $loginForm = $("#login-form-box");
            $cancelButton = $(".cancel-button");
            $loggedInUsername = $("#loggedin-username");
            $myPlaylistsAnchor = $("#my-playlists-anchor");
            $logoutAnchor = $("#logout-anchor");
            $loggedInBox = $("#loggedin-box");

            $signInAnchor = $("#sign-in-anchor");
            $signInUsername = $("#sign-in-username");
            $signInPassword = $("#sign-in-password");
            $signInEmail = $("#sign-in-email");
            $signInButton = $("#sign-in-button");
            $signInForm = $("#sign-in-form-box");

            initHandler();

            return that;
        },

        initHandler = function () {
            $loginAnchor.on("click", handleLoginAnchorClick);
            $loginButton.on("click", handleLoginButtonClick);
            $myPlaylistsAnchor.on("click", handleMyPlaylistsAnchorClick);
            $logoutAnchor.on("click", handleLogoutAnchorClick);
            $cancelButton.on("click", handleCancelButtonClick);
            $signInAnchor.on("click", handleSignInAnchorClick);
            $signInButton.on("click", handleSignInButtonClick);
            $loginPassword.keydown(handleLoginEnter);
            $signInPassword.keydown(handleSignInEnter);
            $signInEmail.keydown(handleSignInEnter);
        },

        handleLoginEnter = function (e) {
            if (e.keyCode == 13) {
                handleLoginButtonClick();
            }
        },

        handleSignInEnter = function (e) {
            if (e.keyCode == 13) {
                handleSignInButtonClick();
            }
        },

        handleLoginButtonClick = function () {
            var username = $loginUsername.val(),
                password = $loginPassword.val();

            $(that).trigger("loginButtonClicked", [username, password]);
        },

        handleSignInButtonClick = function () {
            var username = $signInUsername.val(),
                password = $signInPassword.val(),
                email = $signInEmail.val();

            $(that).trigger("signInButtonClick", [username, password, email]);
        },

        _loginSuccessful = function () {
            $loginAnchor.hide();
            $loginForm.hide();

            $signInForm.hide();
            $signInAnchor.hide();

            var username = Parse.User.current().attributes.username;
            $loggedInUsername.html(username);
            $loggedInBox.show();
        },

        _loginFailed = function (errorMessage) {
            swal({
                title: "Login failed: " + errorMessage,
                animation: false,
                type: "error"
            });
        },

        _signInFailed = function (errorMessage) {
            swal({
                title: "Sign In failed: " + errorMessage,
                animation: false,
                type: "error"
            });
        },

        handleCancelButtonClick = function () {
            $loginForm.hide();
            $signInForm.hide();
        },

        handleMyPlaylistsAnchorClick = function () {
            $(that).trigger("myPlaylistsAnchorClick");
        },

        handleLogoutAnchorClick = function () {
            $loggedInBox.hide();
            $loginAnchor.show();
            $signInAnchor.show();

            $(that).trigger("emptyOldUserPlaylistView");
            $(that).trigger("handleLogoutClicked");
        },

        handleLoginAnchorClick = function () {
            if ($loginForm.is(":visible"))
                $loginForm.hide();
            else {
                $signInForm.hide();
                $loginForm.show();
            }
        },

        handleSignInAnchorClick = function () {
            if ($signInForm.is(":visible"))
                $signInForm.hide();
            else {
                $loginForm.hide();
                $signInForm.show();
            }
        };

    that._loginSuccessful = _loginSuccessful;
    that._loginFailed = _loginFailed;
    that._signInFailed = _signInFailed;
    that.init = init;

    return that;

}());
