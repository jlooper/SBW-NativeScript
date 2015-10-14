var pageCommon = require("ui/page/page-common");
var viewModule = require("ui/core/view");
var trace = require("trace");
var utils = require("utils/utils");
global.moduleMerge(pageCommon, exports);
var UIViewControllerImpl = (function (_super) {
    __extends(UIViewControllerImpl, _super);
    function UIViewControllerImpl() {
        _super.apply(this, arguments);
    }
    UIViewControllerImpl.new = function () {
        return _super.new.call(this);
    };
    UIViewControllerImpl.prototype.initWithOwner = function (owner) {
        this._owner = owner;
        this.automaticallyAdjustsScrollViewInsets = false;
        return this;
    };
    UIViewControllerImpl.prototype.didRotateFromInterfaceOrientation = function (fromInterfaceOrientation) {
        trace.write(this._owner + " didRotateFromInterfaceOrientation(" + fromInterfaceOrientation + ")", trace.categories.ViewHierarchy);
        if (this._owner._isModal) {
            var parentBounds = this._owner._UIModalPresentationFormSheet ? this._owner._nativeView.superview.bounds : UIScreen.mainScreen().bounds;
            utils.ios._layoutRootView(this._owner, parentBounds);
        }
    };
    UIViewControllerImpl.prototype.viewDidLoad = function () {
        trace.write(this._owner + " viewDidLoad", trace.categories.ViewHierarchy);
        this.view.autoresizesSubviews = false;
        this.view.autoresizingMask = UIViewAutoresizing.UIViewAutoresizingNone;
    };
    UIViewControllerImpl.prototype.viewDidLayoutSubviews = function () {
        trace.write(this._owner + " viewDidLayoutSubviews, isLoaded = " + this._owner.isLoaded, trace.categories.ViewHierarchy);
        if (this._owner._isModal) {
            var parentBounds = this._owner._UIModalPresentationFormSheet ? this._owner._nativeView.superview.bounds : UIScreen.mainScreen().bounds;
            utils.ios._layoutRootView(this._owner, parentBounds);
        }
        else {
            this._owner._updateLayout();
        }
    };
    UIViewControllerImpl.prototype.viewWillAppear = function () {
        trace.write(this._owner + " viewWillAppear", trace.categories.Navigation);
        this._owner._enableLoadedEvents = true;
        this._owner.onLoaded();
        this._owner._enableLoadedEvents = false;
    };
    UIViewControllerImpl.prototype.viewDidDisappear = function () {
        trace.write(this._owner + " viewDidDisappear", trace.categories.Navigation);
        this._owner._enableLoadedEvents = true;
        this._owner.onUnloaded();
        this._owner._enableLoadedEvents = false;
    };
    return UIViewControllerImpl;
})(UIViewController);
var Page = (function (_super) {
    __extends(Page, _super);
    function Page(options) {
        _super.call(this, options);
        this._isModal = false;
        this._ios = UIViewControllerImpl.new().initWithOwner(this);
    }
    Page.prototype.requestLayout = function () {
        _super.prototype.requestLayout.call(this);
        if (!this.parent && this.ios && this._nativeView) {
            this._nativeView.setNeedsLayout();
        }
    };
    Page.prototype._onContentChanged = function (oldView, newView) {
        _super.prototype._onContentChanged.call(this, oldView, newView);
        this._removeNativeView(oldView);
        this._addNativeView(newView);
    };
    Page.prototype.onLoaded = function () {
        if (this._enableLoadedEvents) {
            _super.prototype.onLoaded.call(this);
        }
    };
    Page.prototype.onUnloaded = function () {
        if (this._enableLoadedEvents) {
            _super.prototype.onUnloaded.call(this);
        }
    };
    Page.prototype._addNativeView = function (view) {
        if (view) {
            trace.write("Native: Adding " + view + " to " + this, trace.categories.ViewHierarchy);
            if (view.ios instanceof UIView) {
                this._ios.view.addSubview(view.ios);
            }
            else if (view.ios instanceof UIViewController) {
                this._ios.addChildViewController(view.ios);
                this._ios.view.addSubview(view.ios.view);
            }
        }
    };
    Page.prototype._removeNativeView = function (view) {
        if (view) {
            trace.write("Native: Removing " + view + " from " + this, trace.categories.ViewHierarchy);
            if (view.ios instanceof UIView) {
                view.ios.removeFromSuperview();
            }
            else if (view.ios instanceof UIViewController) {
                view.ios.removeFromParentViewController();
                view.ios.view.removeFromSuperview();
            }
        }
    };
    Object.defineProperty(Page.prototype, "ios", {
        get: function () {
            return this._ios;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Page.prototype, "_nativeView", {
        get: function () {
            return this.ios.view;
        },
        enumerable: true,
        configurable: true
    });
    Page.prototype._showNativeModalView = function (parent, context, closeCallback, fullscreen) {
        this._isModal = true;
        if (!parent.ios.view.window) {
            throw new Error("Parent page is not part of the window hierarchy. Close the current modal page before showing another one!");
        }
        if (fullscreen) {
            this._ios.modalPresentationStyle = UIModalPresentationStyle.UIModalPresentationFullScreen;
            utils.ios._layoutRootView(this, UIScreen.mainScreen().bounds);
        }
        else {
            this._ios.modalPresentationStyle = UIModalPresentationStyle.UIModalPresentationFormSheet;
            this._UIModalPresentationFormSheet = true;
        }
        var that = this;
        parent.ios.presentViewControllerAnimatedCompletion(this._ios, false, function completion() {
            if (!fullscreen) {
                utils.ios._layoutRootView(that, that._nativeView.superview.bounds);
            }
            that._raiseShownModallyEvent(parent, context, closeCallback);
        });
    };
    Page.prototype._hideNativeModalView = function (parent) {
        parent._ios.dismissModalViewControllerAnimated(false);
        this._isModal = false;
        this._UIModalPresentationFormSheet = false;
    };
    Page.prototype._updateActionBar = function (hidden) {
        var frame = this.frame;
        if (frame) {
            frame._updateActionBar(this);
        }
    };
    Page.prototype.onMeasure = function (widthMeasureSpec, heightMeasureSpec) {
        viewModule.View.measureChild(this, this.actionBar, widthMeasureSpec, heightMeasureSpec);
        _super.prototype.onMeasure.call(this, widthMeasureSpec, heightMeasureSpec);
    };
    Page.prototype.onLayout = function (left, top, right, bottom) {
        viewModule.View.layoutChild(this, this.actionBar, 0, 0, right - left, bottom - top);
        _super.prototype.onLayout.call(this, left, top, right, bottom);
    };
    Page.prototype._addViewToNativeVisualTree = function (view) {
        if (view === this.actionBar) {
            return true;
        }
        return _super.prototype._addViewToNativeVisualTree.call(this, view);
    };
    return Page;
})(pageCommon.Page);
exports.Page = Page;
