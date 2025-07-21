var selected; let taskData;
async function getTaskName(){
    if (!taskData){
        let {data} =await axios.post(systemURL+'datarequestTable',{patternName:'system_menu',condition:{task_Status:"ACTIVE"}})
        console.log('data of menu: ',data);
        taskData= data.data;
    }
    return taskData;
}
function createTaskSelection(e){

    $("#selectTask").dxPopup({
        title: "เพิ่มผู้ใช้งานใหม่",
        width: "25%",
        height: "33%",
        showCloseButton: false,
        animation: false,
        contentTemplate: async function (content) {
            
            var grid = $("<div>").dxDataGrid({
                dataSource: await getTaskName(),
                keyExpr: ['Task_ID','task_Name'],
                width:"100%",height:"100%",
                paging: {
                  enabled:true,
                  pageIndex:0,
                  pageSize:9,
                },
                showBorders: true,
                noDataText: 'ไม่มีข้อมูล',
                rowAlternationEnabled: true,
                allowColumnResizing:true,
                columnAutoWidth:true,
                allowColumnReordering: true,
                sorting: {mode: "single"},
                filterRow: { visible: true },
                onSelectionChange(e){
                    selected = e.getSelectedRowsData();
                    console.log('selected Data: ',selected);
                }

            }).appendTo(content);
            var btnOK = $(`<button class="btn btn-primary col-sm-10" 
            onclick='$("#selectTask").dxPopup("hide");' style="margin-top:10px;"><i class="fas fa-plus"></i>เพิ่ม</button>`
            ).appendTo(content);
        }
    }).dxPopup('instance');
}
function createTemplateforPopup(e) {
    let formData = {}; let pass;
    $("#addNewForm").dxPopup({
        title: "เพิ่มผู้ใช้งานใหม่",
        width: "100%",
        height: "100%",
        showCloseButton: false,
        animation: false,
        contentTemplate: function (content) {
            var back1 = $(`<button class="btn btn-warning" 
                onclick='$("#addNewForm").dxPopup("hide");' style="margin-top:10px;">ย้อนกลับ</button>`
            ).appendTo(content);
            var form = $("<div>").dxForm({
                formData: formData,
                name: 'formNew',
                labelLocation: 'top',
                labelMode: 'outside',
                colCount: 4,
                items: [
                    {
                        itemType: 'group',
                        caption: 'ส่วนที่ 1 ข้อมูล User',
                        colCount: 4,
                        colSpan: 4,
                        cssClass: 'mostShort'
                    },
                    {
                        dataField: "emailaddress",
                        name: 'emailaddress1',
                        label: { text: "Email Address" },
                        //validationRules: [{ type: 'required', message: 'Required Field' }, { type: "email", message: "รือฟสรก ำทฟรส ดนพทฟะ" }],
                        editorOptions: {
                            maxlength: 30,
                        }
                    }, {
                        dataField: "password",
                        label: { text: "Password" },
                        name: 'password',
                        editorType: 'dxTextBox',
                        validationRules: [{ type: 'required', message: 'Required Field' }],
                        editorOptions: {
                            mode: 'password',
                            maxlength: 64,
                            valueChangeEvent: 'keyup',
                            onValueChanged(e) {
                                checkFormAdd1();
                            }
                        }
                    }, {
                        dataField: "password2",
                        label: { text: "Confirm Password" },
                        name: 'password2',
                        editorType: 'dxTextBox',
                        // validationRules: [{type: 'compare',comparisonTarget() {if (formData.password) {return formData.password;}return null;},message: "'Password' and 'Confirm Password' do not match.",},
                        // {type: 'required',message: 'Confirm Password is required',}],
                        editorOptions: {
                            valueChangeEvent: 'keyup',
                            mode: 'password',
                            maxlength: 64,
                            onValueChanged(e) {

                            }
                        }
                    }, {
                        dataField: 'showPass',
                        editorType: 'dxCheckBox',
                        label: { text: 'show password' },
                        editorOptions: {
                            onValueChanged: (e) => {
                                form.dxForm('instance').getEditor('password').option('mode', e.value ? 'text' : 'password')
                                form.dxForm('instance').getEditor('password2').option('mode', e.value ? 'text' : 'password')
                            }
                        }
                    },
                    {
                        dataField: 'userdesc',
                        editorType: 'dxTextBox',
                        label: { text: 'ชื่อในโปรแกรม' },
                        // validationRules: [
                        //   { type: 'required', message: 'ระบุชื่อในโปรแกรม' },
                        //   // { type: 'pattern', pattern: /^[^ก-๏]+$/, message: 'ภาษาอังกฤษเท่านั้น' },
                        // ],
                        editorOptions: {
                            onValueChanged: (e) => !e.value ? '' : checkFormAdd1()
                        },
                    }, {
                        dataField: 'user_dept',
                        editorType: 'dxSelectBox',
                        label: { text: 'แผนก' },
                        //validationRules: [{ type: 'required', message: 'ระบุแผนก' }],
                        editorOptions: {
                            dataSource: [{ sec_code: '', sec_name: '' }],
                            valueExpr: 'sec_code',
                            displayExpr: (e) => e && `${e.sec_name} : ${e.sec_code}`,
                            searchEnabled: true,
                            onValueChanged: (e) => {
                                if (!e.value) {
                                    return
                                }

                                let row = lookup.section[e.value]
                                if (!row || row?.sec_status === 'INACTIVE') {
                                    toast.option({ message: 'Section Inactived', type: 'error' })
                                    toast.show()
                                    e.component.reset()
                                    e.component.focus()
                                    return
                                }

                                checkFormAdd1()
                            }
                        },
                    }, { itemType: 'group', colSpan: 2 },
                    {
                        dataField: 'userid',
                        editorType: 'dxSelectBox',
                        label: { text: 'รหัสพนักงาน' },
                        // validationRules: [{ type: 'required', message: 'ต้องการรหัสพนักงาน' }],
                        editorOptions: {
                            searchEnabled: true,
                            dataSource: [{ code: '', name: '' }],
                            valueExpr: 'emp_code',
                            displayExpr: (e) => e && `${e.emp_name} ${e.emp_lastname} : ${e.emp_code}`,
                            onValueChanged: (e) => {
                                if (!e.value) {
                                    return
                                }

                                let row = lookup.employee[e.value]
                                if (!row || row?.emp_status === 'INACTIVE') {
                                    toast.option({ message: 'Employee Inactived', type: 'error' })
                                    toast.show()
                                    e.component.reset()
                                    e.component.focus()
                                    return
                                }

                                formAdd.getEditor('emp_name').option('value', row.emp_name)
                                formAdd.getEditor('emp_lastname').option('value', row.emp_lastname)
                                checkFormAdd1()
                            }
                        },
                    },
                    {
                        dataField: 'emp_name',
                        editorType: 'dxTextBox',
                        label: { text: 'ชื่อพนักงาน' },
                        // validationRules: [{ type: 'required', message: 'ต้องการชื่อ' }],
                        editorOptions: { readOnly: true },
                    },
                    {
                        dataField: 'emp_lastname',
                        editorType: 'dxTextBox',
                        label: { text: 'นามสกุล' },
                        // validationRules: [{ type: 'required', message: 'ต้องการนามสกุล' }],
                        editorOptions: { readOnly: true },
                    },
                    //   {itemType:'group'},
                    //   {
                    //     itemType: 'button',
                    //     name: 'operateBtn',
                    //     width: 180,
                    //     horizontalAlignment:'left',
                    //     buttonOptions: {
                    //         disabled: true,
                    //         width: 180,
                    //         type: 'default',
                    //         icon: 'save',
                    //         text: 'บันทึก',
                    //         onClick(e) {
                    //             let fieldName; let row = {}
                    //             let updateValue = form.dxForm('instance').getEditor('value').option('value');


                    //             let api = 'updaterequest';
                    //             let patternName = 'user_name';
                    //             batchUpdate = new Promise(async function (resolve, reject) {

                    //                 resolve(true)
                    //                 reject()
                    //             })

                    //             batchUpdate.then(function (eout) {
                    //                 $("#addNewForm").dxPopup('hide');
                    //                 console.log('4 eout Data: ', eout);
                    //                 coGridData = eout.data.data[0]
                    //                 $('#coGrid').dxDataGrid({
                    //                     dataSource: coGridData,
                    //                 });
                    //                 allSelectedRowKey = {}
                    //             })

                    //         }
                    //     }},
                ]
            }).appendTo(content);


            var form2;
            function checkFormAdd1() {
                if (form2) { form2.dxForm('instance').option('visible', false); }
                if (!form.dxForm('instance').validate().isValid) {
                    return
                }

                createPart2();
                function createPart2() {
                    form2 = $("<div>").dxForm({
                        colCount: 4,
                        colSpan: 4,
                        labelMode: 'outside',
                        formData: {},
                        items: [
                            { itemType: 'group', caption: 'ส่วนที่ 2 Set authorization', cssClass: 'mostShort', colSpan: 4 },
                            {
                                editorType: "dxDataGrid",
                                colSpan: 4,
                                editorOptions: {
                                    dataSource: [{idx: 0, Task_ID: '', read_only: false, can_write: false, write_delete: false }],
                                    keyExpr: 'Task_ID',
                                    paging: {
                                      enabled:true,
                                      pageIndex:0,
                                      pageSize:9,
                                    },
                                    showBorders: true,
                                    noDataText: 'ไม่มีข้อมูล',
                                    rowAlternationEnabled: true,
                                    allowColumnResizing:true,
                                    columnAutoWidth:true,
                                    allowColumnReordering: true,
                                    sorting: {
                                      mode: "single"
                                    },
                                    filterRow: { visible: true },
                                    columns: [
                                        {
                                            name: 'btnDel',
                                            caption:'Refresh',
                                            type: 'buttons',
                                            width: 'auto',
                                            buttons: [{
                                              template: function (ce, i) {
                                                ce.append($("<button />").attr("id", "btnDel").dxButton({
                                                  type: !!i.data.Task_ID ? 'danger' : 'success',
                                                  width: 'auto',
                                                  icon: !!i.data.Task_ID ? 'minus' : 'plus',
                                                }))
                                              },
                                              onClick: async (e) => {
                                                // if (e.row.data.Task_ID) {
                                                //   if (e.row.data.auth_id) {
                                                //     del.push(e.row.data)
                                                //   }
                                                //   let rows = dgEdit.option('dataSource')
                                                //   rows.splice(e.row.rowIndex, 1)
                                                //   dgEdit.option('dataSource', rows)
                                                //   return
                                                // }
                                    
                                                // let checkparent = master.menuMaster.map(x => x.code)
                                                // rows = dgEdit.option('dataSource')
                                                // rows = rows.filter(x => !!x.Task_ID).map(x => x.Task_ID)
                                                // checkparent = checkparent.concat(rows)
                                                // checkparent = checkparent.reduce((a, b) => {
                                                //   a[b] = true
                                                //   return a
                                                // }, {})
                                                // popupData.dataSource = master.system_menu.filter(x => !checkparent[x.Task_ID]).sort((a, b) => a.Task_Parent_ID - b.Task_Parent_ID)
                                                // popup2.show()
                                              },
                                            }]
                                          },
                                          'Task_Subject',
                                          {
                                            dataField: 'Task_ID',
                                            lookup: {
                                              //dataSource: master.menuMaster,
                                              //valueExpr: 'code',
                                              //displayExpr: 'name',
                                            },
                                          },
                                          {
                                            dataField: 'read_only',
                                            caption: 'View Only',
                                            cellTemplate: (x, i) => {
                                              x.append($("<div />").attr("id", `checkV${i.rowIndex}`).dxCheckBox({
                                                value: i.data.read_only,
                                                disabled: !i.data.Task_ID,
                                                onValueChanged: (e) => {
                                                  // เช็ค คลิ๊กซ้ำที่จัดที่ติ๊กอยู่แล้ว
                                                  if (i.data.read_only && !e.value && !!noChangeDgAdd) {
                                                    e.component.option('value', true)
                                                    return
                                                  }
                                    
                                                  i.row.data.read_only = e.value
                                                  
                                    
                                                  if (!e.value) {
                                                    return
                                                  }
                                    
                                                  i.row.data.action = 'upd'
                                                  noChangeDgAdd = false
                                                  $('#checkE' + i.rowIndex).dxCheckBox('instance').option('value', false)
                                                  $('#checkD' + i.rowIndex).dxCheckBox('instance').option('value', false)
                                                  noChangeDgAdd = true
                                                }
                                              }))
                                            }
                                          },
                                          {
                                            dataField: 'can_write',
                                            caption: 'Edit Only',
                                            cellTemplate: (x, i) => {
                                              x.append($("<div />").attr("id", `checkE${i.rowIndex}`).dxCheckBox({
                                                value: i.data.can_write,
                                                disabled: !i.data.Task_ID,
                                                onValueChanged: (e) => {
                                                  if (i.data.can_write && !e.value && !!noChangeDgAdd) {
                                                    e.component.option('value', true)
                                                    return
                                                  }
                                    
                                                  i.row.data.can_write = e.value
                                    
                                                  if (!e.value) {
                                                    return
                                                  }
                                                  
                                                  i.row.data.action = 'upd'
                                                  noChangeDgAdd = false
                                                  $('#checkV' + i.rowIndex).dxCheckBox('instance').option('value', false)
                                                  $('#checkD' + i.rowIndex).dxCheckBox('instance').option('value', false)
                                                  noChangeDgAdd = true
                                                }
                                              }))
                                            }
                                          },
                                          {
                                            dataField: 'write_delete',
                                            caption: 'Edit and Deletable',
                                            cellTemplate: (x, i) => {
                                              x.append($("<div />").attr("id", `checkD${i.rowIndex}`).dxCheckBox({
                                                value: i.data.write_delete,
                                                disabled: !i.data.Task_ID,
                                                onValueChanged: (e) => {
                                                  if (i.data.write_delete && !e.value && !!noChangeDgAdd) {
                                                    e.component.option('value', true)
                                                    return
                                                  }
                                    
                                                  i.row.data.write_delete = e.value
                                    
                                                  if (!e.value) {
                                                    return
                                                  }
                                    
                                                  i.row.data.action = 'upd'
                                                  noChangeDgAdd = false
                                                  $('#checkV' + i.rowIndex).dxCheckBox('instance').option('value', false)
                                                  $('#checkE' + i.rowIndex).dxCheckBox('instance').option('value', false)
                                                  noChangeDgAdd = true
                                                }
                                              }))
                                            }
                                          },
                                    ]
                                }
                            }

                        ]
                    }).appendTo(content);
                }

                function createGrid() {
                    var grid = $("<div>").dxDataGrid({
                        dataSource: [],
                        items: [
                            "test", "name"
                        ]

                    })
                    return grid;
                }
            }
            var back2 = $(`<button class="btn btn-warning" 
              onclick='$("#addNewForm").dxPopup("hide");' style="margin-top:10px;">ย้อนกลับ</button>`
            ).appendTo(content);
        }
    }).dxPopup('instance');


}