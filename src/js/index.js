const { Sortable } = require('@shopify/draggable');
const fs = require('fs');
const { remote } = require('electron');
const $ = require("../libs/jquery-3.4.1.slim.min.js");

const g_appName = 'Dialog Editor';

let g_filePath = null;
let g_localizationData = null;

let addCardBtn = null;
let g_cardCount = 0;

let g_modified = false;

const updateAddButton = () => addCardBtn.children('.info').text(g_cardCount);
const updateAppTitle = () => $('.appname').text(g_appName + ' - ' + (g_filePath ? g_filePath.split('\\').pop().split('.')[0] : '(New file)') + (g_modified ? '*' : ''));

function addCard(charText, charAttached, playerText, playerAttached, sequential, launching) {
    addCardBtn.before(`
        <div class="card card--isDraggable">
            <div class="info">
                <id>${g_cardCount}</id>
                <div class="delete-card"></div>
            </div>
            <div class="pair">
                <div class="msg">
                    <div class="text" contenteditable="true">${(charText ? charText : '')}</div>
                    <div class="attached" contenteditable="true">${(charAttached ? charAttached : '')}</div>
                </div>
                <div class="delimiter"></div>
                <div class="msg">
                    <div class="text" contenteditable="true">${(playerText ? playerText : '')}</div>
                    <div class="attached" contenteditable="true">${(playerAttached ? playerAttached : '')}</div>
                </div>
            </div>
            <div class="seq indicator ${(sequential ? 'enabled' : '')}"><tooltip>Sequential call</tooltip></div>
            <div class="lau indicator ${(launching ? 'enabled' : '')}"><tooltip>Send at launch</tooltip></div>
        </div>
    `);

    g_cardCount += 1;

    updateAddButton()
}

function sortCardIds() {
    let cardIds = $('.wrapper .card--isDraggable .info id');

    for (let i = 0; i < g_cardCount; i += 1) {
        $(cardIds).eq(i).text(i);
    }
}

function saveDocument() {
    if (!g_modified) {
        return;
    }

    if (g_filePath == null) {
        let saveFilePath =
            remote.dialog.showSaveDialogSync(
                BrowserWindow,
                {
                    properties: ['openFile'],
                    filters: [
                        { name: 'Chat File', extensions: ['json', 'en'] }
                    ]
                }
            );

        if (saveFilePath === undefined) {
            //error no path
            return;
        }
        else {
            g_filePath = saveFilePath;
        }
    }

    $('.card .pair .msg .text').each((i, e) => {
        g_localizationData.dialog_lines.push($(e).text());
    });

    $('.card .pair .msg .attached').each((i, e) => {
        g_localizationData.attached.push($(e).text());
    })

    $('.card .seq').each((i, e) => {
        g_localizationData.sequential.push($(e).hasClass('enabled'));
    })

    $('.card .lau').each((i, e) => {
        g_localizationData.launching.push($(e).hasClass('enabled'));
    })

    fs.writeFileSync(g_filePath, JSON.stringify(g_localizationData, null, 4));

    g_localizationData.dialog_lines = [];
    g_localizationData.attached = [];
    g_localizationData.sequential = [];
    g_localizationData.launching = [];

    g_modified = false;

    updateAppTitle();
}

$(() => {
    g_localizationData = {};
    g_localizationData.dialog_lines = [];
    g_localizationData.attached = [];
    g_localizationData.sequential = [];
    g_localizationData.launching = [];

    let BrowserWindow = remote.getCurrentWindow();

    //BrowserWindow.toggleDevTools();

    //Ctrl+S
    $(document).on('keydown', e => {
        if (e.ctrlKey && e.keyCode == 83 /*s*/) {
            saveDocument();
        }
    })

    $('#btn-new').click(() => {
        $('.card--isDraggable').remove();
        g_cardCount = 0;
        g_filePath = null;
        g_localizationData = null;

        updateAppTitle(true);
        updateAddButton();
    });

    $('#btn-open').click(() => {
        let filePaths =
            remote.dialog.showOpenDialogSync(
                BrowserWindow,
                {
                    properties: ['openFile'],
                    filters: [{ name: 'Chat File', extensions: ['json', 'en'] }]
                }
            );

        console.log(filePaths);

        if (filePaths === undefined) {
            return
        }
        else {
            g_filePath = filePaths[0]
        }

        fs.readFile(g_filePath, (err, data) => {
            if (err) throw err;

            $('.card--isDraggable').remove();
            g_cardCount = 0;

            g_localizationData = JSON.parse(data.toString());

            for (let i = 0; i < g_localizationData.dialog_lines.length; i += 2) {
                addCard(
                    g_localizationData.dialog_lines[i],
                    g_localizationData.attached[i],
                    g_localizationData.dialog_lines[i + 1],
                    g_localizationData.attached[i + 1],
                    g_localizationData.sequential[i >> 1],
                    g_localizationData.launching[i >> 1]
                );
            }

            g_localizationData.dialog_lines = [];
            g_localizationData.attached = [];
            g_localizationData.sequential = [];
            g_localizationData.launching = [];

            g_modified = false;

            updateAppTitle();
        })
    });

    $('#btn-save').click(saveDocument);

    $('#btn-min').click(() => {
        BrowserWindow.minimize();
    });

    $('#btn-max').click(() => {
        if (BrowserWindow.isMaximized()) {
            BrowserWindow.unmaximize();
        }
        else {
            BrowserWindow.maximize();
        }
    });

    $('#btn-close').click(() => {
        BrowserWindow.close();
    });

    //

    addCardBtn = $('#add-card');
    addCardBtn.click(() => {
        addCard();
    });

    //
    const containerSelector = '.wrapper';
    const sortable = new Sortable(document.querySelectorAll(containerSelector), {
        draggable: '.card--isDraggable',
        mirror: {
            appendTo: containerSelector,
            constrainDimensions: true,
            xAxis: false
        }
    });

    sortable.on('sortable:stop', () => {
        setTimeout(sortCardIds, 100);
    });

    let $wrapper = $(containerSelector);

    $wrapper.on('click', '.card', () => {
        g_modified = true;

        updateAppTitle();
    })

    $wrapper.on('click', '.indicator', e => {
        let indicator = $(e.currentTarget);

        indicator.hasClass('enabled') ?
            indicator.removeClass('enabled') :
            indicator.addClass('enabled');
    });

    $wrapper.on('click', '.card .delete-card', e => {
        // @todo check why e.currentTarget is different in console log
        // console.log(e);
        // console.log(e.currentTarget);

        $(e.currentTarget).closest('.card').remove();

        g_cardCount -= 1;

        sortCardIds();
        updateAddButton();
    });
})

