let systemURL = 'http://hug-delphi.com/apix/system/'
let mainUserData; let mainGrid;
async function getAllUserData() {
    let { data } = await axios.post(systemURL + 'datarequest', { patternName: 'user_all', condition: { condition: 'ALL' } })
    return data.data
}
$(async () => {
    mainGrid = $('#mainUserGrid').dxDataGrid({
        dataSource: await getAllUserData(),
        keyExpr: 'userid',
        selection: { mode: 'single' },
        height: "85vh",
        paging: {
            enabled: true,
            pageIndex: 0,
            pageSize: 10,
        }, pager: {
            visible: true,
            allowedPageSizes: [20, 50, 100, 1000],
            showPageSizeSelector: true,
            showInfo: true,
            showNavigationButtons: true,
        },
        showBorders: true,
        noDataText: 'ไม่มีข้อมูล',
        rowAlternationEnabled: false,
        allowColumnResizing: true,
        allowColumnReordering: true,
        sorting: { mode: "multiple" },
        filterRow: { visible: true },
        toolbar: {
            items: [
                {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        text: "Edit User",
                        icon: 'edit',
                        height: 36,
                        width: 150,
                        disabled: true,
                        type: 'default',
                        onClick(e) {
                            createEditUser()
                        }
                    },
                }, {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        text: "Clone",
                        icon: "copy",
                        height: 36,
                        width: 150,
                        disabled: true,
                        type: 'default',
                    },
                }, {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'refresh',
                        onClick() {
                            mainGrid.refresh();
                        },
                    },
                }, {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        icon: 'trash',
                        text: 'ลบ',
                        type: "danger",
                        disabled: true,
                        onClick() {

                        },
                    },
                }, {
                    location: 'after',
                    widget: 'dxButton',
                    options: {
                        text: 'เพิ่ม User ใหม่',
                        icon: 'add',
                        type: 'default',
                        width: 180,
                        height: 36,
                        onClick: (e) => {
                            createTemplateforPopup();
                            $("#addNewForm").dxPopup('show');
                        }
                    },
                },
            ],
        },
        columns: [
            {
                name: 'btnDetail',
                caption: 'รายละเอียด',
                type: 'buttons',
                width: 'auto',
                buttons: [{
                    icon: 'textdocument',
                    hint: 'ดูเพิ่มเติม',
                    template: function (ce) {
                        ce.append($("<button />").attr("id", "btnDetails").dxButton({
                            type: 'default',
                            width: 'auto',
                            text: 'ดูเพิ่มเติม',
                            // icon: 'textdocument',
                        }))
                    },
                    onClick: (e) => {
                        createEditUser(e.row.data);
                        $("#editUserForm").dxPopup('show');
                    }
                }]
            }, {
                caption: "สถานะ",
                dataField: 'userstatus',
                width: 100,
                lookup: {
                    dataSource: [{ code: 'ACTIVE', name: 'ACTIVE' }, { code: 'INACTIVE', name: 'INACTIVE' }],
                    valueExpr: 'code',
                    displayExpr: 'name',
                },
            }, {
                caption: 'Email',
                dataField: "emailaddress",
                width: 250,
            }, {
                caption: 'แผนก',
                dataField: 'user_dept',
                width: 200,
            }, {
                dataField: 'lastActivity',
                caption: 'Last activity',
                editorType: 'dxDatebox',
                width: 200,
            }, {
                dataField: 'security',
                caption: 'Security',
                width: 200,
            }, {
                dataField: 'view_password_diff',
                caption: 'Password age',
                width: 200,
            }, {
                dataField: 'createDate',
                caption: 'วันที่สร้ํางข้อมูล',
                editorType: 'dxDateBox'
            }
        ],
        onRowPrepared: function (e) {
            if (e.rowType === "data") {
                if (e.data.security === 'RISK') {
                    e.rowElement.css("backgroundColor", "red")
                }
                if (e.data.security === 'FULL') {
                    e.rowElement.css("backgroundColor", "green")
                }
                if (e.data.security === 'SOME') {
                    e.rowElement.css("backgroundColor", "yellow")
                } 
            }
        }


    }).dxDataGrid('instance');

    
});
