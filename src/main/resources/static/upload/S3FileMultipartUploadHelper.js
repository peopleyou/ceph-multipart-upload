/**
 * AWS S3文件分片上传，适用于大文件
 * @param file
 * @return {S3FileMultipartUploadHelper}
 * @constructor
 */
var S3FileMultipartUploadHelper = function (file) {
    var me = this;

    me.file = file;
    me.awsUrl = "http://192.168.30.23/school-repo";
    me.awsBucket = "school-repo";
    me.awsKeyId = "U2A27HEBIS06RIF3JOBC";
    me.authUrl = "http://localhost:8080/signv4_auth/";
    me.authUrlHeaders = {};
    me.partSize = 6 * 1024 * 1024;      //一个分片的大小是 6M

    me.fileName = encodeURIComponent(me.file.name);
    me.countOfParts = Math.ceil(me.file.size / me.partSize) || 1;
    me.total = me.file.size;
    me.loaded = 0;
    me.currentPart = 1;
    me.parts = [];

    /**
     * 本次分片上传id
     */
    me.uploadId = null;
    /**
     * 当前是否被取消上传
     */
    me.abort = false;
    /**
     * 当前是否取消上传成功
     */
    me.aborted = false;
    /**
     * 当前是否暂停上传
     */
    me.pause = false;
    /**
     * 当前是否有正在上传的分片
     */
    me.uploadingPart = false;
    /**
     * 当前是否上传成功
     */
    me.uploadFinished = false;
    /**
     * 直到当前分片上传成功，才取消本次分片上传，用于当前分片上传成功时的回调
     */
    me.abortOnCurrentPartUploaded = null;
    /**
     * 是否因为网络断开失败，从而导致上传失败
     */
    me.failedOnDisconnect = false;

    /**
     * 初始化连接并开始分片上传文件
     */
    me.initAndUploadFile = function () {
        //校验浏览器是否支持文件上传
        if (!me._validateBrowserVersion()) {
            throw "当前浏览器暂不支持文件上传，请使用Chrome浏览器！";
        }

        //获取本次分片上传 uploadId
        me._initMultipartUpload();
        //上传分片
        me._sendPart();
    };

    /**
     * 暂停本次分片上传
     */
    me.pauseUpload = function () {
        if (AppHelper.isNull(me.uploadId)) {
            return;
        }
        //已上传成功
        if (me.uploadFinished) {
            return;
        }

        me.pause = true;

        //直到当前分片上传成功，才取消本次分片上传
    };

    /**
     * 继续本次分片上传
     */
    me.resumeUpload = function () {
        if (AppHelper.isNull(me.uploadId)) {
            return;
        }
        //已上传成功
        if (me.uploadFinished) {
            return;
        }

        me.pause = false;

        if (!me.uploadingPart) {
            me.currentPart += 1;
            me._sendPart();
        }
    };

    /**
     * 当网络恢复连接时，断点续传
     */
    me.resumeUploadOnReOnline = function () {
        if (me.uploadFinished
            || fileMultiPartUploader.pause
            || AppHelper.isNull(me.uploadId)) {
            //上传成功或者上传暂停或者本次分片上传id未获取成功
            return;
        } else if (me.abort) {
            //取消上传
            if (!me.aborted) {
                me.abortUpload();
            }
        } else if (me.failedOnDisconnect) {
            //文件未上传完毕的时候，网络断开
            if (me.uploadingPart) {
                //正在上传一个分片，则重新上传当前分片
                me._sendPart();
            } else {
                //已上传完一个分片，则从下一个分片开始上传
                me.currentPart += 1;
                me._sendPart();
            }

            me.failedOnDisconnect = false;
       }
    };

    /**
     * 取消本次分片上传
     */
    me.abortUpload = function () {
        if (AppHelper.isNull(me.uploadId)) {
            return;
        }
        //已上传成功
        if (me.uploadFinished) {
            return;
        }

        me.abort = true;

        //直到当前分片上传成功，才取消本次分片上传
        if (me.uploadingPart) {
            me.abortOnCurrentPartUploaded = me._doAbortUpload;
        } else {
            me._doAbortUpload();
        }
    };
    /**
     * 取消本次分片上传
     */
    me._doAbortUpload = function () {
        var suffixToSign = '?uploadId=' + me.uploadId;

        var dateGmt = new Date().toUTCString();
        var signatureForAbort = me._signRequest('DELETE', suffixToSign, '', dateGmt);
        if (AppHelper.isNull(signatureForAbort)) {
            return;
        }

        var xhr = me._getXmlHttp();
        xhr.open('DELETE', me._joinUrlElements(me.awsUrl, '/' + me.fileName + suffixToSign));         //TODO: 这里的 me.fileName需要换成 me.fileUUID
        xhr.setRequestHeader('Authorization', 'AWS ' + me.awsKeyId + ':' + signatureForAbort);
        xhr.setRequestHeader('x-amz-date', dateGmt);
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('Abort');
                    //TODO: 取消本次分片上传回调
                    me._onMultipartUploadAbort();
                }
            }
        };
        xhr.send(null);
    };

    /**
     * 上传所有分片
     */
    me._sendPart = function () {
        var fromByte,
            toByte,
            suffixToSign,
            blob;

        if (me.parts.length == me.countOfParts) {
            //完成本次分片上传
            suffixToSign = '?uploadId=' + me.uploadId;

            var dateGmt = new Date().toUTCString();
            var signatureForCompleteUpload = me._signRequest('POST', suffixToSign, 'application/xml; charset=UTF-8', dateGmt);
            if (AppHelper.isNull(signatureForCompleteUpload)) {
                return;
            }

            me._completeMultipartUpload(signatureForCompleteUpload, dateGmt, suffixToSign);

            console.log('Try to complete');
            return;
        }

        fromByte = (me.currentPart - 1) * me.partSize;  // me.currentPart starts from 1
        toByte = me.currentPart * me.partSize;
        blob = me.file.slice(fromByte, toByte);
        suffixToSign = '?partNumber=' + me.currentPart + '&uploadId=' + me.uploadId;

        var dateGmt = new Date().toUTCString();
        var signatureForSendPart = me._signRequest('PUT', suffixToSign, '', dateGmt);
        if (AppHelper.isNull(signatureForSendPart)) {
            return;
        }

        //递归调用上传分片
        me._doSendPart(signatureForSendPart, dateGmt, suffixToSign, blob);
    };
    /**
     * 上传单个分片
     */
    me._doSendPart = function (signatureForSendPart, dateGmt, suffixToSign, blob) {
        var xhr = me._getXmlHttp(),
            ETag;
        xhr.open('PUT', me._joinUrlElements(me.awsUrl, '/' + me.fileName + suffixToSign));            //TODO: 这里的 me.fileName需要换成 me.fileUUID
        xhr.setRequestHeader('Authorization', 'AWS ' + me.awsKeyId + ':' + signatureForSendPart);
        xhr.setRequestHeader('x-amz-date', dateGmt);

        if (xhr.upload) {
            xhr.upload.addEventListener("progress", function (prog) {
                //TODO: 上传进度变更的回调
                me._onProgressChanged(me.total, me.loaded + prog.loaded);
            }, false);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    ETag = xhr.getResponseHeader('ETag');
                    console.log('ETag = ' + ETag + ' For part #' + me.currentPart);
                    me.parts.push(ETag);

                    me.loaded += blob.size;
                    //TODO: 在这里需要考虑断点续传的问题
                    //TODO: 上传分片成功的回调
                    me._onPartUpload(ETag, me.currentPart);

                    //如果取消上传/暂停上传，则上传完当前分片后，不需要再上传后续
                    if (!me.abort && !me.pause) {
                        me.currentPart += 1;

                        //递归调用上传分片
                        setTimeout(function () {  // to avoid recursion
                            me._sendPart();
                        }, 50);
                    }
                } else if (xhr.readyState == 0) {
                    //on_abort 错
                    //TODO: 在这里需要考虑重传的问题
                } else {
                    //非200错
                    //TODO: 在这里需要考虑重传的问题
                }
            }
        };

        if (!me.abort && !me.pause) {
            xhr.send(blob);
            //当前正在上传分片
            me.uploadingPart = true;
        }
    };

    /**
     * 完成本次分片上传
     */
    me._completeMultipartUpload = function (signatureForCompleteUpload, dateGmt, suffixToSign) {
        var xhr = me._getXmlHttp(),
            completeDoc = '<CompleteMultipartUpload>';
        xhr.open('POST', me._joinUrlElements(me.awsUrl, '/' + me.fileName + suffixToSign));         //TODO: 这里的 me.fileName需要换成 me.fileUUID
        xhr.setRequestHeader('Authorization', 'AWS ' + me.awsKeyId + ':' + signatureForCompleteUpload);
        xhr.setRequestHeader('Content-Type', 'application/xml; charset=UTF-8');
        xhr.setRequestHeader('x-amz-date', dateGmt);
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    console.log('END');
                    //TODO: 上传完成回调
                    me._onMultipartUploadComplete();
                }
            }
        };

        me.parts.forEach(function(ETag, partNumber){
            completeDoc += '<Part><PartNumber>' + (partNumber + 1) + '</PartNumber><ETag>' + ETag + '</ETag></Part>';
        });
        completeDoc += '</CompleteMultipartUpload>';
        xhr.send(completeDoc);
    };

    /**
     * 获取本次分片上传 uploadId
     */
    me._initMultipartUpload = function () {
        var dateGmt = new Date().toUTCString();
        var signatureForGetUploadId = me._signRequest('POST', '?uploads', '', dateGmt);
        if (AppHelper.isNull(signatureForGetUploadId)) {
            return;
        }

        me.uploadId = me._doGetUploadId(signatureForGetUploadId, dateGmt);

        if (AppHelper.isNull(me.uploadId)) {
            throw "获取本次分片上传 uploadId 失败";
        }
    };
    /**
     * 获取本次分片上传 uploadId
     */
    me._doGetUploadId = function (signatureForGetUploadId, dateGmt) {
        var xhr = me._getXmlHttp(),
            uploadId;

        xhr.open('POST', me._joinUrlElements(me.awsUrl, '/' + me.fileName + '?uploads'), false);           //TODO: 这里的 me.fileName需要换成 me.fileUUID
        xhr.setRequestHeader('Authorization', 'AWS ' + me.awsKeyId + ':' + signatureForGetUploadId);
        xhr.setRequestHeader('x-amz-date', dateGmt);

        xhr.send(null);

        //同步接受响应
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                //实际操作
                uploadId = xhr.response.match(/<UploadId\>(.+)<\/UploadId\>/);
                if (uploadId && uploadId[1]) {
                    me.uploadId = uploadId[1];
                    me._onGetUploadId();
                }
            }
        }

        if (AppHelper.isNull(me.uploadId)) {
            layer.open({
                title: '系统提示',
                area: ['460px', '240px'],
                content: '<div class="system-tips"><span>！</span><p>服务端获取本次分片上传 uploadId 失败</p></div>'
            });
        }

        return me.uploadId;
    };

    /**
     * 获取本次分片上传 uploadId 的回调
     */
    me._onGetUploadId = function () {
        console.log('获取本次分片上传 uploadId 成功: ' + me.uploadId);
    };
    /**
     * 上传进度变更回调
     */
    me._onProgressChanged = function (total, loaded) {
        if (!me.pause) {
            console.log("上传进度变更回调：upload percent=" + (loaded / total * 100).toFixed(2) + "%");
            $("#divUploadProgress").empty();
            $("#divUploadProgress").append(me._buildUploadProgress(total, loaded));
        } else {
            console.log("上传进度变更回调：当前是暂停状态");
            $("#divUploadProgress").empty();
            $("#divUploadProgress").append(me._buildUploadProgress(total, loaded));
            $("#divUploadProgress").append("<span>上传进度变更回调：当前是暂停状态</span>");
        }
    };
    me._buildUploadProgress = function (total, loaded) {
        return "<span>上传进度变更回调：upload percent=" + (loaded / total * 100).toFixed(2) + "%" + "</span><br>";
    };
    /**
     * 上传分片成功回调
     */
    me._onPartUpload = function (ETag, currentPart) {
        console.log("上传分片成功回调：ETag=" + ETag + "; currentPart=" + currentPart);

        me.uploadingPart = false;

        if (typeof me.abortOnCurrentPartUploaded == "function") {
            me.abortOnCurrentPartUploaded();
        }
    };
    /**
     * 上传完成回调
     */
    me._onMultipartUploadComplete = function () {
        console.log("上传完成回调");

        me.uploadFinished = true;
    };
    /**
     * 取消本次分片上传成功回调
     */
    me._onMultipartUploadAbort = function () {
        console.log("取消本次分片上传回调");

        me.aborted = true;

        //释放浏览器空间
        me.file = null;
        me.parts = [];
    };


    /******************************以下是私有方法****************************/
    /******************************以下是私有方法****************************/
    /******************************以下是私有方法****************************/
    /******************************以下是私有方法****************************/

    /**
     * s3 获取请求签名
     */
    me._signRequest = function (method, suffixToSign, contentType, dateGmt) {
        var xhr = me._getXmlHttp(),
            signature,
            toSign = method + '\n\n' + contentType +
                '\n\nx-amz-date:' + dateGmt + '\n/'
                + me.awsBucket + '/' + me.fileName                          //TODO: 这里的 me.fileName需要换成 me.fileUUID
                + suffixToSign;

        xhr.open('GET', me._joinUrlElements(me.authUrl, '/?to_sign=' + encodeURIComponent(toSign)), false);

        xhr.send(null);

        //同步接受响应
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                //实际操作
                signature = xhr.response;
            }
        }

        if (AppHelper.isNull(signature)) {
            throw "服务端获取请求签名失败";
        }

        return signature;
    };

    /**
     * 获取 xhr ajax 请求对象
     */
    me._getXmlHttp = function () {
        var xmlhttp;
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (E) {
                xmlhttp = false;
            }
        }
        if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
            xmlhttp = new XMLHttpRequest();
        }
        xmlhttp.onerror = function () {
            //需要考虑重传的问题
            console.log("ceph 服务器请求失败，可能是网络断开");
            me.failedOnDisconnect = true;
        };
        return xmlhttp;
    };

    /**
     * 构建请求url
     * @return {string}
     * @private
     */
    me._joinUrlElements = function () {
        var re1 = new RegExp('^\\/|\\/$', 'g'),
            elts = Array.prototype.slice.call(arguments);
        return elts.map(function (element) {
            return element.replace(re1, "");
        }).join('/');
    };

    /**
     * 校验浏览器是否支持文件上传
     */
    me._validateBrowserVersion = function () {
        var supported = !((typeof(File) == 'undefined') || (typeof(Blob) == 'undefined') ||
        !(!!Blob.prototype.webkitSlice || !!Blob.prototype.mozSlice || Blob.prototype.slice));

        return supported;
    };

    return me;
}