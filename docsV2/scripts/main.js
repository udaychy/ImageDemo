var dbName = "ImageLibrary";
var conn = new JsStore.Instance(new Worker('/scripts/jsstore.worker.min.js'));
// keep the info of the image to be uploaded
var imageToUpload = {};

$(document).ready(function () {
    initDb();
    refreshImageList();
    catchEvents();
});

function initDb() {
    conn.isDbExist(dbName).then(function (isExist) {
        if (isExist) {
            conn.openDb(dbName);
        } else {
            var db = getDBStructure()
            conn.createDb(db);
        }
    }).catch(function (err) {
        alert(err.message);
        console.log(err);
    });
}

function catchEvents() {
    // Drag and Drop Upload
    if (isAdvancedUpload) {
        var $form = $('#divDragDrop');
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
        saveImageToDB(imageToUpload.FileName, imageToUpload.Content).
        then(function (rowsAffected) {
            rowsAffected > 0 && refreshImageList();
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
        // deleteTable('ImageTable').
        clearTable('ImageTable').
        then(function () {
            $("#uploadedImageList .panel-body").html("<div style='text-align:center;font-size:16px;color:#777;'>No Image Found</div>"), $("#btnClearImages").hide();
        });
    });

    $(document).on("click", "#uploadedImageList .image-thumbnail", function () {
        getImageById($(this).attr("data-id"))
            .then(function (image) {
                if (image.length > 0) {
                    $("#selectedImagePreview").modal();
                    $("#selectedImagePreview .modal-body").html('<img src="' + image[0].ImageContent + '"/>')
                    $("#selectedImagePreview .modal-footer").html('<div style="text-align:center"><b>' + image[0].ImageName + '</b></div>')
                } else {
                    alert("Image not found in DB");
                }
            })

    })
}

//DB
var getDBStructure = function () {
    var image = {
        name: "ImageTable",
        columns: [{
                name: "ImageId",
                primaryKey: true,
                autoIncrement: true
            },
            {
                name: "ImageName",
                notNull: true,
                dataType: JsStore.DATA_TYPE.String
            },
            {
                name: "ImageContent",
                dataType: JsStore.DATA_TYPE.String
            }
        ]
    };
    return {
        name: dbName,
        tables: [image]
    }
}

var clearTable = function (tableName) {
    return conn.clear(tableName)
}

var saveImageToDB = function (imageName, imageContent) {
    return conn.insert({
        into: "ImageTable",
        values: [{
            ImageName: imageName,
            ImageContent: imageContent
        }]
    });
}

var getImages = function () {
    return conn.select({
        from: "ImageTable",
        order: {
            by: 'ImageId',
            type: 'desc'
        }
    });
}

var getImageById = function (imageId) {
    return conn.select({
        from: "ImageTable",
        where: {
            ImageId: Number(imageId)
        }
    });
}

var previewOfImageToUpload = function () {
    $("#imageToUploadOuter").show();
    $("#imageToUpload").attr("src", imageToUpload.Content);
}

var uploadImage = function (file) {
    if (isValidImage(file) && file.files.length > 0) {
        imageToUpload.FileName = file.files[0].name;
        getBase64(file.files[0]).then(function () {
            previewOfImageToUpload();
        });
    } else {
        imageToUpload = {};
        alert("Unsupported file format. Files with extension - " + allowedExtension.join(', ') + " are allowed only");
        file.value = "";
        file.focus();
    }
}

var refreshImageList = function () {
    getImages().
    then(function (images) {
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