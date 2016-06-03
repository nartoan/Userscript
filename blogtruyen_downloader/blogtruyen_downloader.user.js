// ==UserScript==
// @id           blogtruyen-downloader@devs.forumvi.com
// @name         blogtruyen downloader
// @namespace    http://devs.forumvi.com
// @description  Download manga on blogtruyen.com
// @version      1.2.0
// @icon         http://i.imgur.com/qx0kpfr.png
// @author       Zzbaivong
// @license      MIT
// @include      http://blogtruyen.com/truyen/*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @require      https://greasyfork.org/scripts/19855-jszip/code/jszip.js?version=126859
// @require      https://greasyfork.org/scripts/18532-filesaver/code/FileSaver.js?version=128198
// @noframes
// @connect      blogtruyen.com
// @connect      blogspot.com
// @connect      imgur.com
// @connect      zdn.vn
// @connect      postimg.org
// @connect      *
// @supportURL   https://github.com/baivong/Userscript/issues
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

jQuery(function ($) {
    'use strict';

    function deferredAddZip(url, filename, current, total, zip, $download) {
        var deferred = $.Deferred();

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            onload: function (response) {
                zip.file(filename, response.response);
                $download.text(counter[current] + '/' + total);
                ++counter[current];
                deferred.resolve(response);
            },
            onerror: function (err) {
                console.error(err);
                deferred.reject(err);
            }
        });

        return deferred;
    }

    function nextDownload() {
        ++nextChapter;
        autoDownload();
    }

    function autoDownload() {
        if (disableDownloadAll) return;
        if (nextChapter >= totalChapter) return;

        $downloadAllText.text((nextChapter + 1) + '/' + totalChapter);

        var $next = $downloadList.eq(nextChapter);
        if ($next.text() !== 'Download') {
            nextDownload();
            return;
        }

        if (nextChapter >= totalChapter) return;

        $next.click();
    }

    function pad(str, max) {
        str = str.toString();
        return str.length < max ? pad('0' + str, max) : str;
    }

    function getChaper(obj) {
        var $this = $(obj.download),
            zip = new JSZip(),
            deferreds = [],
            images = [];

        $this.text('Waiting...');

        obj.contentChap.children('img').each(function (i, v) {
            images[i] = v.src.replace(/\?imgmax=0/, '').replace(/.+&url=/, '');
            // images[i] = images[i].replace(/\d+\.bp\.blogspot\.com/, 'lh3.googleusercontent.com')
        });

        $.each(images, function (i, v) {
            var filename = v.replace(/.*\//g, ''),
                filetype = filename.replace(/.*\./g, '');

            if (filetype === filename) filetype = 'jpg';
            filename = pad(i, 3) + '.' + filetype;

            deferreds.push(deferredAddZip(images[i], filename, obj.current, images.length, zip, $this));
        });

        $.when.apply($, deferreds).done(function () {
            zip.generateAsync({
                type: 'blob'
            }).then(function (blob) {
                var zipName = $.trim(obj.nameChap) + '.zip';

                $this.text('Complete').css('color', 'orange').attr({
                    href: window.URL.createObjectURL(blob),
                    download: zipName
                }).off('click');

                saveAs(blob, zipName);

                doc.title = '[⇓ ' + (++complete) + '/' + progress + '] ' + tit;
            }, function (reason) {
                console.error(reason);
            });
        }).fail(function (err) {
            $this.text('Fail').css('color', 'red');
            console.error(err);
        }).always(function () {
            nextDownload();
            if (--alertUnload <= 0) {
                $(window).off('beforeunload');
            }
        });
    }

    var $download = $('<a>', {
            'class': 'chapter-download',
            href: '#download',
            text: 'Download'
        }),
        counter = [],
        current = 0,
        alertUnload = 0,
        complete = 0,
        progress = 0,
        doc = document,
        tit = doc.title,
        disableDownloadAll = true,
        $downloadAll,
        $downloadAllText,
        $downloadList,
        nextChapter = 0,
        totalChapter = 0;

    window.URL = window.URL || window.webkitURL;

    if (/\/chap-.+$/.test(location.pathname)) {

        $('.linkchapter select').first().replaceWith($download);

        $download.one('click', function (e) {
            e.preventDefault();

            ++progress;

            $(window).on('beforeunload', function () {
                return 'Progress is running...';
            });
            ++alertUnload;

            counter[current] = 1;
            getChaper({
                download: this,
                contentChap: $('#content'),
                nameChap: $('h1').text(),
                current: current
            });
        });

    } else {

        $('#list-chapters .download').html($download);

        $downloadAll = $('<span>', {
            id: 'DownloadAllButton',
            css: {
                display: 'inline-block',
                borderColor: 'orangered',
                backgroundColor: 'orange'
            },
            html: '<span class="icon-circle-arrows-bottom"></span>'
        });
        $downloadAllText = $('<span>', {
            text: 'Download all'
        });
        $downloadList = $('.chapter-download');
        totalChapter = $downloadList.length;

        $downloadList.each(function () {

            $(this).one('click', function (e) {
                e.preventDefault();

                ++progress;

                var _this = this,
                    $chapLink = $(_this).closest('p').find('.title a');

                if (alertUnload <= 0) {
                    $(window).on('beforeunload', function () {
                        return 'Progress is running...';
                    });
                }
                ++alertUnload;

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: $chapLink.attr('href'),
                    responseType: 'text',
                    onload: function (response) {
                        var $data = $(response.responseText);

                        counter[current] = 1;
                        getChaper({
                            download: _this,
                            contentChap: $data.find('#content'),
                            nameChap: $chapLink.text(),
                            current: current
                        });
                        ++current;
                    },
                    onerror: function (err) {
                        console.error(err);
                    }
                });
            }).one('contextmenu', function (e) {
                e.preventDefault();

                $(this).off('click').text('Skip').css('color', 'blueviolet').attr('href', '#skip');
            });
        });

        $('.fl-r.like-buttons').append($downloadAll.append($downloadAllText));
        $downloadAll.one('click', function () {
            disableDownloadAll = false;
            autoDownload();
        });

    }

});