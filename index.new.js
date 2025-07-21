axios.defaults.baseURL = 'http://hug-delphi.com/apix/users'
// axios.defaults.baseURL = 'http://localhost:7006/users'
axios.defaults.headers.common['X-Auth-User'] = localStorage.getItem('userdesc') || ''
let master = {}
let lookup = {}
let popupData = {}

$(() => {
  $('document').ready(async () => {
    $('#bodyja').removeAttr("hidden")
    init()
  })

  let toast = $('#toast').dxToast({ displayTime: 3000 }).dxToast('instance')

  let loadPanel = $('.loadpanel').dxLoadPanel({
    shadingColor: 'rgba(0,0,0,0.4)',
    position: { of: '#employee' },
    visible: false,
    showIndicator: true,
    showPane: true,
    shading: true,
    hideOnOutsideClick: false,
    onShown() {},
    onHidden() {},
  }).dxLoadPanel('instance')

  // main page
  let rowIndex = ''
  let dataTable = $("#dataGrid").dxDataGrid({
    dataSource: [],
    keyExpr: 'userid',
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
    toolbar: {
      items: [
        {
          location: 'after',
          widget: 'dxButton',
          options: {
            text: 'เพิ่ม User ใหม่',
            icon: 'add',
            type: 'default',
            width: 'auto',
            onClick: async () => setAddForm(),
          },
        },
      ],
    },
    columns: [
      {
        name: 'btnEdit',
        caption:'Edit User',
        type: 'buttons',
        width: 'auto',
        buttons: [{
          // icon: 'edit', 
          // hint: 'รายละเอียด',
          template: function (ce, i) {
            ce.append($("<button />").attr("id", `btnEdit${i.rowIndex}`).dxButton({
              type: 'default',
              width: 'auto',
              text: 'Edit User',
              icon: 'edit',
              disabled: true,
              onClick: () => setEditForm(i.rowIndex, i.row.data),
            }))
          },
          // onClick: async (e) => setEditForm(e.row.loadIndex, e.row.data),
        }]
      },
      {
        name: 'btnClone',
        caption:'Clone',
        type: 'buttons',
        width: 'auto',
        buttons: [{
          template: function (ce, i) {
            ce.append($("<button />").attr("id", `btnClone${i.rowIndex}`).dxButton({
              type: 'default',
              width: 'auto',
              text: 'Clone',
              icon: 'copy',
              disabled: true,
              onClick: () => {
                popupData.cloneRow = i.row.data
                popup3.show()
              },//setEditForm(i.rowIndex, i.row.data),
            }))
          },
          // onClick: async (e) => setEditForm(e.row.loadIndex, e.row.data),
        }]
      },
      {
        name: 'btnRefresh',
        caption:'Refresh',
        type: 'buttons',
        width: 'auto',
        buttons: [{
          template: function (ce) {
            ce.append($("<button />").attr("id", "btnRefresh").dxButton({
              width: 'auto',
              icon: 'refresh',
            }))
          },
          onClick: async (e) => getRefresh(e.row.loadIndex, e.row.data),
        }]
      },
      {
        name: 'btnDel',
        caption:'Refresh',
        type: 'buttons',
        width: 'auto',
        buttons: [{
          template: function (ce) {
            ce.append($("<button />").attr("id", "btnDel").dxButton({
              type: 'danger',
              width: 'auto',
              text: 'ลบ',
              icon: 'trash',
            }))
          },
          onClick: async (e) => rowDel(e.row.loadIndex, e.row.data),
        }]
      },
      {
        dataField:'userstatus',
        caption:'สถานะ',
        lookup: {
          dataSource: [{code: 'ACTIVE', name: 'ACTIVE'}, {code: 'INACTIVE', name: 'INACTIVE'}],
          valueExpr: 'code',
          displayExpr: 'name',
        },
      },
      { dataField: 'emailaddress', caption: 'Email' },
      {
        dataField:'user_dept',
        caption:'แผนก',
        lookup: {
          valueExpr: 'sec_code',
          displayExpr: (i) => i && `${i.sec_name} : ${i.sec_code}`,
        },
      },
      { dataField: 'recorddate', caption: 'Last Activity' },
      {
        dataField:'security',
        caption:'Security',
        lookup: {
          dataSource: [{code: 'FULL', name: 'Full'},{code: 'SOME', name: 'Some'},{code: 'RISK', name: 'Risk'}],
          valueExpr: 'code',
          displayExpr: 'name',
        },
      },
      { dataField: 'passworddate', caption: 'Password Age' },
      { dataField: 'createdate', caption: 'วันที่สร้างข้อมูล', dataType: "date", format: 'dd/MM/yyyy' },
    ],
    selection: { mode: "single" },
    onRowClick: (e) => {
      if (rowIndex !== '') {
        $(`#btnEdit${rowIndex}`).dxButton('instance').option('disabled', true)
        $(`#btnClone${rowIndex}`).dxButton('instance').option('disabled', true)
      }

      $(`#btnEdit${e.rowIndex}`).dxButton('instance').option('disabled', false)
      $(`#btnClone${e.rowIndex}`).dxButton('instance').option('disabled', false)
      rowIndex = e.rowIndex
    },
    // onCellDblClick: (e) => setEditForm(e.row.loadIndex, e.row.data),
    onRowPrepared: function(e) {
      if (e.rowType === "data") {
        if (e.data.security === 'FULL') {
          e.cells[8].cellElement.css("color", "green")
        }
        if (e.data.security === 'SOME') {
          e.cells[8].cellElement.css("color", "yellow")
        }
        if (e.data.security === 'RISK') {
          e.cells[8].cellElement.css("color", "red")
        }
      }
    },
  }).dxDataGrid('instance')

  async function getRefresh(idx, row) {
    try {
      loadPanel.show()
      let { data } = await axios.get(`/getRefresh/${row.userid}`)
      if (!data.result) {
        throw new Error(data.message)
      }
      let rows = dataTable.option('dataSource')
      if (data.row.passworddate) data.row.passworddate = '' + dayjs().diff(data.row.passworddate, 'day')
      rows[idx] = data.row
      dataTable.option('dataSource', rows)
      setTimeout(() => {
        $(`#btnEdit${idx}`).dxButton('instance').option('disabled', false)
        $(`#btnClone${idx}`).dxButton('instance').option('disabled', false)
      }, 300)
    } catch (e) {
      toast.option({ message: e.message, type: 'error' })
      toast.show()
    } finally {
      loadPanel.hide()
    }
  }

  async function rowDel(idx, row) {
    try {
      loadPanel.show()
      let { data } = await axios.post(`/delete`, row)
      if (!data.result) {
        throw new Error(data.message)
      }
      let rows = dataTable.option('dataSource')
      if (data.row.passworddate) data.row.passworddate = '' + dayjs().diff(data.row.passworddate, 'day')
      rows[idx] = data.row
      dataTable.option('dataSource', rows)
      setTimeout(() => {
        $(`#btnEdit${idx}`).dxButton('instance').option('disabled', false)
        $(`#btnClone${idx}`).dxButton('instance').option('disabled', false)
      }, 300)
    } catch (e) {
      toast.option({ message: e.message, type: 'error' })
      toast.show()
    } finally {
      loadPanel.hide()
    }
  }

  // add user
  let dgPopup
  let popup = $('#popup').dxPopup({
    contentTemplate: "templatePopup",
    width: 800,
    height: 550,
    container: '.dx-viewport',
    showTitle: true,
    title: 'เลือกรายการ',
    visible: false,
    dragEnabled: false,
    showCloseButton: false,
    position: {
      at: 'center',
      my: 'center',
    },
    onShown: function() {
      dgPopup = $('#dgPopup').dxDataGrid({
        dataSource: popupData.dataSource || [],
        keyExpr: 'Task_ID',
        paging: {
          enabled:true,
          pageIndex:0,
          pageSize:8,
        },
        sorting: {
          mode: "single"
        },
        filterRow: { visible: true },
        showBorders: true,
        noDataText: 'ไม่มีข้อมูล',
        width: 760,
        columns: [
          { dataField:'Task_Subject', caption:'ชื่อหน้า' },
          {
            dataField:'Task_Parent_ID',
            caption:'ตำแหน่งในเมนู',
            lookup: {
              dataSource: master.menuMaster,
              valueExpr: 'code',
              displayExpr: 'name',
            },
          },
        ],
        selection: { mode: "multiple", showCheckBoxesMode: 'always', },
      }).dxDataGrid('instance')
    },
    toolbarItems: [
      {
        widget: 'dxButton',
        toolbar: 'bottom',
        location: 'after',
        options: {
          type: 'danger',
          text: 'ยกเลิก',
          onClick() {
            popup.hide()
            dgPopup.option('selectedRowKeys', [])
          },
        },
      },
      {
        widget: 'dxButton',
        toolbar: 'bottom',
        location: 'after',
        options: {
          type: 'default',
          text: 'ยืนยัน',
          onClick() {
            let rowKeys = dgPopup.option('selectedRowKeys')
            let rows = dgAdd.option('dataSource')
            for (let key of rowKeys) {
              let row = lookup.system_menu[key]
              if (!row) {
                continue
              }

              rows.splice(rows.length - 1, 0, {...row, read_only: false, can_write: true, write_delete: false })
            }
            dgAdd.option('dataSource', rows)
            dgPopup.option('selectedRowKeys', [])
            popup.hide()
          },
        },
      }
    ],
  }).dxPopup('instance')

  let formAdd = $('#formAdd').dxForm({
    colCount: 4,
    labelLocation: 'top',
    items: [
      {
        name: 'group1',
        itemType: 'group',
        caption: 'ส่วนที่ 1 ข้อมูล User',
        colCount: 4,
        colSpan: 4,
        items: [
          {
            dataField: 'emailaddress',
            editorType: 'dxTextBox',
            label: { text: 'Email' },
            validationRules: [
              { type: 'required', message: 'ระบุ Email' },
              // { type: 'pattern', pattern: /^[A-Z0-9]+$/, message: 'ภาษาอังกฤษและตัวเลขเท่านั้น' },
            ],
            editorOptions: {
              maxLength: 10,
              onValueChanged(e) {
                if (!e.value) {
                  return
                }

                let checkSame = dataTable.option('dataSource').some(x => x.emailaddress === e.value)
                if (checkSame) {
                  toast.option({ message: `${e.value} ข้อมูลซ้ำ`, type: 'error' })
                  toast.show()
                  e.component.reset()
                  e.component.focus()
                  return
                }

                checkFormAdd1()
              }
            },
          },
          {
            dataField: 'password1',
            editorType: 'dxTextBox',
            label: { text: 'Password' },
            validationRules: [
              { type: 'required', message: 'ระบุ Password' },
              // { type: 'pattern', pattern: /^[^a-zA-Z]+$/, message: 'ภาษาไทยเท่านั้น' },
            ],
            editorOptions: {
              mode: 'password',
              onValueChanged: (e) => !e.value ? '' : checkFormAdd1()
            },
          },
          {
            dataField: 'password2',
            editorType: 'dxTextBox',
            label: { text: 'Confirm Password' },
            validationRules: [
              { type: 'required', message: 'ระบุ Confirm Password' },
              // { type: 'pattern', pattern: /^[^a-zA-Z]+$/, message: 'ภาษาไทยเท่านั้น' },
              {
                type: 'custom',
                message: 'Password ไม่ตรงกัน',
                validationCallback: (e) => {
                  if (!e.value || !formAdd.getEditor('password1').option('value')) {
                    return true
                  }

                  if (formAdd.getEditor('password1').option('value') !== e.value) {
                    return
                  }

                  return true
                }
              },
            ],
            editorOptions: {
              mode: 'password',
              onValueChanged: (e) => !e.value ? '' : checkFormAdd1()
            },
          },
          {
            dataField: 'showPass',
            editorType: 'dxCheckBox',
            label: { text: 'show password' },
            editorOptions: {
              onValueChanged: (e) => {
                formAdd.getEditor('password1').option('mode', e.value ? 'text' : 'password')
                formAdd.getEditor('password2').option('mode', e.value ? 'text' : 'password')
              }
            }
          },
          {
            dataField: 'userdesc',
            editorType: 'dxTextBox',
            label: { text: 'ชื่อในโปรแกรม' },
            validationRules: [
              { type: 'required', message: 'ระบุชื่อในโปรแกรม' },
              // { type: 'pattern', pattern: /^[^ก-๏]+$/, message: 'ภาษาอังกฤษเท่านั้น' },
            ],
            editorOptions: {
              onValueChanged: (e) => !e.value ? '' : checkFormAdd1()
            },
          },
          {
            dataField: 'user_dept',
            editorType: 'dxSelectBox',
            label: { text: 'แผนก' },
            validationRules: [{ type: 'required', message: 'ระบุแผนก' }],
            editorOptions: {
              dataSource: [{sec_code: '', sec_name: ''}],
              valueExpr: 'sec_code',
              displayExpr: (e) => e && `${e.sec_name} : ${e.sec_code}`,
              searchEnabled: true,
              onValueChanged: (e) => {
                if (!e.value) {
                  return
                }

                let row = lookup.section[e.value]
                if (!row || row?.sec_status === 'INACTIVE') {
                  toast.option({ message: 'Section Inactived', type: 'error'})
                  toast.show()
                  e.component.reset()
                  e.component.focus()
                  return
                }

                checkFormAdd1()
              }
            },
          },
          { itemType: 'group', colSpan: 2 },
          {
            dataField: 'userid',
            editorType: 'dxSelectBox',
            label: { text: 'รหัสพนักงาย' },
            validationRules: [{ type: 'required', message: 'ต้องการรหัสพนักงาน' }],
            editorOptions: {
              searchEnabled: true,
              dataSource: [{code: '', name: ''}],
              valueExpr: 'emp_code',
              displayExpr: (e) => e && `${e.emp_name} ${e.emp_lastname} : ${e.emp_code}`,
              onValueChanged: (e) => {
                if (!e.value) {
                  return
                }

                let row = lookup.employee[e.value]
                if (!row || row?.emp_status === 'INACTIVE') {
                  toast.option({ message: 'Employee Inactived', type: 'error'})
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
            validationRules: [{ type: 'required', message: 'ต้องการชื่อ' }],
            editorOptions: { readOnly: true },
          },
          {
            dataField: 'emp_lastname',
            editorType: 'dxTextBox',
            label: { text: 'นามสกุล' },
            validationRules: [{ type: 'required', message: 'ต้องการนามสกุล' }],
            editorOptions: { readOnly: true },
          },
        ],
      },
    ],
  }).dxForm('instance')

  let noChangeDgAdd = true
  let dgAdd = $("#dgAdd").dxDataGrid({
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
            if (e.row.data.Task_ID) {
              let rows = dgAdd.option('dataSource')
              rows.splice(e.row.rowIndex, 1)
              dgAdd.option('dataSource', rows.map((x, i) => ({...x,idx: i})))
              return
            }

            let checkparent = master.menuMaster.map(x => x.code)
            rows = dgAdd.option('dataSource')
            rows = rows.filter(x => !!x.Task_ID).map(x => x.Task_ID)
            checkparent = checkparent.concat(rows)
            checkparent = checkparent.reduce((a, b) => {
              a[b] = true
              return a
            }, {})
            popupData.dataSource = master.system_menu.filter(x => !checkparent[x.Task_ID]).sort((a, b) => a.Task_Parent_ID - b.Task_Parent_ID)
            popup.show()
          },
        }]
      },
      'Task_Subject',
      {
        dataField: 'Task_Parent_ID',
        lookup: {
          dataSource: master.menuMaster,
          valueExpr: 'code',
          displayExpr: 'name',
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
              if (i.data.read_only && !e.value && !!noChangeDgAdd) {
                e.component.option('value', true)
                return
              }

              i.row.data.read_only = e.value

              if (!e.value) {
                return
              }

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

              noChangeDgAdd = false
              $('#checkV' + i.rowIndex).dxCheckBox('instance').option('value', false)
              $('#checkE' + i.rowIndex).dxCheckBox('instance').option('value', false)
              noChangeDgAdd = true
            }
          }))
        }
      },
    ],
    // selection: { mode: "single" },
  }).dxDataGrid('instance')

  $('#tlb').dxToolbar({
    items: [
      {
        location: 'after',
        widget: 'dxButton',
        options: {
          text: 'สร้างใหม่',
          icon: 'save',
          type: 'default',
          width: 'auto',
          onClick: async () => {
            if (!formAdd.validate().isValid) {
              return
            }

            let rows = dgAdd.option('dataSource')
            rows = rows.filter(x => !!x.Task_ID)
            if (!rows.length) {
              toast.option({ message: 'ต้องการ Set Authorization', type: 'error' })
              toast.show()
              return
            }

            let set = formAdd.option('formData')
            let sendData = {
              form: {
                userid: set.userid,
                username: set.userid,
                userpassword: CryptoJS.SHA256(set.password1).toString(),
                emailaddress: set.emailaddress,
                user_dept: set.user_dept,
                userdesc: set.userdesc,
                security: 'SOME',
                usr_name: set.emp_name,
                usr_lastname: set.emp_lastname,
              },
              auth: dgAdd.option('dataSource').filter(x => !!x.Task_ID),
            }

            try {
              loadPanel.show()
              
              let { data } = await axios.post('/insert', sendData)
              if (!data.result) {
                throw new Error(data.message)
              }

              toast.option({ message: 'บันทึกข้อมูลเรียบร้อยแล้ว', type: 'success' })
              toast.show()
              dataTable.option('dataSource', data.rows)
              vm.showForm('')
            } catch (e) {
              toast.option({ message: e.message, type: 'error' })
              toast.show()
            } finally {
              loadPanel.hide()
            }
          },
        },
      },
    ],
  })

  function checkFormAdd1() {
    let set = formAdd.option('formData')
    if (!set.emailaddress || !set.password1 || !set.password2 || !set.userdesc || !set.user_dept || !set.userid) {
      return
    }

    if (!formAdd.validate().isValid) {
      return
    }

    vm.showFormSet2(true)
  }

  function setDataSourceFormAdd() {
    formAdd.getEditor('user_dept').option('dataSource', master.section)
    formAdd.getEditor('userid').option('dataSource', master.employee.filter(x => x.emp_status === 'ACTIVE'))
  }

  // ปุ่ม edit
  let myTab = $('#tabpanel-container').dxTabPanel({
    height: "auto",
    dataSource: [
      {
        title: "ข้อมูล User",
        icon: "user",
        template: $('#formEdit'),
      },
      {
        title: "Set Authorization",
        icon: "product",
        template: $('#editTab2'),
      },
      {
        title: "Security",
        icon: "preferences",
        template: $('#editTab3'),
      },
    ],
    // selectedIndex: 0,
    loop: false,
    animationEnabled: true,
    swipeEnabled: true,
    // onItemRendered: (e) => {
    //   console.log('onItemRendered =', e)
    //   setTab2Ini()
    // },
    onSelectionChanged: (e) => {
      let status = e.addedItems[0]?.title === 'Set Authorization'
      console.log('status =', status)
      setTab2Ini(status)
      setTab3Ini()
    },
  }).dxTabPanel('instance')

  // tab 1 edit user
  let onChange = true
  let formEdit = $('#formEdit').dxForm({
    colCount: 4,
    labelLocation: 'top',
    items: [
      {
        dataField: 'userstatus',
        editorType: 'dxSelectBox',
        label: { text: 'สถานะ' },
        // validationRules: [{ type: 'required', message: 'ต้องการรหัส' }],
        editorOptions: {
          dataSource: [{code: 'ACTIVE', name: 'ACTIVE'}, {code: 'INACTIVE', name: 'INACTIVE'}],
          valueExpr: 'code',
          displayExpr: 'name',
        },
      },
      { itemType: 'group', colSpan: 3 },
      {
        dataField: 'emailaddress',
        editorType: 'dxTextBox',
        label: { text: 'Email' },
        validationRules: [
          // { type: 'required', message: 'ระบุ Email' },
          // { type: 'pattern', pattern: /^[A-Z0-9]+$/, message: 'ภาษาอังกฤษและตัวเลขเท่านั้น' },
        ],
        editorOptions: {
          readOnly: true,
          maxLength: 10,
          onValueChanged(e) {
            if (!e.value || !onChange) {
              return
            }

            let checkSame = dataTable.option('dataSource').some(x => x.emailaddress === e.value)
            if (checkSame) {
              toast.option({ message: `${e.value} ข้อมูลซ้ำ`, type: 'error' })
              toast.show()
              e.component.reset()
              e.component.focus()
              return
            }
          }
        },
      },
      {
        dataField: 'password1',
        editorType: 'dxTextBox',
        label: { text: 'Password' },
        validationRules: [
          // { type: 'required', message: 'ระบุ Password' },
          // { type: 'pattern', pattern: /^[^a-zA-Z]+$/, message: 'ภาษาไทยเท่านั้น' },
        ],
        editorOptions: {
          mode: 'password',
        },
      },
      {
        dataField: 'password2',
        editorType: 'dxTextBox',
        label: { text: 'Confirm Password' },
        validationRules: [
          // { type: 'required', message: 'ระบุ Confirm Password' },
          // { type: 'pattern', pattern: /^[^a-zA-Z]+$/, message: 'ภาษาไทยเท่านั้น' },
          {
            type: 'custom',
            message: 'Password ไม่ตรงกัน',
            validationCallback: (e) => {
              if (!e.value && !formEdit.getEditor('password1').option('value')) {
                return true
              }

              if (formEdit.getEditor('password1').option('value') !== e.value) {
                return
              }

              return true
            }
          },
        ],
        editorOptions: {
          mode: 'password',
        },
      },
      {
        dataField: 'showPass',
        editorType: 'dxCheckBox',
        label: { text: 'show password' },
        editorOptions: {
          onValueChanged: (e) => {
            formEdit.getEditor('password1').option('mode', e.value ? 'text' : 'password')
            formEdit.getEditor('password2').option('mode', e.value ? 'text' : 'password')
          }
        }
      },
      {
        dataField: 'userdesc',
        editorType: 'dxTextBox',
        label: { text: 'ชื่อในโปรแกรม' },
        validationRules: [
          // { type: 'required', message: 'ระบุชื่อในโปรแกรม' },
          // { type: 'pattern', pattern: /^[^ก-๏]+$/, message: 'ภาษาอังกฤษเท่านั้น' },
        ],
        editorOptions: {
        },
      },
      {
        dataField: 'user_dept',
        editorType: 'dxSelectBox',
        label: { text: 'แผนก' },
        // validationRules: [{ type: 'required', message: 'ระบุแผนก' }],
        editorOptions: {
          dataSource: [{sec_code: '', sec_name: ''}],
          valueExpr: 'sec_code',
          displayExpr: (e) => e && `${e.sec_name} : ${e.sec_code}`,
          searchEnabled: true,
          onValueChanged: (e) => {
            if (!e.value || !onChange) {
              return
            }

            let row = lookup.section[e.value]
            if (!row || row?.sec_status === 'INACTIVE') {
              toast.option({ message: 'Section Inactived', type: 'error'})
              toast.show()
              e.component.reset()
              e.component.focus()
              return
            }

          }
        },
      },
      { itemType: 'group', colSpan: 2 },
      {
        dataField: 'usr_name',
        editorType: 'dxTextBox',
        label: { text: 'ชื่อพนักงาน' },
        // validationRules: [{ type: 'required', message: 'ต้องการชื่อ' }],
        editorOptions: {},
      },
      {
        dataField: 'usr_lastname',
        editorType: 'dxTextBox',
        label: { text: 'นามสกุล' },
        // validationRules: [{ type: 'required', message: 'ต้องการนามสกุล' }],
        editorOptions: { },
      },
      {
        dataField: 'userid',
        editorType: 'dxTextBox',
        label: { text: 'รหัสพนักงาย' },
        // validationRules: [{ type: 'required', message: 'ต้องการรหัสพนักงาน' }, { type: 'numeric', message: 'ระบุเฉพาะตัวเลขเท่านั้น' }],
        editorOptions: {
          maxLength: 6,
          readOnly: true, // ถ้าเปลียน userid จะพังไปจน ตาราง system_autherization เพราะ user_name และ system_autherization ใช้ userid ref กันอยู่
          onValueChanged: (e) => {
            if (!e.value || !onChange) {
              return
            }

            let row = lookup.employee[e.value]
            if (!row || row?.emp_status === 'INACTIVE') {
              toast.option({ message: 'Employee Inactived', type: 'error'})
              toast.show()
              e.component.reset()
              e.component.focus()
              return
            }
          }
        },
      },
      { itemType: 'group' },
      { 
        dataField: 'createdate',
        editorType: 'dxDateBox',
        label: { text: 'วันที่สร้างข้อมูล' },
        editorOptions: { type: 'date', displayFormat: 'dd/MM/yyyy HH:mm:ss',  readOnly: true },
      },
      { 
        dataField: 'updatedate',
        editorType: 'dxDateBox',
        label: { text: 'วันที่แก้ไขครั้งล่าสุด' },
        editorOptions: { type: 'date', displayFormat: 'dd/MM/yyyy HH:mm:ss',  readOnly: true },
      },
      {
        dataField: 'updatedby',
        editorType: 'dxTextBox',
        label: { text: 'แก้ไขครั้งล่าสุดโดย' },
        editorOptions: { readOnly: true },
      },
      {
        name: 'edit',
        itemType: "button",
        verticalAlignment: 'bottom',
        buttonOptions: { 
          text: "แก้ไข", 
          type: 'default',
          width: '10em',
          icon: 'edit',
          onClick: async (e) => {
            if (!e.validationGroup.validate().isValid) {
              return
            }

            try {
              loadPanel.show()

              let set = formEdit.option('formData')
              let form = {
                userid: set.userid,
                // userpassword: CryptoJS.SHA256(set.password1).toString(),
                emailaddress: set.emailaddress,
                user_dept: set.user_dept,
                userdesc: set.userdesc,
                usr_name: set.usr_name,
                usr_lastname: set.usr_lastname,
              }

              if (set.password1) {
                form.userpassword = CryptoJS.SHA256(set.password1).toString()
              }

              let { data } = await axios.post('/update/form', form)
              if (!data.result) {
                throw new Error(data.message)
              }

              formEdit.getEditor('updatedby').option('value', data.row.updateBy)
              formEdit.getEditor('updatedate').option('value', data.row.updateDate)
              let rows = dataTable.option('dataSource')
              rows[formEdit.option('formData').index] = {...rows[formEdit.option('formData').index], ...data.row}
              dataTable.option('dataSource', rows)
              setTimeout(() => {
                $(`#btnEdit${formEdit.option('formData').index}`).dxButton('instance').option('disabled', false)
                $(`#btnClone${formEdit.option('formData').index}`).dxButton('instance').option('disabled', false)
              }, 300)

              toast.option({ message: 'บันทึกข้อมูลเรียบร้อย', type: 'success' })
              toast.show()
            } catch (e) {
              toast.option({ message: e.message, type: 'error' })
              toast.show()
            } finally {
              loadPanel.hide()
            }
          }
        }
      },
    ],
  }).dxForm('instance')

  // tab 2 set authorization
  async function setTab2Ini(status) {
    let dgPopup2
    let del = []

    let popup2 = $('#popup2').dxPopup({
      contentTemplate: "templatePopup2",
      width: 800,
      height: 550,
      container: '.dx-viewport',
      showTitle: true,
      title: 'เลือกรายการ',
      visible: false,
      dragEnabled: false,
      showCloseButton: false,
      position: {
        at: 'center',
        my: 'center',
      },
      onShown: function() {
        dgPopup2 = $('#dgPopup2').dxDataGrid({
          dataSource: popupData.dataSource || [],
          keyExpr: 'Task_ID',
          paging: {
            enabled:true,
            pageIndex:0,
            pageSize:8,
          },
          sorting: {
            mode: "single"
          },
          filterRow: { visible: true },
          showBorders: true,
          noDataText: 'ไม่มีข้อมูล',
          width: 760,
          columns: [
            { dataField:'Task_Subject', caption:'ชื่อหน้า' },
            {
              dataField:'Task_Parent_ID',
              caption:'ตำแหน่งในเมนู',
              lookup: {
                dataSource: master.menuMaster,
                valueExpr: 'code',
                displayExpr: 'name',
              },
            },
          ],
          selection: { mode: "multiple", showCheckBoxesMode: 'always', },
        }).dxDataGrid('instance')
      },
      toolbarItems: [
        {
          widget: 'dxButton',
          toolbar: 'bottom',
          location: 'after',
          options: {
            type: 'danger',
            text: 'ยกเลิก',
            onClick() {
              popup2.hide()
              dgPopup2.option('selectedRowKeys', [])
            },
          },
        },
        {
          widget: 'dxButton',
          toolbar: 'bottom',
          location: 'after',
          options: {
            type: 'default',
            text: 'ยืนยัน',
            onClick() {
              let rowKeys = dgPopup2.option('selectedRowKeys')
              let rows = dgEdit.option('dataSource')
              for (let key of rowKeys) {
                let row = lookup.system_menu[key]
                if (!row) {
                  continue
                }
  
                rows.splice(rows.length - 1, 0, {...row, read_only: false, can_write: true, write_delete: false })
              }
              dgEdit.option('dataSource', rows)
              dgPopup2.option('selectedRowKeys', [])
              popup2.hide()
            },
          },
        }
      ],
    }).dxPopup('instance')
  
    let dgEdit = $("#dgEdit").dxDataGrid({
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
              if (e.row.data.Task_ID) {
                if (e.row.data.auth_id) {
                  del.push(e.row.data)
                }
                let rows = dgEdit.option('dataSource')
                rows.splice(e.row.rowIndex, 1)
                dgEdit.option('dataSource', rows)
                return
              }
  
              let checkparent = master.menuMaster.map(x => x.code)
              rows = dgEdit.option('dataSource')
              rows = rows.filter(x => !!x.Task_ID).map(x => x.Task_ID)
              checkparent = checkparent.concat(rows)
              checkparent = checkparent.reduce((a, b) => {
                a[b] = true
                return a
              }, {})
              popupData.dataSource = master.system_menu.filter(x => !checkparent[x.Task_ID]).sort((a, b) => a.Task_Parent_ID - b.Task_Parent_ID)
              popup2.show()
            },
          }]
        },
        'Task_Subject',
        {
          dataField: 'Task_Parent_ID',
          lookup: {
            dataSource: master.menuMaster,
            valueExpr: 'code',
            displayExpr: 'name',
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
      ],
      // selection: { mode: "single" },
    }).dxDataGrid('instance')

    $('#tlbEdit').dxToolbar({
      items: [
        {
          location: 'after',
          widget: 'dxButton',
          options: {
            text: 'แก้ไข',
            icon: 'edit',
            type: 'default',
            width: 'auto',
            onClick: async () => {
              let rows = dgEdit.option('dataSource')
              rows = rows.filter(x => !!x.Task_ID)
              rows = rows.filter(x => x.action === 'upd' || !x.auth_id)
              if (!del.length && !rows.length) {
                return
              }

              let sendData = {
                code: formEdit.getEditor('userid').option('value'),
                rows,
                del,
              }

              try {
                loadPanel.show()

                let { data } = await axios.post('/update/auth', sendData)
                if (!data.result) {
                  throw new Error(data.message)
                }

                toast.option({ message: 'บันทึกข้อมูลเรียบร้อยแล้ว', type: 'success' })
                toast.show()
                setRows(data.rows)
                // update security
                let set = dataTable.option('dataSource')
                set[formEdit.option('formData').index] = {...data.row}
                dataTable.option('dataSource', set)

                setTimeout(() => {
                  $(`#btnEdit${formEdit.option('formData').index}`).dxButton('instance').option('disabled', false)
                  $(`#btnClone${formEdit.option('formData').index}`).dxButton('instance').option('disabled', false)
                }, 300)
              } catch (e) {
                toast.option({ message: e.message, type: 'error' })
                toast.show()
              } finally {
                loadPanel.hide()
              }
            },
          },
        },
      ],
    })

    async function getTab2Data() {
      try {
        loadPanel.show()

        let { data } = await axios.get('/getAuth/' + formEdit.option('formData').userid)
        if (!data.result) {
          throw new Error(data.message)
        }

        setRows(data.rows)
      } catch (e) {
        toast.option({ message: e.message, type: 'error' })
        toast.show()
      } finally {
        loadPanel.hide()
      }
    }

    if (status) {
      getTab2Data()
    }

    function setRows(rows) {
      let set = []
      for (let x of rows) {
        let row = lookup.system_menu[x.task_id]
        if (!row) {
          continue
        }

        set.push({
          ...row,
          auth_id: x.auth_id,
          user_id: x.user_id,
          auth_description: x.auth_description,
          read_only: x.read_only === 'True',
          can_write: x.can_write === 'True',
          write_delete: x.write_delete === 'True',
        })
      }

      set.push({idx: 0, Task_ID: '', read_only: false, can_write: false, write_delete: false })
      dgEdit.option('dataSource', set)
      del = []
    }
  }

  // tab 3 security
  async function setTab3Ini() {
    let dgSecurity = $("#dgSecurity").dxDataGrid({
      dataSource: [
        { code: 'A', name: 'SMS', status: 'ENABLE', effectiveDate: new Date() },
        { code: 'B', name: 'AUTHENTICATION', status: 'DISABLE', effectiveDate: new Date() },
      ],
      keyExpr: 'code',
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
      columns: [
        { dataField: 'name', caption: 'Security name' },
        {
          dataField:'status',
          caption:'Status',
          lookup: {
            dataSource: [{code: 'ENABLE', name: 'Enable'}, {code: 'DISABLE', name: 'Disable'}],
            valueExpr: 'code',
            displayExpr: 'name',
          },
        },
        { dataField: 'effectiveDate', caption: 'Effective Date', dataType: "date", format: 'dd/MM/yyyy' },
      ],
      onRowPrepared: function(e) {
        if (e.rowType === "data") {
          if (e.data.status === 'ENABLE') {
            e.cells[1].cellElement.css("color", "green")
          }
          if (e.data.status === 'DISABLE') {
            e.cells[1].cellElement.css("color", "red")
          }
        }
      },
    }).dxDataGrid('instance')
  }

  // ปุ่ม Clone
  let formClone
  let popup3 = $('#popup3').dxPopup({
    contentTemplate: "templatePopup3",
    width: 800,
    height: 420,
    container: '.dx-viewport',
    showTitle: true,
    title: 'Clone User',
    visible: false,
    dragEnabled: false,
    showCloseButton: false,
    position: {
      at: 'center',
      my: 'center',
    },
    onShown: function() {
      formClone = $('#formClone').dxForm({
        colCount: 2,
        labelLocation: 'top',
        items: [
          {
            dataField: 'emailaddress',
            editorType: 'dxTextBox',
            label: { text: 'Email' },
            validationRules: [
              { type: 'required', message: 'ระบุ Email' },
              // { type: 'pattern', pattern: /^[A-Z0-9]+$/, message: 'ภาษาอังกฤษและตัวเลขเท่านั้น' },
            ],
            editorOptions: {
              maxLength: 10,
              onValueChanged(e) {
                if (!e.value) {
                  return
                }

                let checkSame = dataTable.option('dataSource').some(x => x.emailaddress === e.value)
                if (checkSame) {
                  toast.option({ message: `${e.value} ข้อมูลซ้ำ`, type: 'error' })
                  toast.show()
                  e.component.reset()
                  e.component.focus()
                  return
                }
              }
            },
          },
          {
            dataField: 'userid',
            editorType: 'dxSelectBox',
            label: { text: 'รหัสพนักงาย' },
            validationRules: [{ type: 'required', message: 'ต้องการรหัสพนักงาน' }],
            editorOptions: {
              searchEnabled: true,
              dataSource: [{code: '', name: ''}],
              valueExpr: 'emp_code',
              displayExpr: (e) => e && `${e.emp_name} ${e.emp_lastname} : ${e.emp_code}`,
              onValueChanged: (e) => {
                if (!e.value) {
                  return
                }

                let row = lookup.employee[e.value]
                if (!row || row?.emp_status === 'INACTIVE') {
                  toast.option({ message: 'Employee Inactived', type: 'error'})
                  toast.show()
                  e.component.reset()
                  e.component.focus()
                  return
                }

                formClone.getEditor('emp_name').option('value', row.emp_name)
                formClone.getEditor('emp_lastname').option('value', row.emp_lastname)
              }
            },
          },
          {
            dataField: 'emp_name',
            editorType: 'dxTextBox',
            label: { text: 'ชื่อพนักงาน' },
            validationRules: [{ type: 'required', message: 'ต้องการชื่อ' }],
            editorOptions: { readOnly: true },
          },
          {
            dataField: 'emp_lastname',
            editorType: 'dxTextBox',
            label: { text: 'นามสกุล' },
            validationRules: [{ type: 'required', message: 'ต้องการนามสกุล' }],
            editorOptions: { readOnly: true },
          },
          {
            dataField: 'password1',
            editorType: 'dxTextBox',
            label: { text: 'Password' },
            validationRules: [
              { type: 'required', message: 'ระบุ Password' },
              // { type: 'pattern', pattern: /^[^a-zA-Z]+$/, message: 'ภาษาไทยเท่านั้น' },
            ],
            editorOptions: {
              mode: 'password',
            },
          },
          {
            dataField: 'password2',
            editorType: 'dxTextBox',
            label: { text: 'Confirm Password' },
            validationRules: [
              { type: 'required', message: 'ระบุ Confirm Password' },
              // { type: 'pattern', pattern: /^[^a-zA-Z]+$/, message: 'ภาษาไทยเท่านั้น' },
              {
                type: 'custom',
                message: 'Password ไม่ตรงกัน',
                validationCallback: (e) => {
                  if (!e.value || !formClone.getEditor('password1').option('value')) {
                    return true
                  }

                  if (formClone.getEditor('password1').option('value') !== e.value) {
                    return
                  }

                  return true
                }
              },
            ],
            editorOptions: {
              mode: 'password',
            },
          },
          {
            dataField: 'showPass',
            editorType: 'dxCheckBox',
            label: { text: 'show password' },
            editorOptions: {
              onValueChanged: (e) => {
                formClone.getEditor('password1').option('mode', e.value ? 'text' : 'password')
                formClone.getEditor('password2').option('mode', e.value ? 'text' : 'password')
              }
            }
          },
        ],
      }).dxForm('instance')
      formClone.getEditor('userid').option('dataSource', master.employee.filter(x => x.emp_status === 'ACTIVE'))
    },
    toolbarItems: [
      {
        widget: 'dxButton',
        toolbar: 'bottom',
        location: 'after',
        options: {
          type: 'danger',
          text: 'ยกเลิก',
          onClick() {
            popup3.hide()
            formClone.option('formData', {})
            popupData.cloneRow = {}
          },
        },
      },
      {
        widget: 'dxButton',
        toolbar: 'bottom',
        location: 'after',
        options: {
          type: 'default',
          text: 'Clone',
          icon: 'save',
          onClick: async () => {
            if (!formClone.validate().isValid) {
              return
            }

            let set = formClone.option('formData')
            let sendData = {
              form: {
                userid: set.userid,
                username: set.userid,
                userpassword: CryptoJS.SHA256(set.password1).toString(),
                emailaddress: set.emailaddress,
                user_dept: popupData.cloneRow.user_dept,
                userdesc: popupData.cloneRow.userdesc,
                security: 'SOME',
                usr_name: set.emp_name,
                usr_lastname: set.emp_lastname,
              },
              clone: popupData.cloneRow,
            }

            try {
              loadPanel.show()

              let { data } = await axios.post('/cloneUser', sendData)
              if (!data.result) {
                throw new Error(data.message)
              }

              if (data.row.passworddate) data.row.passworddate = '' + dayjs().diff(data.row.passworddate, 'day')

              let rows = dataTable.option('dataSource')
              rows.push(data.row)
              dataTable.option('dataSource', rows)

              popup3.hide()
              formClone.option('formData', {})
              popupData.cloneRow = {}
            } catch (e) {
              toast.option({ message: e.message, type: 'error'})
              toast.show()
            } finally {
              loadPanel.hide()
            }
          },
        },
      }
    ],
  }).dxPopup('instance')

  async function init() {
    try {
      loadPanel.show()
      let { data } = await axios.get('/init')
      if (!data.result) {
        throw new Error(data.message)
      }

      if (data.status) {
        toast.option({ message: data.message, type: 'error' })
        toast.show()
        window.parent.location.href = 'http://hug-delphi.com'
        return
      }

      master = data.master
      let set = dataTable.option('columns')
      set[6].lookup.dataSource = master.section
      dataTable.option('columns', set)
      dataTable.option('dataSource', data.rows.map(x => {
        if (x.passworddate) x.passworddate = '' + dayjs().diff(x.passworddate, 'day')
        return x
      }))

      setLookup()

      if (master.menuMaster) {
        master.menuMaster = master.menuMaster.map(x => {
          let level0 = lookup.system_menu[x.Task_Parent_ID]
          if (!level0) {
            return { code: x.Task_Parent_ID, name: 'main menu' }
          }

          let level1 = lookup.system_menu[level0.Task_Parent_ID]
          if (!level1) {
            return { code: x.Task_Parent_ID, name: level0.Task_Subject }
          }

          return { code: x.Task_Parent_ID, name: level1.Task_Subject + ' / ' + level0.Task_Subject }
        })
      //   lookup.menuMaster = master.menuMaster.reduce((a, b) => {
      //     a[b.code] = b
      //     return a
      //   }, {})
      //   master.system_menu = master.system_menu.map(x => {
      //     x.menuMaster = lookup.menuMaster[x.Task_Parent_ID].name || ''
      //     x.view = false
      //     x.edit = true
      //     x.del = false
      //     return x
      //   })
      //   lookup.system_menu = master.system_menu.reduce((a, b) => {
      //     a[b.Task_ID] = b
      //     return a
      //   }, {})
      }
      let add = dgAdd.option('columns')
      add[2].lookup.dataSource = master.menuMaster
      dgAdd.option('columns', add)
    } catch (e) {
      console.log(e)
    } finally {
      loadPanel.hide()
    }
  }

  function setLookup() {
    lookup = {
      section: master.section.filter(x => x.sec_status === 'ACTIVE').reduce((a, b) => {
        a[b.sec_code] = b
        return a
      }, {}),
      employee: master.employee.filter(x => x.emp_status === 'ACTIVE').reduce((a, b) => {
        a[b.emp_code] = b
        return a
      }, {}),
      system_menu: master.system_menu.reduce((a, b) => {
        a[b.Task_ID] = b
        return a
      }, {}),
    }
  }

  // knockout js ช่วย สลับ page
  let vm = {
    showForm: ko.observable(),
    showFormSet2: ko.observable(false),
  }

  function setEditForm(index, row) {
    vm.showForm('edit')
    myTab.option('selectedIndex', 0)
    onChange = false
    formEdit.option('formData', {...row, index })
    formEdit.getEditor('user_dept').option('dataSource', master.section)
    onChange = true
    formEdit.getEditor('userstatus').focus()
  }

  function setAddForm() {
    vm.showForm('add')
    vm.showFormSet2(false)
    formAdd.option('formData', {})
    setDataSourceFormAdd()
    dgAdd.option('dataSource', [{idx: 0, Task_ID: '', read_only: false, can_write: false, write_delete: false }])
    formAdd.getEditor('emailaddress').focus()
  }

  $('.btnBack').click(() => vm.showForm(''))

  ko.applyBindings(vm)
})
