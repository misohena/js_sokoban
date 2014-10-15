
(function(global){
    if(!global.misohena){global.misohena = {};}
    if(!global.misohena.js_sokoban){global.misohena.js_sokoban = {};}
    var mypkg = global.misohena.js_sokoban;

    var SCREEN_NORMAL = GameScreen.SCREEN_NORMAL = 0;
    var SCREEN_MAXIMIZED = GameScreen.SCREEN_MAXIMIZED = 1;
    var SCREEN_FULLSCREEN = GameScreen.SCREEN_FULLSCREEN = 2;

    var CONTROL_HEIGHT = 30;

    function px(v)
    {
        return v + "px";
    }


    mypkg.GameScreen = GameScreen;
    function GameScreen(originalWidth, originalHeight)
    {
        var lastScreenState = SCREEN_NORMAL; // 最後に検出したフルスクリーン状態。
        var maximizeInWindow = false; // 非フルスクリーン時にウィンドウ内最大化するならtrue。
        var contentAreaKeepRatio = true; //contentAreaの縦横比をoriginalWidth,originalHeightの比率に固定するならtrue。contentAreaKeepSizeがtrueならfalseでもtrueとして扱う。
        var contentAreaKeepSize = true; //contentAreaのwidth,heightをoriginalWidth,originalHeightに固定するならtrue。screenAreaとの大きさの違いはcontentArea.style.transformで調整する。

        // Create HTMLElements
        var screenArea = document.createElement("div");
        screenArea.style.background = "#000000";
        screenArea.style.overflow = "hidden";
        screenArea.className = "gamescreen-screenarea";

        var contentArea = document.createElement("div");
        contentArea.className = "gamescreen-contentarea";
        screenArea.appendChild(contentArea);

        var controlBarObj = new ControlBar("gamescreen-controlbar");
        screenArea.appendChild(controlBarObj.getElement());

        // Backup initial styles
        ///@todo 変更したときにバックアップして、不要になったら戻す。
        var oldBodyStyleOverflow = document.body.style.overflow;
        var oldScreenAreaStylePosition = screenArea.style.position;
        var oldViewportMetaElementContent;

        // Observe window size
        window.addEventListener("resize", onResize, false);
        window.addEventListener("orientationchange", onResize, false);
        screenArea.addEventListener("resize", onResize, false); //Chromeにおいて、翻訳バーや開発者用バーが消えるときにwindowのresizeイベントが発生しないので、screenAreaのresizeで代用する。

        // Update style
        onResize();


        // public methods
        this.getElement = function() { return screenArea;};
        this.getElementContentArea = function() { return contentArea;};
        this.getElementControlBar = function() { return controlBarObj.getElement();};
        this.getControlBar = function() { return controlBarObj;};

        // private methods
        function setStyleNormal()
        {
            document.body.style.overflow = oldBodyStyleOverflow;

            screenArea.style.display = "inline-block";
            screenArea.style.position = oldScreenAreaStylePosition;
            screenArea.style.left = "auto";
            screenArea.style.top = "auto";
            screenArea.style.width = "auto";
            screenArea.style.height = "auto";
            screenArea.style.zIndex = "auto";

            contentArea.style.position = "relative";
            contentArea.style.left = "0";
            contentArea.style.top = "0";
            contentArea.style.width = originalWidth + "px";
            contentArea.style.height = originalHeight + "px";
            contentArea.style.webkitTransformOrigin =
            contentArea.style.transformOrigin = "left top";
            contentArea.style.webkitTransform =
            contentArea.style.transform = "";

            controlBarObj.getElement().style.position = "static";
            controlBarObj.getElement().style.left = "0";
            controlBarObj.getElement().style.top = "0";
            controlBarObj.getElement().style.width = "auto";
        }
        function setStyleMaximized()
        {
            document.body.style.overflow = "hidden"; //hide body scrollbar

            var clientWidth = document.documentElement.clientWidth;
            var clientHeight = document.documentElement.clientHeight;

            screenArea.style.display = "block";
            screenArea.style.position = "fixed";
            screenArea.style.left = "0";
            screenArea.style.top = "0";
            screenArea.style.width = clientWidth + "px";
            screenArea.style.height = clientHeight + "px";
            screenArea.style.zIndex = "999999";

            fitContentAreaToScreenArea(clientWidth, clientHeight);
        }
        function setStyleFullscreen()
        {
            document.body.style.overflow = "hidden"; //hide body scrollbar

            screenArea.style.display = "block"; //inline-blockだとChromeでは100%で大きくならない。
            screenArea.style.position = oldScreenAreaStylePosition;
            screenArea.style.left = "auto";
            screenArea.style.top = "auto";
            screenArea.style.width = "100%";
            screenArea.style.height = "100%";
            screenArea.style.zIndex = "auto";

            var clientWidth = screenArea.clientWidth;
            var clientHeight = screenArea.clientHeight;

            fitContentAreaToScreenArea(clientWidth, clientHeight);
        }
        function fitContentAreaToScreenArea(screenWidth, screenHeight)
        {
            if(contentAreaKeepRatio || contentAreaKeepSize){

                var fitToHeight = screenWidth * originalHeight >= screenHeight * originalWidth;
                var contentAreaWidth = fitToHeight
                    ? originalWidth * screenHeight / originalHeight
                    : screenWidth;
                var contentAreaHeight = fitToHeight
                    ? screenHeight
                    : originalHeight * screenWidth / originalWidth;
                var controlBarHeight = controlBarObj.getElement().clientHeight;

                contentArea.style.position = "absolute";
                contentArea.style.left = (screenWidth - contentAreaWidth)/2 + "px";
                contentArea.style.top = (screenHeight - contentAreaHeight)/2 + "px";

                if(contentAreaKeepSize){
                    contentArea.style.width = originalWidth + "px";
                    contentArea.style.height = originalHeight + "px";
                    contentArea.style.webkitTransformOrigin =
                    contentArea.style.transformOrigin = "left top";
                    contentArea.style.webkitTransform =
                    contentArea.style.transform = "scale(" + (contentAreaWidth / originalWidth) + "," + (contentAreaHeight / originalHeight) + ")";
                }
                else{
                    contentArea.style.width = contentAreaWidth + "px";
                    contentArea.style.height = contentAreaHeight + "px";
                    contentArea.style.webkitTransformOrigin =
                    contentArea.style.transformOrigin = "left top";
                    contentArea.style.webkitTransform =
                    contentArea.style.transform = "";
                }
            }
            else{
                contentArea.style.width = screenWidth + "px";
                contentArea.style.height = screenHeight + "px";
            }

            controlBarObj.getElement().style.position = "absolute";
            controlBarObj.getElement().style.left = "0px";
            controlBarObj.getElement().style.top = (screenHeight - controlBarHeight) + "px";
            controlBarObj.getElement().style.width = screenWidth + "px";
        }

        function onResize()
        {
            if(getFullscreenMode()){
                setStyleFullscreen();
                setLastScreenState(SCREEN_FULLSCREEN);
            }
            else{
                if(maximizeInWindow){
                    setStyleMaximized();
                    setLastScreenState(SCREEN_MAXIMIZED);
                }
                else{
                    setStyleNormal();
                    setLastScreenState(SCREEN_NORMAL);
                }
            }
            updateViewportMetaElement();
        }

        // Maximize methods
        this.setMaximizeInWindow = setMaximizeInWindow;
        function setMaximizeInWindow(b)
        {
            maximizeInWindow = b;
            onResize();
        }

        // Fullscreen state methods

        this.setFullscreenMode = setFullscreenMode;
        function setFullscreenMode(b)
        {
            if(getFullscreenMode() == b){
                return;
            }
            if(screenArea){
                if(b){
                    if(screenArea.requestFullscreen) {
                        screenArea.requestFullscreen();
                    }
                    else if(screenArea.mozRequestFullScreen) {
                        screenArea.mozRequestFullScreen();
                    }
                    else if(screenArea.webkitRequestFullscreen) {
                        screenArea.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                    }
                    else if(screenArea.msRequestFullscreen) {
                        screenArea.msRequestFullscreen();
                    }

                }
                else{
                    if(document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                    else if(document.cancelFullScreen) {
                        document.cancelFullScreen();
                    }
                    else if(document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    }
                    else if(document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    }
                    else if(document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                }
            }
        }

        this.getFullscreenMode = getFullscreenMode;
        function getFullscreenMode()
        {
            return document.fullscreenElement
                || document.mozFullScreenElement
                || document.webkitFullscreenElement
                || document.msFullscreenElement;
        }

        this.isFullscreenAvailable = isFullscreenAvailable;
        function isFullscreenAvailable()
        {
            return document.fullscreenEnabled
                || document.mozFullScreenEnabled
                || document.webkitFullscreenEnabled
                || document.msFullscreenEnabled;
        }

        // Screen state tracking methods

        function setLastScreenState(state)
        {
            if(state != lastScreenState){
                lastScreenState = state;

                // ボタン状態を更新する。
                if(screenModeControl){
                    screenModeControl.updateState();
                }
                // バーを自動的に隠すかどうかを設定する。
                if(controlBarObj){
                    controlBarObj.setAutoHideMode(state != SCREEN_NORMAL);
                }
            }
        }
        this.getLastScreenState = getLastScreenState;
        function getLastScreenState()
        {
            return lastScreenState;
        }


        // Viewport methods (surpress

        function getViewportMetaElement()
        {
            var metaArray = document.getElementsByTagName("meta");
            for(var index = 0; index < metaArray.length; ++index){
                var elem = metaArray[index];
                if(elem.getAttribute("name") == "viewport"){
                    return elem;
                }
            }
            return null;
        }
        /**
         * name=viewportと指定してあるmeta要素を返します。無ければ作ります。
         */
        function aquireViewportMetaElement()
        {
            var currMeta = getViewportMetaElement();
            if(currMeta){
                return currMeta;
            }
            var newMeta = document.createElement("meta");
            newMeta.setAttribute("name", "viewport");
            document.getElementsByTagName("head")[0].appendChild(newMeta);
            return newMeta;
        }

        function getOriginalHeightWithControl()
        {
            return originalHeight + (getFullscreenMode() ? 0 : controlBarObj.getElement().clientHeight);
        }

        /**
         * viewportメタ要素を更新します。
         * 表示領域の高さに合わせた方が良いときは「height=SEC指定の画面高さ」を、
         * そうでないときは「width=SEC指定の画面幅」を設定します。
         */
        function updateViewportMetaElement()
        {
            // backup old content=
            var meta = aquireViewportMetaElement();
            if(oldViewportMetaElementContent === undefined){
                oldViewportMetaElementContent = meta.getAttribute("content") || "";
            }

            if(!getFullscreenMode() && !maximizeInWindow){
                meta.setAttribute("content", oldViewportMetaElementContent);
            }
            else{
                //disable user scaling
                meta.setAttribute("content", "initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no");
            }
        }


        // ScreenModeControl
        var screenModeControl = new ScreenModeControl(this);
    }
    GameScreen.wrap = wrapScreen;
    function wrapScreen(content, originalWidth, originalHeight){
        var screen = new GameScreen(originalWidth, originalHeight);
        screen.getElementContentArea().appendChild(content);
        return screen;
    }



    //
    // ControlBar Button
    //
    function createButton()
    {
        var BUTTON_OPACITY_NORMAL = "0.6";
        var BUTTON_OPACITY_HOVER = "1.0";
        var BUTTON_HEIGHT = CONTROL_HEIGHT;

        var div = document.createElement("div");
        div.style.position = "relative";
        div.style.height = px(BUTTON_HEIGHT);
        div.style.lineHeight = px(BUTTON_HEIGHT);
        div.style.display = "table-cell";
        div.style.textAlign = "center";
        div.style.verticalAlign = "middle";
        div.style.marginLeft = "2px";
        div.style.opacity = BUTTON_OPACITY_NORMAL;
        div.style.fontSize = px(BUTTON_HEIGHT * 0.5);
        div.style.cursor = "default";

        div.addEventListener("mouseenter", function(e){ div.style.opacity = BUTTON_OPACITY_HOVER;});
        div.addEventListener("mouseleave", function(e){ div.style.opacity = BUTTON_OPACITY_NORMAL;});

        div.setDisabled = function(b){
            div.style.display = b ? "none" : "";
            return div;
        };
        div.setIcon = function(url, urlW, urlH, iconX, iconY, iconW, iconH){
            div.style.width = px(iconW);
            div.style.height = px(iconH);
            div.style.background = "url(" + url + ") no-repeat " + px(iconX) + " " + px(iconY);
            div.style.backgroundSize = px(urlW) + " " + px(urlH);
            return div;
        };
        div.setOnClick = function(onClick){
            div.addEventListener("click", onClick);
            return div;
        };
        var textNode = null;
        div.setText = function(text){
            var newTextNode = text ? document.createTextNode(text) : null;
            if(newTextNode){
                div.insertBefore(newTextNode, textNode);
            }
            if(textNode){
                div.removeChild(textNode);
            }
            textNode = newTextNode;
            return div;
        };

        return div;
    }

    //
    // ControlBar
    //
    mypkg.GameScreen.ControlBar = ControlBar;
    function ControlBar(className)
    {
        var bar = document.createElement("div");
        bar.className = className;
        bar.style.height = px(CONTROL_HEIGHT);
        bar.style.background = "rgba(20,20,20,0.7)";
        bar.style.color = "#ffffff";

        this.getElement = function(){return bar;};

        this.add = add;
        function add(ctrl, leftOrRight)
        {
            ctrl.style.cssFloat = leftOrRight || "left";
            bar.appendChild(ctrl);
            return ctrl;
        }
        this.addButton = addButton;
        function addButton(leftOrRight)
        {
            return add(createButton(), leftOrRight);
        }

        // Auto Hide Mode

        var autoHideMode = false;
        var timer = null;
        var opacity = 1.0;
        var opacityVel = 0;
        var TIMER_PERIOD = 20;
        var OPACITY_VEL_HIDE = -0.01;
        function onTime()
        {
            opacity += opacityVel;

            if((opacityVel < 0 && opacity <= 0) ||
               (opacityVel > 0 && opacity >= 1.00) ||
               (opacityVel == 0)){
                cancelBarAnimation();
            }
            bar.style.opacity = Math.min(1, Math.max(0, opacity));
        }
        function cancelBarAnimation()
        {
            if(timer !== null){
                clearInterval(timer);
                timer = null;
            }
        }
        function hideBar(opacityFrom)
        {
            cancelBarAnimation();
            opacity = 1.0 - OPACITY_VEL_HIDE * 1000 / TIMER_PERIOD;
            opacityVel = OPACITY_VEL_HIDE;
            timer = setInterval(onTime, TIMER_PERIOD);
        }
        function showBar()
        {
            cancelBarAnimation();
            bar.style.opacity = 1.0;
        }
        function initAutoHideMode()
        {
            bar.addEventListener("mousemove", function(e){
                if(autoHideMode){
                    showBar();
                }
            }, false);
            bar.addEventListener("mouseleave", function(e){
                if(autoHideMode){
                    hideBar();
                }
            }, false);
            //bar.addEventListener("touchend", function(e){
            //    if(autoHideMode){
            //        hideBar();
            //    }
            //}, false); ///@todo 
        }
        this.setAutoHideMode = setAutoHideMode;
        function setAutoHideMode(b)
        {
            autoHideMode = b;
            if(b){
                hideBar();
            }
            else{
                showBar();
            }
        }
        initAutoHideMode();
    }


    //
    // Screen Mode Buttons
    //
    mypkg.GameScreen.ScreenModeControl = ScreenModeControl;
    function ScreenModeControl(gameScreen)
    {
        var ICON_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAeCAMAAADQFyqnAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRF////////VXz1bAAAAAJ0Uk5T/wDltzBKAAAAzUlEQVR42uSX0Q7CMAhFD///00aTRSHQQm3FaB/Hximw3d4hTYuvBi/ujvuKLpNKsL2oFzCjjR8Ex8k5Cn50XS89EfzodYMbJR70BXaCZIthXGrUsHBX6dRzcG0OJbDtfuKTQD/8nFEZHFUsU7DJVQRXBWcXWJrA0gSWfwbTBKYJzAr4DQExwkxC5qmdCGMwCTBDsNbenW81c/DCCZlyMxpsznGj+Thx7RRiI+B3MjJ7M7OTs0M5s1eSnpwNWwDvMbwnwJ8x9L/173QTYAD91gyN3Y8dkgAAAABJRU5ErkJggg==";
        var ICON_WIDTH = 30; //oroginal 30px
        var ICON_HEIGHT = 30; //original 30px
        var ICON_X_SCREEN_NORMAL = -ICON_WIDTH*0;
        var ICON_X_SCREEN_MAX_DOWN = -ICON_WIDTH*1;
        var ICON_X_SCREEN_MAX_UP = -ICON_WIDTH*2;
        var ICON_X_SCREEN_FULL = -ICON_WIDTH*3;
        var ICON_Y_NORMAL = -ICON_HEIGHT*0;
        var ICON_URL_WIDTH = ICON_WIDTH*4;
        var ICON_URL_HEIGHT = ICON_HEIGHT*1;

        var controlBar = gameScreen.getControlBar();

        function addBtn(iconX, maximized, fullscreen)
        {
            function changeMode(e)
            {
                if(gameScreen){
                    if(typeof(maximized) == "boolean"){
                        gameScreen.setMaximizeInWindow(maximized);
                    }
                    if(typeof(fullscreen) == "boolean"){
                        gameScreen.setFullscreenMode(fullscreen);
                    }
                }
            }
            return controlBar.addButton("right").
                setOnClick(changeMode).
                setIcon(ICON_URL, ICON_URL_WIDTH, ICON_URL_HEIGHT,
                        iconX, ICON_Y_NORMAL, ICON_WIDTH, ICON_HEIGHT);
        }

        var screenFullButton = addBtn(ICON_X_SCREEN_FULL, null, true);
        var screenMaxDownButton = addBtn(ICON_X_SCREEN_MAX_DOWN, true, false);
        var screenMaxUpButton = addBtn(ICON_X_SCREEN_MAX_UP, true, false);
        var screenNormalButton = addBtn(ICON_X_SCREEN_NORMAL, false, false);
        updateState();

        this.updateState = updateState;
        function updateState()
        {
            var state = gameScreen != null ? gameScreen.getLastScreenState() : -1;
            if(screenNormalButton != null){
                screenNormalButton.setDisabled(state == GameScreen.SCREEN_NORMAL);
            }
            if(screenMaxDownButton != null){
                screenMaxDownButton.setDisabled(state != GameScreen.SCREEN_FULLSCREEN);
            }
            if(screenMaxUpButton != null){
                screenMaxUpButton.setDisabled(state != GameScreen.SCREEN_NORMAL);
            }
            if(screenFullButton != null){
                screenFullButton.setDisabled(
                    state == GameScreen.SCREEN_FULLSCREEN ||
                    !(gameScreen && gameScreen.isFullscreenAvailable()));
            }
        }
    }
})(this);
