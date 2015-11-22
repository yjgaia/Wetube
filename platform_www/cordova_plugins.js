cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.apache.cordova.inappbrowser/www/InAppBrowser.js",
        "id": "org.apache.cordova.inappbrowser.InAppBrowser",
        "pluginId": "org.apache.cordova.inappbrowser",
        "clobbers": [
            "window.open"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{}
// BOTTOM OF METADATA
});