// ==UserScript==
// @name         Image viewer
// @namespace    http://devs.forumvi.com/
// @description  Image viewer for Firefox
// @version      1.0.4
// @icon         http://i.imgur.com/ItcjCPc.png
// @author       Zzbaivong
// @noframes
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    var theme = 'light'; // dark|light
    var url;
    if (theme === 'light') {
        url = 'data:image/gif;base64,R0lGODlhCgAKAIAAAAAAAP///yH5BAEAAAAALAAAAAAKAAoAAAIRhB2ZhxoM3GMSykqd1VltzxQAOw==';
    } else {
        url = 'data:image/gif;base64,R0lGODlhCgAKAPAAACIiIgAAACH5BAHoAwEALAAAAAAKAAoAAAIRjA2Zhwoc3GMSykqd1VltzxQAOw==';
    }
    if (document.contentType.indexOf('image/') === 0) {
        GM_addStyle('body{background:url(' + url + ') repeat scroll rgba(0, 0, 0, 0.3);}body > img {background-color: transparent !important;}body > img:hover {background: rgba(0, 0, 0, 0.4) !important; outline: 3px solid #333;}');
    }
}());