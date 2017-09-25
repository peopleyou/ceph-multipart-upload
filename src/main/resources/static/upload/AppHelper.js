// Private array of chars to use
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

var AppHelper = AppHelper || {
        profile: profile.DEV,                         //当前是开发阶段

        diskServerApplicationUri: "/disk-service",    //cloud-disk-server 在 Eureka 中的 serviceId

        diskUiApplicationUri: "/disk-ui",             //web-ui 在 Eureka 中的 serviceId

        workingUiApplicationUri: "/working",          //working-ui 在 Eureka 中的 serviceId

        diskCheckUri: "/disk-service/disk/check",     //cloud-disk-server 中迎检访问 uri

        TOKEN_KEY: "jwtToken"                         //jwt token
    };

(function ($) {
    AppHelper = $.extend(AppHelper, {
        isNull: function (obj) {
            return typeof obj == "undefined" || obj == null;
        },
        String: {
            isEmpty: function (str) {
                return AppHelper.isNull(str) || str.toString().length == 0;
            },
            /**
             * 格式化字符串模板参数
             * @param strTemplate
             * @param args
             * @returns {AppHelper}
             */
            format: function (strTemplate, args) {
                var result = strTemplate;
                if (args.length > 0) {
                    for (var i = 0; i < args.length; i++) {
                        if (args[i] != undefined) {
                            //var reg = new RegExp("({[" + i + "]})", "g");//这个在索引大于9时会有问题
                            var reg = new RegExp("({)" + i + "(})", "g");
                            result = result.replace(reg, args[i]);
                        }
                    }
                }
                return result;
            },
            /**
             * 指定的字符串是否是url
             * @param str_url
             * @return {boolean}
             */
            isUrl: function (str_url){
                var strRegex = "^((https|http|ftp|rtsp|mms)?://)"
                    + "?(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?" //ftp的user@
                    + "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184
                    + "|" // 允许IP和DOMAIN（域名）
                    + "([0-9a-zA-Z_!~*'()-]+\.)*" // 域名- www.
                    + "([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z]\." // 二级域名
                    + "[a-zA-Z]{2,6})" // first level domain- .com or .museum
                    + "(:[0-9]{1,4})?" // 端口- :80
                    + "((/?)|"
                    + "(/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+/?)$";
                var re=new RegExp(strRegex);
                return re.test(str_url);
            }
        },
        Array: {
            isEmpty: function (arry) {
                if (!arry instanceof Array) {
                    return false;
                }

                return AppHelper.isNull(arry) || arry.length == 0
            },
            toString: function (arry) {
                if (arry.length < 1) {
                    return "";
                }
                if (arry.length < 2) {
                    return arry[0];
                }
                var ids = "";
                for (var i = 0; i < arry.length; i++) {
                    ids += arry[i];
                    if (!AppHelper.isNull(arry[i + 1])) {
                        ids += ",";
                    }
                }
                return ids;
            },
            /**
             * 指定的数组是否包含指定的元素
             * @param arry
             * @param item
             * @returns {boolean}
             */
            contains: function (arry, item) {
                if (arry.length < 1) {
                    return false;
                }
                if (AppHelper.isNull(item)) {
                    return false;
                }

                for (var i = 0; i < arry.length; i++) {
                    if (item == arry[i]) {
                        return true
                    }
                }

                return false;
            }
        },
        Ajax: {
            successFlag: 200,
            failFlag: 500,
            /**
             * （必填）url: 访问地址
             * （可选）async: 是否异步，默认是异步请求
             * （可选）method: 请求方式：POST, GET
             * （可选）form: 查询表单id
             * （可选）params: 查询参数
             * （可选）onBefore: 在发送请求前调用
             * （可选）maskId: 蒙板id
             * （可选）maskLabel: 蒙板上显示的提示信息
             * （可选）updateId: 成功后更新的元素id
             * （可选）onSuccess: 成功后调用
             * （可选）onError: 错误时调用
             * （可选）headers: 请求 Header, 默认带 jwt token
             * （可选）needServerAuthorizationHeader: 是否需要带 jwt token，默认为是
             *
             * @param options
             */
            send: function (url, options) {
                if (AppHelper.String.isEmpty(url)) {
                    alert("您没有设置提交的地址！");
                    return;
                }

                options = options || {};

                options.async = (AppHelper.isNull(options.async) ? true : options.async);
                options.method = options.method || "GET";

                if (AppHelper.isNull(options.needServerAuthorizationHeader)) {
                    options.needServerAuthorizationHeader = true;
                }

                options.headers = $.extend({}, options.headers || {});
                if (options.needServerAuthorizationHeader) {
                    options.headers = $.extend({}, options.headers, AppHelper.Jwt.createAuthorizationTokenHeader());
                }

                var vUrl = url;
                var vAsync = options.async;
                var vMethod = options.method;
                var vHeaders = options.headers;
                var vParam;
                if (options.form) {
                    vParam = $("#" + options.form).serialize();
                }
                if (options.params && !($.isEmptyObject(options.params))) {
                    if (vParam && vParam.length) {
                        vParam = vParam + "&" + $.param(options.params);
                    } else {
                        vParam = $.param(options.params);
                    }
                }

                if (options.onBefore) {
                    options.onBefore();
                }

                if (options.maskId) {
                    $("#" + options.maskId).fadeIn(200);
                    $("#" + options.maskLabel).fadeIn(400);
                }

                $.ajax({
                    type: vMethod,
                    url: vUrl,
                    async: vAsync,
                    data: vParam,
                    headers: vHeaders,
                    success: function (data, textStatus) {
                        if (options.maskId) {
                            //$("#" + options.maskId).unmask();
                            $("#" + options.maskId).fadeOut(800);
                            $("#" + options.maskLabel).fadeOut(800);
                        }
                        if (options.updateId) {
                            $("#" + options.updateId).html(data);
                        }
                        if (options.onSuccess) {
                            options.onSuccess(data, textStatus);
                        }
                    },
                    error: function (res, textStatus, errorThrown) {
                        if (options.maskId) {
                            //$("#" + options.maskId).unmask();
                            $("#" + options.maskId).fadeOut(800);
                            $("#" + options.maskLabel).fadeOut(800);
                        }
                        if (options.onError) {
                            options.onError(res, textStatus, errorThrown);
                        }
                    }
                });

                if (options.onAfter) {
                    options.onAfter();
                }
            },
            /**
             * 通过ajax，以FormData上传文件
             * @param url
             * @param multiplePartFormId: 该 form 需要指定 enctype="multipart.." 属性
             * @param file: 待上传的文件对象
             * @param （可选）onProgress: 绑定上传进度的回调函数
             * @param （可选）uploadComplete: 绑定上传成功的回调函数
             * @param （可选）uploadFailed: 绑定上传失败的回调函数
             * @param （可选）uploadCanceled: 绑定取消上传的回调函数
             * @param （可选）onLoadEnd: 发送请求后，最终的一个回调函数，用于确保文件上传状态的更新
             */
            sendFormData: function (url, multiplePartFormId, file, options) {
                if (AppHelper.String.isEmpty(url)) {
                    layer.open({"title": "警告", content: "未指定参数：url"});
                    return;
                }
                if (AppHelper.String.isEmpty(multiplePartFormId)) {
                    layer.open({"title": "警告", content: "未指定参数：multiplePartFormId"});
                    return;
                }
                if (AppHelper.isNull(file)) {
                    layer.open({"title": "警告", content: "未指定参数：file"});
                    return;
                }

                options = options || {};

                var formData = new FormData($("#" + multiplePartFormId)[0]);
                formData.append("file", file);
                var xhr = $.ajax({
                    url: url,
                    type: 'POST',
                    data: formData,
                    cache: false,
                    contentType: false,
                    processData: false,
                    xhr: function() {
                        var xhr = $.ajaxSettings.xhr();

                        //绑定上传进度的回调函数
                        if (typeof options.onProgress == "function") {
                            xhr.upload.addEventListener('progress', options.onProgress, false);
                        }
                        if (typeof options.uploadComplete == "function") {
                            xhr.addEventListener("load", options.uploadComplete, false);
                        }
                        if (typeof options.uploadFailed == "function") {
                            xhr.addEventListener("error", options.uploadFailed, false);
                        }
                        if (typeof options.uploadCanceled == "function") {
                            xhr.addEventListener("abort", options.uploadCanceled, false);
                        }
                        if (typeof options.onLoadEnd == "function") {
                            xhr.addEventListener("loadend", options.onLoadEnd, false);
                        }

                        return xhr;//一定要返回，不然jQ没有XHR对象用了
                    }
                });

                return xhr;
            }
        },
        Json: {
            /**
             * Json To String
             * @param jsonObj
             * @returns {*}
             */
            toString: function (jsonObj) {
                if (!jsonObj) {
                    return null;
                }
                if (JSON.stringify) {
                    return JSON.stringify(jsonObj);
                } else {
                    var ary = [];
                    for (p in jsonObj) {
                        if (p === '$class')
                            continue;
                        ary.push("\"" + p + "\":" + jsonObj[p] + "\"");
                    }
                    return "{" + ary.join(",") + "}";
                }
            },
            /**
             * String To Json
             * @param jsonStr
             * @returns {*}
             */
            valueOf: function (jsonStr) {
                if (!jsonStr) {
                    return null;
                }
                if (JSON.parse) {
                    return JSON.parse(jsonStr);
                } else {
                    return $.parseJSON(jsonStr);
                }
            },
            isEmpty: function (obj) {
                var flag = true;
                if (!AppHelper.isNull(obj)) {
                    for (var p in obj) {
                        flag = false;
                        break;
                    }
                }
                return flag;
            }
        },
        Url: {
            /**
             * 根据请求uri获取 disk-service 完整请求路径
             */
            getManageUrl: function (uri, paramJson) {
                paramJson = paramJson || {};

                var queryContent = $.param(paramJson);
                if (!AppHelper.String.isEmpty(queryContent)) {
                    uri += ("?" + queryContent);
                }

                if (profile.TEST == AppHelper.profile || profile.PRODUCT == AppHelper.profile) {
                    uri = AppHelper.diskServerApplicationUri + uri;
                }

                return uri;
            },
            /**
             * 根据请求uri获取 disk-ui 完整请求路径
             */
            getDiskUiUrl: function (uri, paramJson) {
                paramJson = paramJson || {};

                var queryContent = $.param(paramJson);
                if (!AppHelper.String.isEmpty(queryContent)) {
                    uri += ("?" + queryContent);
                }

                if (profile.TEST == AppHelper.profile || profile.PRODUCT == AppHelper.profile) {
                    uri = AppHelper.diskUiApplicationUri + uri;
                }

                return uri;
            },
            /**
             * 根据请求uri获取 working-ui 完整请求路径
             */
            getWorkingUiUrl: function (uri, paramJson) {
                paramJson = paramJson || {};

                var queryContent = $.param(paramJson);
                if (!AppHelper.String.isEmpty(queryContent)) {
                    uri += ("?" + queryContent);
                }

                uri = AppHelper.workingUiApplicationUri + uri;

                return uri;
            },
            /**
             * 获取列表图标uri前缀
             * @param fromDiskCheck 是否来自于迎检
             */
            getTableRowIconUriPrefix : function (fromDiskCheck) {
                var vFromDiskCheck = false;
                if (AppHelper.isNull(fromDiskCheck)) {
                    vFromDiskCheck = true;
                }

                if (AppHelper.profile == profile.DEV) {
                    if (vFromDiskCheck) {
                        return "../../../../"
                    } else {
                        return "";
                    }
                } else {
                    return AppHelper.diskUiApplicationUri;
                }
            },
            /**
             * 根据请求uri获取 迎检系统 完整请求路径
             */
            getDiskCheckUrl: function (uri, paramJson) {
                paramJson = paramJson || {};

                var queryContent = $.param(paramJson);
                if (!AppHelper.String.isEmpty(queryContent)) {
                    uri += ("?" + queryContent);
                }

                if (profile.TEST == AppHelper.profile || profile.PRODUCT == AppHelper.profile) {
                    uri = AppHelper.diskCheckUri + uri;
                } else {
                    uri = "/disk/check" + uri;
                }

                return uri;
            },
            /**
             * 从当前的url get请求路径中获取指定参数值
             * @param search：get请求查询参数
             * @param fieldName：参数名称
             * @return {*}
             */
            getParamFromGetUrl: function (search, fieldName) {
                if (AppHelper.String.isEmpty(search)) {
                    return null;
                }

                var vSearch = search.substring(1);      //去掉问号
                var pathParamArry = vSearch.split("&");

                var pathParamItem = null;
                var paramName = null;
                var paramValue = null;
                for (var i = 0; i < pathParamArry.length; i++) {
                    pathParamItem = pathParamArry[i];
                    paramName = pathParamItem.split("=")[0];
                    if (paramName == fieldName) {
                        paramValue = pathParamItem.split("=")[1];
                        return paramValue;
                    }
                }

                return null;
            }
        },
        Dict: {
            /**
             * 获取指定类型的字典项
             * @param type
             * @param value
             * @returns json
             */
            getSysDictItem: function (type, value) {
                var result = {};

                if (AppHelper.String.isEmpty(type)) {
                    layer.open({title: '警告', content: '未指定参数:type'});
                }
                if (AppHelper.String.isEmpty(value)) {
                    layer.open({title: '警告', content: '未指定参数:value'});
                }

                var url = AppHelper.Url.getManageUrl("/dictionary/" + type + "/" + value);

                AppHelper.Ajax.send(url, {
                    async: false,
                    onSuccess: function (data, textStatus) {
                        result = data;
                    },
                    onError: function (res, textStatus, errorThrown) {
                        layer.open({
                            title: '温馨提示',
                            content: '系统异常'
                        });
                    }
                });

                return result;
            },
            /**
             * 获取指定类型的字典项lable
             * @param type
             * @param value
             * @returns {*}
             */
            getSysDictItemLable: function (type, value) {
                var dictFormTarget = AppHelper.Dict.getSysDictItem(type, value);
                if (AppHelper.isNull(dictFormTarget) || AppHelper.isNull(dictFormTarget.lable)) {
                    return "";
                }
                return dictFormTarget.lable;
            },
            /**
             * 获取指定类型的字典项列表
             * @param type
             * @returns jsonArray
             */
            getSysDictList: function (type) {
                if (AppHelper.String.isEmpty(type)) {
                    layer.open({title: '警告', content: '未指定参数:type'});
                    return [];
                }

                var url = AppHelper.Url.getManageUrl("/dictionary/" + type);

                AppHelper.Ajax.send(url, {
                    async: false,
                    onSuccess: function (data, textStatus) {
                        return data;
                    },
                    onError: function (res, textStatus, errorThrown) {
                        layer.open({title: '温馨提示', content: '系统异常'});
                        return [];
                    }
                });

                return [];
            }
        },
        Form: {
            /**
             * 将指定表单中的数据转换为json
             * @param formDiv
             */
            formData2Json: function (formDiv) {
                if (AppHelper.String.isEmpty(formDiv)) {
                    layer.open({title: '警告', content: '未指定参数: formDiv'});
                    return {};
                }

                if (formDiv.substring(0, 1) != "#") {
                    formDiv = "#" + formDiv;
                }

                var data = $(formDiv).serialize();
                if (AppHelper.String.isEmpty(data)) {
                    return {};
                }
                data = data.replace(/&/g, "\",\"");
                data = data.replace(/=/g, "\":\"");
                data = "{\"" + data + "\"}";
                return JSON.parse(data);
            }
        },
        Jwt: {
            getJwtToken: function () {
                return localStorage.getItem(AppHelper.TOKEN_KEY);
            },
            /**
             * 构建jwt认证header
             * @returns {*}
             */
            createAuthorizationTokenHeader: function () {
                var token = AppHelper.Jwt.getJwtToken();
                if (token) {
                    return {"Authorization": token};
                } else {
                    return {};
                }
            }
        },
        UUID: {
            generateUUID: function () {
                var chars = CHARS, uuid = [], i;
                var radix = radix || chars.length;

                // Compact form
                for (i = 0; i < 32; i++) uuid[i] = chars[0 | Math.random()*radix];

                return uuid.join('');
            }
        },
        IFrame: {
            /**
             * 绑定表单提交回调
             * @param iframeId
             * @param callBackAfterSubmit
             */
            attachFormSubmit: function (iframeId, callBackAfterSubmit) {
                if (AppHelper.String.isEmpty(iframeId)) {
                    layer.open({title: '警告', content: '未指定参数: iframeId'});
                    return;
                }
                if (AppHelper.isNull(callBackAfterSubmit)) {
                    layer.open({title: '警告', content: '未指定参数: callBackAfterSubmit'});
                    return;
                }

                if (window.attachEvent) {
                    document.getElementById(iframeId).attachEvent('onload', callBackAfterSubmit);
                } else {
                    document.getElementById(iframeId).addEventListener('load', callBackAfterSubmit, false);
                }
            },
            /**
             * 将表单提交回调返回的内容转换为 JSONObject
             * @param iframeId
             * @returns json
             */
            parseCallBackToJson: function (iframeId) {
                var ifm = document.getElementById(iframeId);
                var responseText;
                try {
                    if (ifm.contentWindow) {
                        responseText = ifm.contentWindow.document.body ? ifm.contentWindow.document.body.innerHTML : null;
                    } else if (ifm.contentDocument) {
                        responseText = ifm.contentDocument.document.body ? ifm.contentDocument.document.body.innerHTML : null;
                    }
                } catch (e) {
                    alert(e);
                }

                var reg = /<pre.+?>(.+)<\/pre>/g;
                responseText.match(reg);
                var jsonResult = RegExp.$1;
                var data = JSON.parse(jsonResult);

                if (data.code == '200') {
                    data.successMsg = data.successMsg.replace(/&lt;br\/&gt;/g, "<br/>");
                } else if (data.code == '500'){
                    data.errorMsg = data.errorMsg.replace(/&lt;br\/&gt;/g, "<br/>");
                }

                return data;
            }
        },
        File: {
            //文件大小
            KB : 1024,
            MB : 1024 * 1024,
            GB : 1024 * 1024 * 1024,

            /**
             * 格式化文件大小
             * @param fileSize
             * @param fromServer: 是否来自后台，如果来自后台，则单位是KB，前端的单位是B
             */
            formatFileSize : function (fileSize, fromServer) {
                var fileSize = fileSize || 0;
                if (isNaN(fileSize)) {
                    fileSize = 0;
                }

                var vFromServer = false;
                if (!AppHelper.isNull(fromServer)) {
                    vFromServer = fromServer;
                }

                if (vFromServer) {
                    fileSize *= AppHelper.File.KB;
                }

                var fileSizeFormat = "";
                if (fileSize / AppHelper.File.GB > 1) {
                    fileSizeFormat = (fileSize / AppHelper.File.GB).toFixed(2) + "GB";
                } else if (fileSize / AppHelper.File.MB > 1) {
                    fileSizeFormat = (fileSize / AppHelper.File.MB).toFixed(2) + "MB";
                } else if (fileSize / AppHelper.File.KB > 1) {
                    fileSizeFormat = (fileSize / AppHelper.File.KB).toFixed(2) + "KB";
                } else {
                    fileSizeFormat = fileSize.toFixed(2) + "B";
                }

                return fileSizeFormat;
            },

            //多个文件同时显示时，最大显示字符数
            FILE_NAMES_MAX_LENGTH: 15,

            /**
             * 格式化多个文件的名称
             */
            formatFilename: function (fileNames) {
                if (AppHelper.Array.isEmpty(fileNames)) {
                    return "";
                }

                if (fileNames.length == 1) {
                    return fileNames[0];
                }

                var strFilename = fileNames.join(",");
                if (strFilename.length > AppHelper.File.FILE_NAMES_MAX_LENGTH) {
                    strFilename = strFilename.substr(0, AppHelper.File.FILE_NAMES_MAX_LENGTH);
                    strFilename += "...(共" + fileNames.length + "项)";
                }

                return strFilename;
            },
            /**
             * 格式化多个文件的名称，用于分享名称
             */
            formatShareName: function (fileNames) {
                if (fileNames.length == 1) {
                    return fileNames[0];
                } else if (fileNames.length > 1) {
                    return fileNames[0] + " 等";
                }

                return "";
            }
        },
        Number: {
            /**
             * 取介于 lowerValue 和 upperValue 之间（包括 lowerValue 和 upperValue）的一个整数值
             */
            selectIntFrom: function (lowerValue, upperValue) {
                var choices = upperValue - lowerValue + 1;
                return Math.floor(Math.random() * choices + lowerValue);
            },
            /**
             * 取介于 lowerValue 和 upperValue 之间（包括 lowerValue 和 upperValue）的一个浮点值
             */
            selectFloatFrom: function (lowerValue, upperValue) {
                var choices = upperValue - lowerValue + 1;
                return Math.random() * choices + lowerValue;
            }
        },
        Date: {
            /**
             * 转换字符串为日期对象
             * @param dateStr
             * @return {Date}
             */
            parseDate: function (dateStr) {
                return new Date(dateStr);
            },
            /**
             * 格式化显示日期对象
             * @param date
             * @return {string}
             */
            formatDate: function (date, format) {
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate();
                var hour = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();

                month = (month < 10 ? "0" + month : month);
                day = (day < 10 ? "0" + day : day);
                hour = (hour < 10 ? "0" + hour : hour);
                minutes = (minutes < 10 ? "0" + minutes : minutes);
                seconds = (seconds < 10 ? "0" + seconds : seconds);

                if ("yyyy-MM-dd" == format) {
                    return year + "-" + month + "-" + day;
                } else if ("yyyy-MM-dd HH:mm:ss" == format) {
                    return year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":" + seconds;
                } else if ("yyyy-MM-dd HH:mm" == format) {
                    return year + "-" + month + "-" + day + " " + hour + ":" + minutes;
                }
            },
            /**
             * 获取几天之前
             * @param date
             * @param days
             * @returns {Date}
             */
            addDays: function (date, days) {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
            },
            /**
             * 获取几周之前
             * @param date
             * @param weeks
             * @returns {Date}
             */
            addWeeks: function (date, weeks) {
                return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7 * weeks);
            },
            /**
             * 获取几月之前
             * @param date
             * @param months
             * @returns {Date}
             */
            addMonths: function (date, months) {
                return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
            },
        },
    });
})(jQuery);