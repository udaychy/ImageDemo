
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

// keep the info of the image to be uploaded
var imageToUpload = {};
// allowed extensions
var imageExt = new Array(".jpg", ".jpeg", ".png", ".bmp");

//DB
var getTablesSchema = function () {
    var image = {
        Name: "ImageTable",
        Columns: [
            {
                Name: "ImageId",
                PrimaryKey: true,
                AutoIncrement: true
            },
            {
                Name: "ImageName",
                NotNull: true,
                DataType: 'string'
            },
            {
                Name: "ImageContent",
                DataType: 'string'
            }
        ]
    };

    return [image];
}

var getDBStructure = function (dbName, tableSchema) {
    if (isNullOrEmpty(dbName) || isNullOrEmpty(tableSchema)) {
        alert("DB Name or Table Schema is not found while creating DB")
        return null;
    }

    return {
        Name: dbName,
        Tables: tableSchema
    }
}

var getDbConnection = function (database) {
    var deferredObject = $.Deferred();
    var conn;

    if (isNullOrEmpty(database) || isNullOrEmpty(database.Name)) {
        alert("No DB found while creating connection");
        deferredObject.resolve(null);
    } else {
        JsStore.isDbExist(database.Name, function (isExist) {
            conn = isExist ? new JsStore.Instance(database.Name) : new JsStore.Instance().createDb(database);
            deferredObject.resolve(conn);
        });
    }

    return deferredObject;
}

var deleteTable = function (connection, tableName) {
    var deferred = $.Deferred();
    connection.delete({
        From: tableName,
        OnSuccess: function (rowsDeleted) {
            deferred.resolve(true);
        },
        OnError: function (error) {
            alert(error.value);
        }
    });
    return deferred;
}

var saveImageToDB = function (connection, imageName, imageContent) {
    var deferred = $.Deferred();
    if (isNullOrEmpty(connection)) {
        alert("No connection found while saving image to DB")
        return;
    }

    connection.insert({
        Into: "ImageTable",
        Values: [{
                       ImageName: imageName,
                       ImageContent: imageContent
                 }],
        OnSuccess: function (rowsAffected) {
            deferred.resolve(rowsAffected);

        },
        OnError: function (error) {
            alert(error.value);
        }
    });
    return deferred;
}

var getImages = function (connection) {
    var deferred = $.Deferred();
    connection.select({
        From: "ImageTable",
        Order: {
            By: 'ImageId',
            Type: 'desc'
        },
        OnSuccess: function (results) {
            deferred.resolve(results);

        },
        OnError: function (error) {
            alert(error.value);
        }
    });
    return deferred;
}

var getImageById = function (connection, imageId) {
    var deferred = $.Deferred();
    connection.select({
        From: "ImageTable",
        Where: {
            ImageId: Number(imageId)
        },
        OnSuccess: function (results) {
            deferred.resolve(results);

        },
        OnError: function (error) {
            alert(error.value);
        }
    });
    return deferred;
}


var checkForImageFile = function (file) {
    var fileName = file.value;
    if (isNullOrEmpty(fileName) && file.files.length > 0) {
        fileName = file.files[0].name;
    }
    var isValidFile = false;

    if (!isNullOrEmpty(fileName)) {
        isValidFile = true;
    }

    while (fileName.indexOf("\\") != -1)
        fileName = fileName.slice(fileName.indexOf("\\") + 1);

    var ext = fileName.slice(fileName.indexOf(".")).toLowerCase();

    for (var i = 0; i < imageExt.length; i++) {
        isValidFile = imageExt[i] == ext;
        if (isValidFile) break;
    }

    return isValidFile;
}

var setBase64 = function (selectedFile) {
    var deferred = $.Deferred();
    var reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = function () {
        imageToUpload.Content = reader.result;
        deferred.resolve(reader.result);
    };
    reader.onerror = function (error) {
        console.log('Error: ', error);
        alert("Check console");
    };
    return deferred;
}

var previewOfImageToUpload = function () {
    $("#imageToUploadOuter").show();
    $("#imageToUpload").attr("src", imageToUpload.Content);
}

var uploadImage = function (file) {
    if (checkForImageFile(file) && file.files.length > 0) {
        imageToUpload.FileName = file.files[0].name;
        setBase64(file.files[0]).done(function () {
            previewOfImageToUpload();
        });
    } else {
        imageToUpload = {};
        log("Please only upload files that end in types:  " + (imageExt.join("  ")));
        alert("Unsupported file format. Check console")
        file.value = "";
        file.focus();
    }
}

var updateImageList = function (connection) {
    getImages(connection).done(function (images) {
        $("#uploadedImageList .panel-body").html("");
        if (images.length == 0) {
            $("#uploadedImageList .panel-body").html("<div style='text-align:center;font-size:16px;color:#777;'>No Image Found</div>");
            $("#btnClearImages").hide();
        } else {
            $.each(images, function (i, image) {
                $("#uploadedImageList .panel-body").append('<div class="image-thumbnail col-sm-2" data-id="' + image.ImageId + '"><img src="' + image.ImageContent + '" /></div>');
            });
            $("#btnClearImages").show();
        }

    });
}

$(function () {
    var connection;

    getDbConnection(getDBStructure("MyDb", getTablesSchema())).done(function (conn) {
        isNullOrEmpty(conn) && alert("No Connection found");
        connection = conn;
        updateImageList(connection);
    });

    // Drag and Drop Upload
    var $form = $('#divDragDrop');
    if (isAdvancedUpload) {
        $form.on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
        })
            .on('dragover dragenter', function () {
                $form.addClass('is-dragover');
            })
            .on('dragleave dragend drop', function () {
                $form.removeClass('is-dragover');
            })
            .on('drop', function (e) {
                uploadImage(e.originalEvent.dataTransfer);
            });
    }

    //events
    $("#addImage").click(function () {
        saveImageToDB(connection, imageToUpload.FileName, imageToUpload.Content).done(function (rowsAffected) {
            rowsAffected > 0 && updateImageList(connection);
            $("#imageToUploadOuter").hide();
            $("#inputImageUpload").val("");
        });
    });

    $("#cancelImage").click(function () {
        $("#imageToUploadOuter").hide();
        $("#imageToUpload").attr("src", "");
        $("#inputImageUpload").val("");
        imageToUpload = {};
    });

    $("#btnClearImages").click(function () {
        deleteTable(connection, 'ImageTable').done(function (isDropped) {
            isDropped && ($("#uploadedImageList .panel-body").html("<div style='text-align:center;font-size:16px;color:#777;'>No Image Found</div>"), $("#btnClearImages").hide());
        });
    });

    $(document).on("click", "#uploadedImageList .image-thumbnail", function () {
        getImageById(connection, $(this).attr("data-id")).done(function (image) {
            if (image.length > 0) {
                $("#selectedImagePreview").modal();
                $("#selectedImagePreview .modal-body").html('<img src="' + image[0].ImageContent + '"/>')
                $("#selectedImagePreview .modal-footer").html('<div style="text-align:center"><b>' + image[0].ImageName + '</b></div>')
            } else {
                alert("Image not found in DB");
            }
        })

    })
});