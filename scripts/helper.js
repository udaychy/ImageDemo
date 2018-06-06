var allowedExtension = ['jpeg', 'jpg', 'png', 'gif', 'svg'];
var isNullOrEmpty = function (item) {
    return item == undefined || item == null || $.trim(item).length == 0;
}

// check weather browser supports drag and drop feature
var isAdvancedUpload = function () {
    var div = document.createElement('div');
    return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

var log = function (msg) {
    console.log(msg);
}

var isValidImage = function (file) {
    var isValidFile = false;
    var fileName;
    if (file.files.length > 0) {
        isValidFile = true
        fileName = file.files[0].name;
    } else {
        isValidFile = false;
    }
    if (isValidFile === true) {
        //check for extension
        var fileExtension = fileName.toLowerCase().split('.').pop();
        isValidFile = $.inArray(fileExtension, allowedExtension) >= 0 ? true : false;
    }
    return isValidFile;
}

var getBase64 = function (selectedFile) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = function () {
            imageToUpload.Content = reader.result;
            resolve(reader.result);
        };
        reader.onerror = function (error) {
            reject();
            alert("error occured while reading file");
            console.log('Error: ', error);
        };
    });
}