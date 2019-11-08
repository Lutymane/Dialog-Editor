const { Sortable } = require('@shopify/draggable');
const fs = require('fs');
const { remote } = require('electron');
const $ = require("../libs/jquery-3.4.1.slim.min.js");

function addCard() {
    $('.wrapper').append(`
        <div class="card">
            <div class="id">
                10
            </div>
            <div class="pair">
                <div class="msg">
                    <div class="text" contenteditable="true">Sas</div>
                    <div class="attached" contenteditable="true">Bob Floppy</div>
                </div>
                <div class="delimiter"></div>
                <div class="msg">
                    <div class="text" contenteditable="true"></div>
                    <div class="attached" contenteditable="true"></div>
                </div>
            </div>
            <div class="seq"></div>
            <div class="lau"></div>
        </div>
    `);
}

$(() => {
    let BrowserWindow = remote.getCurrentWindow();

    BrowserWindow.toggleDevTools();

    $('#btn-new').click(() => { });
    $('#btn-open').click(() => {
        let filePaths =
            remote.dialog.showOpenDialogSync(
                BrowserWindow,
                {
                    properties: ['openFile'],
                    filters: [{ name: 'Notes File', extensions: ['json', 'pnf'] }]
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

            let tempObj = JSON.parse(data.toString());

            g_notesData.tagsMap = new Map(tempObj.tagsMap);
            g_notesData.notes = new Map(tempObj.notes);
            g_notesData.order = tempObj.order;

            //render tags:
            for (var [tag_id, tag_name] of g_notesData.tagsMap) {
                addTagToList(tag_name, tag_id)
            }

            g_tagNextId = tag_id + 1;

            for (var [note_id, note_obj] of g_notesData.notes) {
                addNoteToList(note_id, note_obj)
            }

            g_noteNextId = note_id + 1;
        })
    });
    $('#btn-save').click(() => {
        if (g_filePath == null) {
            let saveFilePath =
                remote.dialog.showSaveDialogSync(
                    BrowserWindow,
                    {
                        properties: ['openFile'],
                        filters: [
                            { name: 'Notes File', extensions: ['pnf'] },
                            { name: 'Notes File JSON', extensions: ['json'] }
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

        //store file

        let tempObj = {
            tagsMap: Array.from(g_notesData.tagsMap.entries()),
            notes: Array.from(g_notesData.notes.entries()),
            order: g_notesData.order
        }

        fs.writeFileSync(g_filePath, JSON.stringify(tempObj));

        console.log('stored!');
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

    addCard();
    addCard();
    addCard();
    addCard();

    //
    const containerSelector = '.wrapper';
    const sortable = new Sortable(document.querySelectorAll(containerSelector), {
        draggable: '.card',
        mirror: {
            appendTo: containerSelector,
            constrainDimensions: true,
        }
    });
})

