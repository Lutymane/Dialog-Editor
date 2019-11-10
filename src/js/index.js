const { Sortable } = require('@shopify/draggable');
const fs = require('fs');
const { remote } = require('electron');
const $ = require("../libs/jquery-3.4.1.slim.min.js");

const g_appName = 'Dialog Editor';

let g_filePath = null;

let addCardBtn = null;
let g_cardCount = 0;

const updateAddButton = () => addCardBtn.children('.id').text(g_cardCount);
const updateAppTitle = (modified) => $('.appname').text(g_appName + ' - ' + (g_filePath ? g_filePath.split('\\').pop().split('.')[0] : '(New file)') + (modified ? '*' : ''));

function addCard(charText, charAttached, playerText, playerAttached, sequential, launching) {
    addCardBtn.before(`
        <div class="card card--isDraggable">
            <div class="id">${g_cardCount}</div>
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
            <div class="seq indicator ${(sequential ? 'enabled' : '')}"></div>
            <div class="lau indicator ${(launching ? 'enabled' : '')}"></div>
        </div>
    `);

    g_cardCount += 1;

    updateAddButton()
}

$(() => {
    let BrowserWindow = remote.getCurrentWindow();

    BrowserWindow.toggleDevTools();

    $('#btn-new').click(() => {
        $('.card--isDraggable').remove();
        g_cardCount = 0;
        g_filePath = null;

        updateAppTitle(true);
        updateAddButton();
    });

    $('#btn-open').click(() => {
        let filePaths =
            remote.dialog.showOpenDialogSync(
                BrowserWindow,
                {
                    properties: ['openFile'],
                    filters: [{ name: 'Chat File', extensions: ['json'] }]
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

            let chatObject = JSON.parse(data.toString());

            for (let i = 0; i < chatObject.lines.length; i += 2) {
                addCard(
                    chatObject.lines[i],
                    chatObject.attached[i],
                    chatObject.lines[i + 1],
                    chatObject.attached[i + 1],
                    chatObject.sequential[i >> 1],
                    chatObject.launching[i >> 1]
                );
            }

            chatObject = null;

            updateAppTitle();
        })
    });

    $('#btn-save').click(() => {

        let chatObject = {
            lines: [],
            attached: [],
            sequential: [],
            launching: []
        };

        $('.card .pair .msg .text').each((i, e) => {
            chatObject.lines.push($(e).text());
        });

        $('.card .pair .msg .attached').each((i, e) => {
            chatObject.attached.push($(e).text());
        })

        $('.card .seq').each((i, e) => {
            chatObject.sequential.push($(e).hasClass('enabled'));
        })

        $('.card .lau').each((i, e) => {
            chatObject.launching.push($(e).hasClass('enabled'));
        })

        console.log(JSON.stringify(chatObject, null, 4));

        if (g_filePath == null) {
            let saveFilePath =
                remote.dialog.showSaveDialogSync(
                    BrowserWindow,
                    {
                        properties: ['openFile'],
                        filters: [
                            { name: 'Chat File', extensions: ['json'] }
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

        fs.writeFileSync(g_filePath, JSON.stringify(chatObject));

        updateAppTitle();
    });

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
        setTimeout(() => {
            let cardIds = $('.wrapper .card--isDraggable .id');

            for (let i = 0; i < g_cardCount; i += 1) {
                $(cardIds).eq(i).text(i);
            }
        }, 100);
    });

    $('.wrapper').on('click', '.card', () => {
        updateAppTitle(true);
    })

    $('.wrapper').on('click', '.indicator', (e) => {
        let indicator = $(e.currentTarget);

        indicator.hasClass('enabled') ?
            indicator.removeClass('enabled') :
            indicator.addClass('enabled');
    });
})

