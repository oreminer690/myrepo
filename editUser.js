function createEditUser(e) {
    let formData = e;
    console.log('edit user',e);
    $("#editUserForm").dxPopup({
        title: "ปรับปรุงผู้ใช้งาน",
        width: "100%",
        height: "100%",
        showCloseButton: false,
        animation:false,
        contentTemplate: function (content) {
            var back1 = $('<div class="backButton">').dxButton({
                text: "ย้อนกลับ",
                icon: 'back',
                onClick(e) {
                    $("#editUserForm").dxPopup('hide')
                }
            }).appendTo(content);
            console.log('formData Data: ',formData);
            var form = $("<div>").dxForm({
                formData: formData,
                name: 'formNew',
                labelLocation: 'top',
                items: [
                    {
                        dataField: "emailaddress",
                        name: 'username',
                        label: { text: "ชื่อผู้ใช้งาน" },
                        validationRules: [{ type: 'required', message: 'Required Field' }],
                        editorOptions: {

                        }
                    }, 
                ]
            }).appendTo(content);

            var back2 = $('<div class="backButton">').dxButton({
                text: "ย้อนกลับ",
                icon: 'back',
                stylingMode: 'outlined',
    
                onClick(e) {
                    $("#editUserForm").dxPopup('hide')
                }
            }).appendTo(content);
        }
    }).dxPopup('instance');
}